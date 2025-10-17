// options.js
const rulesBody = document.getElementById("rulesBody");
const addRuleBtn = document.getElementById("addRule");
const saveBtn = document.getElementById("save");
const exportBtn = document.getElementById("exportRules");
const importInput = document.getElementById("importRules");
const enabledEl = document.getElementById("enabled");
const modeEl = document.getElementById("mode");
const sizeEl = document.getElementById("size");
const opacityEl = document.getElementById("opacity");
const showBadgeEl = document.getElementById("showBadge");
const statusEl = document.getElementById("status");

const MATCH_TYPE_OPTIONS = [
  { value: "auto", label: "Hostname or URL contains" },
  { value: "hostname", label: "Hostname contains" },
  { value: "url", label: "URL contains" },
  { value: "regex", label: "Regular expression" },
];

const MODE_OPTIONS = [
  { value: "", label: "Default (global)" },
  { value: "ribbon", label: "Ribbon" },
  { value: "banner", label: "Banner" },
  { value: "border", label: "Border" },
];

const BADGE_OPTIONS = [
  { value: "inherit", label: "Default (global)" },
  { value: "show", label: "Force show" },
  { value: "hide", label: "Force hide" },
];

const QUICK_PRESETS = [
  {
    id: "preset-localhost",
    name: "Localhost ribbon",
    matchType: "hostname",
    pattern: "localhost",
    label: "LOCAL",
    bg: "#1e293b",
    fg: "#ffffff",
    border: "#1e293b",
    position: "top-left",
    mode: "ribbon",
    showBadge: true,
  },
  {
    id: "preset-dev",
    name: "Dev subdomain ribbon",
    matchType: "url",
    pattern: ".dev.",
    label: "DEV",
    bg: "#2563eb",
    fg: "#ffffff",
    border: "#2563eb",
    position: "bottom-left",
    mode: "ribbon",
    showBadge: true,
  },
  {
    id: "preset-staging",
    name: "Staging banner",
    matchType: "url",
    pattern: "staging",
    label: "STAGING",
    bg: "#f59e0b",
    fg: "#000000",
    border: "#f59e0b",
    position: "top-left",
    mode: "banner",
    showBadge: false,
  },
  {
    id: "preset-prod",
    name: "Prod border (HTTPS)",
    matchType: "hostname",
    pattern: "prod",
    label: "PROD",
    bg: "#dc2626",
    fg: "#ffffff",
    border: "#dc2626",
    position: "top-right",
    mode: "border",
    showBadge: true,
    scope: { protocol: "https" },
  },
];

function inferMatchTypeFromPattern(pattern) {
  if (
    pattern &&
    pattern.startsWith("/") &&
    pattern.endsWith("/") &&
    pattern.length > 2
  ) {
    return "regex";
  }
  return "auto";
}

function placeholderForMatchType(type) {
  switch (type) {
    case "hostname":
      return "Hostname contains e.g. staging.example";
    case "url":
      return "URL contains e.g. /admin";
    case "regex":
      return "RegExp e.g. ^https?:\\\\/\\/staging";
    default:
      return "Substring e.g. staging";
  }
}

function createOption(select, option) {
  const opt = document.createElement("option");
  opt.value = option.value;
  opt.textContent = option.label;
  if (option.disabled) opt.disabled = true;
  if (option.selected) opt.selected = true;
  select.appendChild(opt);
}

