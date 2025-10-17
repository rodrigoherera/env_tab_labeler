// popup.js
const statusBadge = document.getElementById("statusBadge");
const ruleDetails = document.getElementById("ruleDetails");
const noRuleMessage = document.getElementById("noRuleMessage");
const errorMessage = document.getElementById("errorMessage");
const toggleBtn = document.getElementById("toggleBtn");
const optionsBtn = document.getElementById("optionsBtn");
const versionEl = document.getElementById("version");
const hotkeyHint = document.getElementById("hotkeyHint");

const detailLabel = document.getElementById("detailLabel");
const detailMatch = document.getElementById("detailMatch");
const detailMode = document.getElementById("detailMode");
const detailBadge = document.getElementById("detailBadge");
const detailScope = document.getElementById("detailScope");

const STATUS_CLASSES = [
  "status--loading",
  "status--active",
  "status--hidden",
  "status--disabled",
  "status--inactive",
];

let activeTabId = null;
let currentState = null;

function setStatus(type, text) {
  STATUS_CLASSES.forEach((cls) => statusBadge.classList.remove(cls));
  statusBadge.classList.add(type);
  statusBadge.textContent = text;
}

function describeMatch(rule) {
  if (!rule.pattern) return "Scope only";
  switch (rule.matchType) {
    case "hostname":
      return `Hostname contains “${rule.pattern}”`;
    case "url":
      return `URL contains “${rule.pattern}”`;
    case "regex":
      return `Regex ${rule.pattern}`;
    default:
      return `Substring “${rule.pattern}”`;
  }
}

function describeMode(rule) {
  const applied = rule.appliedMode || "ribbon";
  if (rule.mode) {
    return `${applied} (override)`;
  }
  return `${applied} (default)`;
}

function describeBadge(rule) {
  const applied = rule.appliedShowBadge ? "On" : "Off";
  if (typeof rule.showBadge === "boolean") {
    return `${applied} (override)`;
  }
  return `${applied} (default)`;
}

function describeScope(scope) {
  if (!scope) return "—";
  const parts = [];
  if (scope.host) parts.push(`host contains “${scope.host}”`);
  if (scope.path) parts.push(`path contains “${scope.path}”`);
  if (scope.protocol) parts.push(`protocol ${scope.protocol.toUpperCase()}`);
  if (scope.port) parts.push(`port ${scope.port}`);
  return parts.length ? parts.join(", ") : "—";
}

function updateToggleButton(state) {
  if (!state || !state.rule || state.enabled === false) {
    toggleBtn.disabled = true;
    toggleBtn.textContent = "Toggle Overlay";
    return;
  }
  toggleBtn.disabled = false;
  toggleBtn.textContent = state.hidden ? "Show Overlay" : "Hide Overlay";
}

function renderState(state) {
  currentState = state;
  errorMessage.classList.add("hidden");

  if (!state) {
    setStatus("status--inactive", "Unavailable");
    ruleDetails.classList.add("hidden");
    noRuleMessage.classList.remove("hidden");
    updateToggleButton(state);
    return;
  }

  if (state.enabled === false) {
    setStatus("status--disabled", "Extension disabled");
    ruleDetails.classList.add("hidden");
    noRuleMessage.classList.add("hidden");
    updateToggleButton(state);
    return;
  }

  if (!state.rule) {
    setStatus("status--inactive", "No rule");
    ruleDetails.classList.add("hidden");
    noRuleMessage.classList.remove("hidden");
    updateToggleButton(state);
    return;
  }

  noRuleMessage.classList.add("hidden");
  ruleDetails.classList.remove("hidden");

  if (state.hidden) {
    setStatus(
      "status--hidden",
      `Hidden — ${state.rule.label || "ENV"}`
    );
  } else {
    setStatus(
      "status--active",
      `Active — ${state.rule.label || "ENV"}`
    );
  }

  detailLabel.textContent = state.rule.label || "—";
  detailMatch.textContent = describeMatch(state.rule);
  detailMode.textContent = describeMode(state.rule);
  detailBadge.textContent = describeBadge(state.rule);
  detailScope.textContent = describeScope(state.rule.scope);

  updateToggleButton(state);
}

function handleUnavailable() {
  setStatus("status--inactive", "Not available");
  ruleDetails.classList.add("hidden");
  noRuleMessage.classList.add("hidden");
  errorMessage.classList.remove("hidden");
  toggleBtn.disabled = true;
}

function requestState() {
  if (!activeTabId) {
    handleUnavailable();
    return;
  }
  chrome.tabs.sendMessage(activeTabId, { type: "getState" }, (response) => {
    if (chrome.runtime.lastError || !response) {
      handleUnavailable();
      return;
    }
    renderState(response);
  });
}

function initHotkeyHint() {
  if (!hotkeyHint) return;
  const isMac = navigator.platform.toLowerCase().includes("mac");
  hotkeyHint.textContent = `Quick toggle: ${
    isMac ? "⌘+Shift+E" : "Ctrl+Shift+E"
  }`;
}

async function init() {
  if (versionEl) {
    const manifest = chrome.runtime.getManifest();
    versionEl.textContent = `v${manifest.version}`;
  }
  initHotkeyHint();

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs.length || !tabs[0].id) {
    handleUnavailable();
    return;
  }
  activeTabId = tabs[0].id;
  requestState();
}

toggleBtn.addEventListener("click", () => {
  if (!activeTabId || !currentState || !currentState.rule) return;
  toggleBtn.disabled = true;
  chrome.tabs.sendMessage(
    activeTabId,
    { type: "toggleIndicator" },
    (response) => {
      if (chrome.runtime.lastError || !response) {
        handleUnavailable();
        return;
      }
      renderState(response);
    }
  );
});

optionsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

init().catch(handleUnavailable);
