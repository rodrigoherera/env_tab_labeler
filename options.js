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
const fontPresetEl = document.getElementById("fontPreset");
const fontCustomWrapEl = document.getElementById("fontCustomWrap");
const fontCustomEl = document.getElementById("fontCustom");
const fontPreviewEl = document.getElementById("fontPreview");
const statusEl = document.getElementById("status");

const SYSTEM_FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif";

function fontForPreset(preset) {
  switch (preset) {
    case "roboto":
      return "Roboto, 'Helvetica Neue', Arial, sans-serif";
    case "inter":
      return "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
    case "mono":
      return "'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace";
    case "serif":
      return "Georgia, 'Times New Roman', serif";
    case "system":
      return SYSTEM_FONT;
    default:
      return SYSTEM_FONT;
  }
}

function pickPresetForFont(fontFamily) {
  const f = (fontFamily || "").toLowerCase();
  if (f.includes("sfmono") || f.includes("monospace") || f.includes("menlo"))
    return "mono";
  if (f.includes("georgia") || f.includes("serif")) return "serif";
  if (f.includes("inter")) return "inter";
  if (f.startsWith("roboto")) return "roboto";
  if (
    f.includes("segoe ui") ||
    f.includes("arial") ||
    f.includes("system-ui") ||
    f.includes("blinkmacsystemfont")
  )
    return "system";
  return "custom";
}

function applyFontPreview(fontFamily) {
  if (fontPreviewEl) fontPreviewEl.style.fontFamily = fontFamily || SYSTEM_FONT;
}

function getSelectedFontFamily() {
  const preset = fontPresetEl ? fontPresetEl.value : "system";
  if (preset === "custom") {
    return (
      fontCustomEl && fontCustomEl.value ? fontCustomEl.value : SYSTEM_FONT
    ).trim();
  }
  return fontForPreset(preset);
}

function ruleRow(rule, idx) {
  const tr = document.createElement("tr");

  const tdPattern = document.createElement("td");
  const tdLabel = document.createElement("td");
  const tdBg = document.createElement("td");
  const tdFg = document.createElement("td");
  const tdBorder = document.createElement("td");
  const tdPos = document.createElement("td");
  const tdDel = document.createElement("td");

  const pattern = document.createElement("input");
  pattern.type = "text";
  pattern.value = rule.pattern || "";
  tdPattern.appendChild(pattern);

  const label = document.createElement("input");
  label.type = "text";
  label.value = rule.label || "";
  tdLabel.appendChild(label);

  const bg = document.createElement("input");
  bg.type = "color";
  bg.value = rule.bg || "#2563eb";
  tdBg.appendChild(bg);

  const fg = document.createElement("input");
  fg.type = "color";
  fg.value = rule.fg || "#ffffff";
  tdFg.appendChild(fg);

  const border = document.createElement("input");
  border.type = "color";
  border.value = rule.border || rule.bg || "#2563eb";
  tdBorder.appendChild(border);

  const pos = document.createElement("select");
  ["top-left", "top-right", "bottom-left", "bottom-right"].forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    if ((rule.position || "top-left") === v) opt.selected = true;
    pos.appendChild(opt);
  });
  tdPos.appendChild(pos);

  const del = document.createElement("button");
  del.textContent = "Delete";
  del.addEventListener("click", () => {
    tr.remove();
  });
  tdDel.appendChild(del);

  tr.appendChild(tdPattern);
  tr.appendChild(tdLabel);
  tr.appendChild(tdBg);
  tr.appendChild(tdFg);
  tr.appendChild(tdBorder);
  tr.appendChild(tdPos);
  tr.appendChild(tdDel);

  return tr;
}

function readRulesFromTable() {
  const rows = Array.from(rulesBody.querySelectorAll("tr"));
  return rows.map((row) => {
    const [pattern, label, bg, fg, border, position] = Array.from(
      row.querySelectorAll("input, select")
    ).map((el) => el.value);
    return { pattern, label, bg, fg, border, position };
  });
}

async function load() {
  const { enabled, rules, style } = await chrome.storage.sync.get([
    "enabled",
    "rules",
    "style",
  ]);
  enabledEl.checked = !!enabled;
  (rules || []).forEach((r, idx) => rulesBody.appendChild(ruleRow(r, idx)));

  const s = style || {};
  modeEl.value = s.mode || "ribbon";
  sizeEl.value = s.size || "medium";
  opacityEl.value = typeof s.opacity === "number" ? s.opacity : 0.9;
  showBadgeEl.checked = s.showBadge !== false;
  const savedFont = s.fontFamily || SYSTEM_FONT;
  const preset = pickPresetForFont(savedFont);
  if (fontPresetEl) fontPresetEl.value = preset;
  if (fontCustomWrapEl)
    fontCustomWrapEl.style.display =
      preset === "custom" ? "inline-flex" : "none";
  if (fontCustomEl) fontCustomEl.value = preset === "custom" ? savedFont : "";
  applyFontPreview(savedFont);
}

async function save() {
  const rules = readRulesFromTable();
  const style = {
    mode: modeEl.value,
    size: sizeEl.value,
    opacity: Math.max(0.1, Math.min(1, parseFloat(opacityEl.value) || 0.9)),
    showBadge: !!showBadgeEl.checked,
    fontFamily: getSelectedFontFamily(),
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
      },
      rulesBody.children.length
    )
  );
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
      }
      if (obj.style) {
        modeEl.value = obj.style.mode || "ribbon";
        sizeEl.value = obj.style.size || "medium";
        opacityEl.value =
          typeof obj.style.opacity === "number" ? obj.style.opacity : 0.9;
        showBadgeEl.checked = obj.style.showBadge !== false;
      }
      if (typeof obj.enabled === "boolean") enabledEl.checked = obj.enabled;
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

if (fontPresetEl) {
  fontPresetEl.addEventListener("change", () => {
    const preset = fontPresetEl.value;
    const value = fontForPreset(preset);
    if (fontCustomWrapEl)
      fontCustomWrapEl.style.display =
        preset === "custom" ? "inline-flex" : "none";
    if (preset !== "custom") {
      applyFontPreview(value);
    } else {
      applyFontPreview((fontCustomEl && fontCustomEl.value) || SYSTEM_FONT);
    }
  });
}

if (fontCustomEl) {
  fontCustomEl.addEventListener("input", () => {
    if (fontPresetEl && fontPresetEl.value === "custom") {
      applyFontPreview(fontCustomEl.value || SYSTEM_FONT);
    }
  });
}

load();