function applyPreset(preset, fields) {
  if (!preset) return;
  if (preset.matchType) {
    fields.matchSelect.value = preset.matchType;
    fields.matchSelect.dispatchEvent(new Event("change"));
  }
  if (typeof preset.pattern === "string") {
    fields.patternInput.value = preset.pattern;
  }
  if (typeof preset.label === "string") {
    fields.labelInput.value = preset.label;
  }
  if (preset.bg) fields.bgInput.value = preset.bg;
  if (preset.fg) fields.fgInput.value = preset.fg;
  if (preset.border) fields.borderInput.value = preset.border;
  if (preset.position) fields.positionSelect.value = preset.position;
  if (preset.mode) fields.modeSelect.value = preset.mode;
  if (typeof preset.showBadge === "boolean") {
    fields.badgeSelect.value = preset.showBadge ? "show" : "hide";
  }
  if (preset.scope) {
    const scope = preset.scope;
    if (scope.host) fields.scopeHost.value = scope.host;
    if (scope.path) fields.scopePath.value = scope.path;
    if (scope.protocol) fields.scopeProtocol.value = scope.protocol;
    if (scope.port) fields.scopePort.value = scope.port;
  }
}

function ruleRow(rule = {}, idx = 0) {
  const card = document.createElement("div");
  card.className = "rule-card";

  const header = document.createElement("div");
  header.className = "rule-header";
  const headerInfo = document.createElement("div");
  headerInfo.className = "rule-header-info";
  const title = document.createElement("span");
  title.className = "rule-title";
  const indexSpan = document.createElement("span");
  indexSpan.className = "rule-index";
  indexSpan.dataset.role = "headerIndex";
  indexSpan.textContent = `Rule ${idx + 1}`;
  headerInfo.appendChild(title);
  headerInfo.appendChild(indexSpan);
  header.appendChild(headerInfo);
  card.appendChild(header);

  function createControl(labelText, controlEl) {
    const wrap = document.createElement("div");
    wrap.className = "rule-control";
    const label = document.createElement("span");
    label.className = "control-label";
    label.textContent = labelText;
    wrap.appendChild(label);
    wrap.appendChild(controlEl);
    return wrap;
  }

  const core = document.createElement("div");
  core.className = "rule-core";

  const matchSelect = document.createElement("select");
  matchSelect.dataset.role = "matchType";
  const initialMatchType =
    typeof rule.matchType === "string" && rule.matchType.trim()
      ? rule.matchType.trim()
      : inferMatchTypeFromPattern(rule.pattern || "");
  MATCH_TYPE_OPTIONS.forEach((opt) => {
    createOption(matchSelect, {
      value: opt.value,
      label: opt.label,
      selected: opt.value === initialMatchType,
    });
  });

  const patternInput = document.createElement("input");
  patternInput.type = "text";
  patternInput.dataset.role = "pattern";
  patternInput.placeholder = placeholderForMatchType(matchSelect.value);
  patternInput.value = rule.pattern || "";

  matchSelect.addEventListener("change", () => {
    patternInput.placeholder = placeholderForMatchType(matchSelect.value);
  });

  const labelInput = document.createElement("input");
  labelInput.type = "text";
  labelInput.dataset.role = "label";
  labelInput.placeholder = "Label";
  labelInput.value = rule.label || "";

  const bgInput = document.createElement("input");
  bgInput.type = "color";
  bgInput.dataset.role = "bg";
  bgInput.value = rule.bg || "#2563eb";

  core.appendChild(createControl("Match type", matchSelect));
  core.appendChild(createControl("Pattern", patternInput));
  core.appendChild(createControl("Label", labelInput));
  core.appendChild(createControl("Background colour", bgInput));

  card.appendChild(core);

  const advanced = document.createElement("div");
  advanced.className = "rule-advanced";

  const presetSelect = document.createElement("select");
  presetSelect.className = "preset-select";
  const presetPlaceholder = document.createElement("option");
  presetPlaceholder.value = "";
  presetPlaceholder.textContent = "Choose a preset…";
  presetPlaceholder.selected = true;
  presetSelect.appendChild(presetPlaceholder);
  QUICK_PRESETS.forEach((preset) => {
    const opt = document.createElement("option");
    opt.value = preset.id;
    opt.textContent = preset.name;
    presetSelect.appendChild(opt);
  });
  const presetControl = createControl("Start from preset", presetSelect);
  presetControl.classList.add("preset-control");
  advanced.appendChild(presetControl);

  const advancedGrid = document.createElement("div");
  advancedGrid.className = "advanced-grid";

  const fgInput = document.createElement("input");
  fgInput.type = "color";
  fgInput.dataset.role = "fg";
  fgInput.value = rule.fg || "#ffffff";
  advancedGrid.appendChild(createControl("Text colour", fgInput));

  const borderInput = document.createElement("input");
  borderInput.type = "color";
  borderInput.dataset.role = "border";
  borderInput.value = rule.border || rule.bg || "#2563eb";
  advancedGrid.appendChild(createControl("Border colour", borderInput));

  const positionSelect = document.createElement("select");
  positionSelect.dataset.role = "position";
  ["top-left", "top-right", "bottom-left", "bottom-right"].forEach((value) => {
    createOption(positionSelect, {
      value,
      label: value,
      selected: (rule.position || "top-left") === value,
    });
  });
  advancedGrid.appendChild(createControl("Ribbon position", positionSelect));

  const modeSelect = document.createElement("select");
  modeSelect.dataset.role = "mode";
  MODE_OPTIONS.forEach((opt) => {
    createOption(modeSelect, {
      value: opt.value,
      label: opt.label,
      selected: (rule.mode || "") === opt.value,
    });
  });
  advancedGrid.appendChild(createControl("Display mode", modeSelect));

  const badgeSelect = document.createElement("select");
  badgeSelect.dataset.role = "badge";
  const badgeValue =
    typeof rule.showBadge === "boolean"
      ? rule.showBadge
        ? "show"
        : "hide"
      : "inherit";
  BADGE_OPTIONS.forEach((opt) => {
    createOption(badgeSelect, {
      value: opt.value,
      label: opt.label,
      selected: badgeValue === opt.value,
    });
  });
  advancedGrid.appendChild(createControl("Badge", badgeSelect));

  const scopeGroup = document.createElement("div");
  scopeGroup.className = "scope-group";
  const scopeLabel = document.createElement("span");
  scopeLabel.className = "control-label";
  scopeLabel.textContent = "Scope filters (optional)";
  scopeGroup.appendChild(scopeLabel);

  const scopeInlineTop = document.createElement("div");
  scopeInlineTop.className = "scope-inline";
  const scopeHost = document.createElement("input");
  scopeHost.type = "text";
  scopeHost.dataset.role = "scopeHost";
  scopeHost.placeholder = "Host contains";
  scopeHost.value = (rule.scope && rule.scope.host) || "";
  const scopePath = document.createElement("input");
  scopePath.type = "text";
  scopePath.dataset.role = "scopePath";
  scopePath.placeholder = "Path contains";
  scopePath.value = (rule.scope && rule.scope.path) || "";
  scopeInlineTop.appendChild(scopeHost);
  scopeInlineTop.appendChild(scopePath);
  scopeGroup.appendChild(scopeInlineTop);

  const scopeInlineBottom = document.createElement("div");
  scopeInlineBottom.className = "scope-inline";
  const scopeProtocol = document.createElement("select");
  scopeProtocol.dataset.role = "scopeProtocol";
  [
    { value: "", label: "Protocol" },
    { value: "http", label: "http" },
    { value: "https", label: "https" },
  ].forEach((opt) => {
    createOption(scopeProtocol, {
      value: opt.value,
      label: opt.label,
      selected:
        ((rule.scope && rule.scope.protocol) || "").replace(/:$/, "") ===
        opt.value,
    });
  });
  const scopePort = document.createElement("input");
  scopePort.type = "text";
  scopePort.inputMode = "numeric";
  scopePort.pattern = "[0-9]*";
  scopePort.placeholder = "Port";
  scopePort.className = "scope-port";
  scopePort.dataset.role = "scopePort";
  scopePort.value = (rule.scope && rule.scope.port) || "";
  scopeInlineBottom.appendChild(scopeProtocol);
  scopeInlineBottom.appendChild(scopePort);
  scopeGroup.appendChild(scopeInlineBottom);

  advancedGrid.appendChild(scopeGroup);
  advanced.appendChild(advancedGrid);
  card.appendChild(advanced);

  const actions = document.createElement("div");
  actions.className = "rule-actions";
  const actionsLeft = document.createElement("div");
  actionsLeft.className = "left";
  const actionsRight = document.createElement("div");
  actionsRight.className = "right";

  const advancedToggle = document.createElement("button");
  advancedToggle.type = "button";
  advancedToggle.className = "secondary";
  advancedToggle.textContent = "Show advanced settings";
  actionsLeft.appendChild(advancedToggle);

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "ghost danger";
  deleteBtn.textContent = "Delete";
  actionsRight.appendChild(deleteBtn);

  actions.appendChild(actionsLeft);
  actions.appendChild(actionsRight);
  card.appendChild(actions);

  const fieldLabel = () => {
    const value = labelInput.value.trim();
    title.textContent = value || "New rule";
  };
  fieldLabel();
  labelInput.addEventListener("input", fieldLabel);

  advancedToggle.addEventListener("click", () => {
    const open = card.classList.toggle("is-open");
    advancedToggle.textContent = open
      ? "Hide advanced settings"
      : "Show advanced settings";
  });

  deleteBtn.addEventListener("click", () => {
    card.remove();
    renumberRuleCards();
  });

  const fieldRefsForPreset = {
    matchSelect,
    patternInput,
    labelInput,
    bgInput,
    fgInput,
    borderInput,
    positionSelect,
    modeSelect,
    badgeSelect,
    scopeHost,
    scopePath,
    scopeProtocol,
    scopePort,
  };

  presetSelect.addEventListener("change", () => {
    const selectedId = presetSelect.value;
    if (!selectedId) return;
    const preset = QUICK_PRESETS.find((p) => p.id === selectedId);
    if (preset) {
      applyPreset(preset, fieldRefsForPreset);
      fieldLabel();
      card.classList.add("is-open");
      advancedToggle.textContent = "Hide advanced settings";
    }
    presetSelect.value = "";
    patternInput.focus();
  });

  const hasAdvancedValues =
    (rule.mode && rule.mode !== "") ||
    typeof rule.showBadge === "boolean" ||
    (rule.scope && Object.keys(rule.scope).length > 0) ||
    (rule.fg && rule.fg !== "#ffffff") ||
    (rule.border && rule.border !== rule.bg) ||
    (rule.position && rule.position !== "top-left");

  if (hasAdvancedValues) {
    card.classList.add("is-open");
    advancedToggle.textContent = "Hide advanced settings";
  }

  return card;
}

