// background.js (service worker)
const DEFAULTS = {
  enabled: true,
  rules: [
    {
      pattern: "localhost",
      label: "LOCAL",
      bg: "#1e293b",
      fg: "#ffffff",
      border: "#1e293b",
      position: "top-left",
    },
    {
      pattern: ".dev.",
      label: "DEV",
      bg: "#2563eb",
      fg: "#ffffff",
      border: "#2563eb",
      position: "top-left",
    },
    {
      pattern: "staging",
      label: "STAGING",
      bg: "#f59e0b",
      fg: "#000000",
      border: "#f59e0b",
      position: "top-left",
    },
    {
      pattern: "prod",
      label: "PROD",
      bg: "#dc2626",
      fg: "#ffffff",
      border: "#dc2626",
      position: "top-left",
    },
  ],
  style: {
    mode: "ribbon", // 'ribbon' | 'banner' | 'border'
    opacity: 0.9,
    size: "medium", // small | medium | large
    showBadge: true,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
  },
};

// Initialize defaults on install
chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.sync.get(["enabled", "rules", "style"]);
  const toSet = {};
  if (typeof current.enabled === "undefined") toSet.enabled = DEFAULTS.enabled;
  if (!Array.isArray(current.rules)) toSet.rules = DEFAULTS.rules;
  if (typeof current.style !== "object") toSet.style = DEFAULTS.style;
  if (Object.keys(toSet).length) {
    await chrome.storage.sync.set(toSet);
  }
});

// Respond to content script messages (e.g., set badge, clear badge)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!sender.tab || !sender.tab.id) return;
  const tabId = sender.tab.id;

  if (msg && msg.type === "setBadge") {
    const text = (msg.text || "").slice(0, 4).toUpperCase();
    chrome.action.setBadgeText({ tabId, text });
    if (msg.color) {
      try {
        chrome.action.setBadgeBackgroundColor({ tabId, color: msg.color });
      } catch (e) {}
    }
  } else if (msg && msg.type === "clearBadge") {
    chrome.action.setBadgeText({ tabId, text: "" });
  }
});

// Keyboard command to toggle indicator on the active tab
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-indicator") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: "toggleIndicator" });
  }
});