function readRulesFromCards() {
  const cards = Array.from(rulesBody.querySelectorAll(".rule-card"));

  const getValue = (card, role) => {
    const el = card.querySelector(`[data-role="${role}"]`);
    return el ? el.value : "";
  };

  return cards
    .map((card) => {
      const pattern = getValue(card, "pattern").trim();
      const label = getValue(card, "label").trim();
      const bg = getValue(card, "bg") || "#2563eb";
      const fg = getValue(card, "fg") || "#ffffff";
      const border = getValue(card, "border") || bg;
      const position = getValue(card, "position") || "top-left";

      const rule = { pattern, label, bg, fg, border, position };

      const matchType = getValue(card, "matchType").trim();
      if (matchType && matchType !== "auto") {
        rule.matchType = matchType;
      }

      const badgeValue = getValue(card, "badge");
      if (badgeValue === "show") rule.showBadge = true;
      if (badgeValue === "hide") rule.showBadge = false;

      const modeValue = getValue(card, "mode").trim();
      if (modeValue) rule.mode = modeValue;

      const scope = {};
      const scopeHost = getValue(card, "scopeHost").trim();
      const scopePath = getValue(card, "scopePath").trim();
      const scopeProtocol = getValue(card, "scopeProtocol").trim();
      const scopePort = getValue(card, "scopePort").trim();
      if (scopeHost) scope.host = scopeHost;
      if (scopePath) scope.path = scopePath;
      if (scopeProtocol) scope.protocol = scopeProtocol;
      if (scopePort) scope.port = scopePort;
      if (Object.keys(scope).length) rule.scope = scope;

      return rule;
    })
    .filter((rule) => {
      const hasPattern = rule.pattern && rule.pattern.length;
      const hasScope = rule.scope && Object.keys(rule.scope).length > 0;
      return hasPattern || hasScope;
    });
}

function renumberRuleCards() {
  const cards = Array.from(rulesBody.querySelectorAll(".rule-card"));
  cards.forEach((card, idx) => {
    const indexEl = card.querySelector('[data-role="headerIndex"]');
    if (indexEl) {
      indexEl.textContent = `Rule ${idx + 1}`;
    }
  });
}

async function load() {
  const { enabled, rules, style } = await chrome.storage.sync.get([
    "enabled",
    "rules",
    "style",
  ]);

  enabledEl.checked = enabled !== false;

  rulesBody.innerHTML = "";
  (rules || []).forEach((rule, idx) => {
    rulesBody.appendChild(ruleRow(rule, idx));
  });
  if (!rules || !rules.length) {
    rulesBody.appendChild(ruleRow());
  }
  renumberRuleCards();

  const s = style || {};
  modeEl.value = s.mode || "ribbon";
  sizeEl.value = s.size || "medium";
  opacityEl.value = typeof s.opacity === "number" ? s.opacity : 0.9;
  showBadgeEl.checked = s.showBadge !== false;
}

async function save() {
  const rules = readRulesFromCards();
  const style = {
    mode: modeEl.value,
    size: sizeEl.value,
    opacity: Math.max(0.1, Math.min(1, parseFloat(opacityEl.value) || 0.9)),
    showBadge: !!showBadgeEl.checked,
  };
  await chrome.storage.sync.set({ enabled: !!enabledEl.checked, rules, style });
  statusEl.textContent = "Saved ✓";
  setTimeout(() => (statusEl.textContent = ""), 1500);
}

function addRuleInline() {
  rulesBody.appendChild(
    ruleRow(
      {
        pattern: "",
        label: "",
        bg: "#2563eb",
        fg: "#ffffff",
        border: "#2563eb",
        position: "top-left",
        matchType: "hostname",
      },
      rulesBody.children.length
    )
  );
  renumberRuleCards();
}

function exportRules() {
  chrome.storage.sync.get(["rules", "style", "enabled"], (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "env-tab-labeler-rules.json";
    a.click();
    URL.revokeObjectURL(url);
  });
}

function importRulesFile(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const obj = JSON.parse(e.target.result);
      if (Array.isArray(obj.rules)) {
        rulesBody.innerHTML = "";
        obj.rules.forEach((r, idx) => rulesBody.appendChild(ruleRow(r, idx)));
        if (!obj.rules.length) {
          addRuleInline();
        }
      }
      if (obj.style) {
        modeEl.value = obj.style.mode || "ribbon";
        sizeEl.value = obj.style.size || "medium";
        opacityEl.value =
          typeof obj.style.opacity === "number" ? obj.style.opacity : 0.9;
        showBadgeEl.checked = obj.style.showBadge !== false;
      }
      if (typeof obj.enabled === "boolean") enabledEl.checked = obj.enabled;
      renumberRuleCards();
      statusEl.textContent = "Imported (remember to Save)";
      setTimeout(() => (statusEl.textContent = ""), 2000);
    } catch (err) {
      statusEl.textContent = "Invalid JSON";
      setTimeout(() => (statusEl.textContent = ""), 2000);
    }
  };
  reader.readAsText(file);
}

addRuleBtn.addEventListener("click", addRuleInline);
saveBtn.addEventListener("click", save);
exportBtn.addEventListener("click", exportRules);
importInput.addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if (file) importRulesFile(file);
  e.target.value = "";
});

load();
