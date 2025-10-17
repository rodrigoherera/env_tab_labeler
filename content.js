// content.js
(() => {
  const zMax = 2147483647;
  const DEFAULT_FONT =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';

  const STATE = {
    mounted: false,
    rule: null,
    style: null,
    hidden: false,
    container: null,
    shadow: null,
    enabled: true,
    rulesSignature: "",
    preparedRules: [],
    baseStyle: null,
  };

  const MATCH_TYPES = new Set(["auto", "hostname", "url", "regex"]);

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeStyle(raw) {
    const s = raw && typeof raw === "object" ? raw : {};
    return {
      mode:
        typeof s.mode === "string" && s.mode.trim() ? s.mode.trim() : "ribbon",
      opacity:
        typeof s.opacity === "number"
          ? clamp(s.opacity, 0.1, 1)
          : clamp(parseFloat(s.opacity) || 0.9, 0.1, 1),
      size:
        typeof s.size === "string" && s.size.trim()
          ? s.size.trim()
          : "medium",
      showBadge: s.showBadge !== false,
      fontFamily: DEFAULT_FONT,
    };
  }

  function hasScope(scope) {
    if (!scope || typeof scope !== "object") return false;
    return ["host", "path", "protocol", "port"].some((key) => {
      const value = scope[key];
      return typeof value === "string"
        ? value.trim() !== ""
        : typeof value === "number"
        ? !Number.isNaN(value)
        : false;
    });
  }

  function inferMatchType(pattern) {
    if (pattern && pattern.startsWith("/") && pattern.endsWith("/") && pattern.length > 2) {
      return "regex";
    }
    return "auto";
  }

  function extractRegexSource(pattern, explicitType) {
    if (!pattern) return null;
    if (
      (explicitType && explicitType === "regex") ||
      (!explicitType && pattern.startsWith("/") && pattern.endsWith("/"))
    ) {
      if (pattern.length <= 2) return null;
      return pattern.startsWith("/") && pattern.endsWith("/")
        ? pattern.slice(1, -1)
        : pattern;
    }
    return pattern;
  }

  function prepareRules(rawRules) {
    const serialised = JSON.stringify(rawRules || []);
    if (STATE.rulesSignature === serialised) {
      return STATE.preparedRules;
    }

    const prepared = [];
    for (const raw of rawRules || []) {
      if (!raw || typeof raw !== "object") continue;
      const pattern =
        typeof raw.pattern === "string" ? raw.pattern.trim() : "";
      const label = typeof raw.label === "string" ? raw.label.trim() : "";
      const matchTypeRaw =
        typeof raw.matchType === "string" ? raw.matchType.trim() : "";
      const matchType = MATCH_TYPES.has(matchTypeRaw)
        ? matchTypeRaw
        : inferMatchType(pattern);

      const scopeRaw =
        raw.scope && typeof raw.scope === "object" ? raw.scope : {};
      const scope = {
        host:
          typeof scopeRaw.host === "string" ? scopeRaw.host.trim() : "",
        path:
          typeof scopeRaw.path === "string" ? scopeRaw.path.trim() : "",
        protocol:
          typeof scopeRaw.protocol === "string"
            ? scopeRaw.protocol.replace(/:$/, "").trim()
            : "",
        port:
          typeof scopeRaw.port === "number"
            ? String(scopeRaw.port)
            : typeof scopeRaw.port === "string"
            ? scopeRaw.port.trim()
            : "",
      };

      const scopeHasValues = hasScope(scope);
      const allowPattern = pattern !== "" || scopeHasValues;
      if (!allowPattern) continue;

      const mode =
        typeof raw.mode === "string" && raw.mode.trim()
          ? raw.mode.trim()
          : undefined;
      const showBadge =
        typeof raw.showBadge === "boolean" ? raw.showBadge : undefined;

      let compiledRegex = null;
      if (matchType === "regex") {
        const source = extractRegexSource(pattern, true);
        if (!source) continue;
        try {
          compiledRegex = new RegExp(source);
        } catch (e) {
          continue;
        }
      }

      prepared.push({
        pattern,
        label,
        bg: raw.bg || "#2563eb",
        fg: raw.fg || "#ffffff",
        border: raw.border || raw.bg || "#2563eb",
        position:
          typeof raw.position === "string" && raw.position.trim()
            ? raw.position.trim()
            : "top-left",
        mode,
        showBadge,
        matchType,
        scope: scopeHasValues ? scope : undefined,
        _patternLower: pattern.toLowerCase(),
        _compiledRegex: compiledRegex,
      });
    }

    STATE.rulesSignature = serialised;
    STATE.preparedRules = prepared;
    return prepared;
  }

  function matchesPattern(rule, href, urlObj) {
    if (!rule.pattern) return true;
    switch (rule.matchType) {
      case "hostname": {
        return urlObj.hostname.toLowerCase().includes(rule._patternLower);
      }
      case "url": {
        return href.toLowerCase().includes(rule._patternLower);
      }
      case "regex": {
        return rule._compiledRegex ? rule._compiledRegex.test(href) : false;
      }
      case "auto":
      default: {
        const hostLower = urlObj.hostname.toLowerCase();
        const urlLower = href.toLowerCase();
        return (
          hostLower.includes(rule._patternLower) ||
          urlLower.includes(rule._patternLower)
        );
      }
    }
  }

  function defaultPortForProtocol(protocol) {
    switch (protocol) {
      case "http:":
        return "80";
      case "https:":
        return "443";
      default:
        return "";
    }
  }

  function matchesScope(rule, urlObj) {
    const scope = rule.scope;
    if (!scope) return true;

    if (scope.host) {
      if (!urlObj.hostname.toLowerCase().includes(scope.host.toLowerCase())) {
        return false;
      }
    }

    if (scope.path) {
      if (!urlObj.pathname.toLowerCase().includes(scope.path.toLowerCase())) {
        return false;
      }
    }

    if (scope.protocol) {
      const proto = urlObj.protocol.replace(/:$/, "").toLowerCase();
      if (proto !== scope.protocol.toLowerCase()) {
        return false;
      }
    }

    if (scope.port) {
      const actualPort =
        urlObj.port ||
        defaultPortForProtocol(urlObj.protocol || "").toString();
      if (actualPort !== scope.port) {
        return false;
      }
    }

    return true;
  }

  function pickRule(href, rules) {
    let urlObj;
    try {
      urlObj = new URL(href);
    } catch (e) {
      return null;
    }

    for (const rule of rules || []) {
      if (!matchesPattern(rule, href, urlObj)) continue;
      if (!matchesScope(rule, urlObj)) continue;
      return rule;
    }
    return null;
  }

  function buildStyles({ bg, fg, border, style, position }) {
    const opacity =
      style && typeof style.opacity === "number" ? style.opacity : 0.9;
    const size = (style && style.size) || "medium";
    const mode = (style && style.mode) || "ribbon";
    const pos = position || "top-left";
    const fontFamily = DEFAULT_FONT;

    const sizes = {
      small: { font: 11, padY: 2, padX: 6, ribbonW: 120, ribbonH: 24 },
      medium: { font: 13, padY: 4, padX: 10, ribbonW: 160, ribbonH: 28 },
      large: { font: 16, padY: 6, padX: 14, ribbonW: 200, ribbonH: 34 },
    };
    const S = sizes[size] || sizes.medium;

    const css = `
      :host, .env-root { all: initial; }

      .env-root {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: ${zMax};
        font-family: ${fontFamily};
      }

      .env-ribbon {
        position: fixed;
        ${pos && pos.includes("bottom") ? "bottom" : "top"}: 16px;
        ${pos && pos.includes("right") ? "right" : "left"}: -32px;
        width: ${S.ribbonW}px;
        height: ${S.ribbonH}px;
        background: ${bg};
        color: ${fg};
        opacity: ${opacity};
        transform: rotate(${pos && pos.includes("right") ? "45deg" : "-45deg"});
        box-shadow: 0 2px 8px rgba(0,0,0,.25);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: ${S.font}px;
        letter-spacing: 1px;
        text-transform: uppercase;
        pointer-events: none;
        font-family: inherit;
      }

      .env-banner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: ${S.ribbonH + 4}px;
        background: ${bg};
        color: ${fg};
        opacity: ${opacity};
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: ${S.font}px;
        padding: ${S.padY}px ${S.padX}px;
        pointer-events: none;
        box-shadow: 0 1px 6px rgba(0,0,0,.2);
        font-family: inherit;
      }

      .env-border {
        position: fixed;
        inset: 0;
        pointer-events: none;
        box-shadow: inset 0 0 0 4px ${border};
      }
    `;
    return css;
  }

  function resolveStyle(baseStyle, rule) {
    const style = { ...baseStyle };
    if (rule) {
      if (typeof rule.mode === "string" && rule.mode.trim()) {
        style.mode = rule.mode.trim();
      }
      if (typeof rule.showBadge === "boolean") {
        style.showBadge = rule.showBadge;
      }
    }
    return style;
  }

  function clearBadge() {
    chrome.runtime.sendMessage({ type: "clearBadge" });
  }

  function applyBadge(rule, style) {
    if (!style || !style.showBadge) return;
    chrome.runtime.sendMessage({
      type: "setBadge",
      text: (rule.label || "ENV").slice(0, 4),
      color: rule.bg,
    });
  }

  function unmount() {
    if (STATE.container && STATE.container.isConnected) {
      STATE.container.remove();
    }
    STATE.container = null;
    STATE.shadow = null;
    STATE.mounted = false;
    STATE.rule = null;
    STATE.style = null;
    STATE.hidden = false;
  }

  function mount(rule, style) {
    unmount();

    if (!rule) return;

    const host = document.createElement("div");
    host.setAttribute("data-env-tab-labeler", "1");
    host.style.position = "fixed";
    host.style.inset = "0";
    host.style.zIndex = String(zMax);
    host.style.pointerEvents = "none";

    const shadow = host.attachShadow({ mode: "open" });
    const root = document.createElement("div");
    root.className = "env-root";

    const styleEl = document.createElement("style");
    styleEl.textContent = buildStyles({
      bg: rule.bg,
      fg: rule.fg,
      border: rule.border,
      style,
      position: rule.position,
    });
    shadow.appendChild(styleEl);

    const mode = (style && style.mode) || "ribbon";
    if (mode === "banner") {
      const banner = document.createElement("div");
      banner.className = "env-banner";
      banner.textContent = rule.label || "ENV";
      root.appendChild(banner);
    } else if (mode === "border") {
      const border = document.createElement("div");
      border.className = "env-border";
      root.appendChild(border);
    } else {
      const ribbon = document.createElement("div");
      ribbon.className = "env-ribbon";
      ribbon.textContent = rule.label || "ENV";
      root.appendChild(ribbon);
    }

    shadow.appendChild(root);
    document.documentElement.appendChild(host);

    STATE.container = host;
    STATE.shadow = shadow;
    STATE.mounted = true;
    STATE.hidden = false;
    STATE.rule = rule;
    STATE.style = style;

    applyBadge(rule, style);
  }

  async function refresh() {
    try {
      const { enabled, rules, style } = await chrome.storage.sync.get([
        "enabled",
        "rules",
        "style",
      ]);

      const isEnabled =
        typeof enabled === "boolean" ? enabled : true;
      STATE.enabled = isEnabled;
      STATE.baseStyle = normalizeStyle(style || {});

      if (!isEnabled) {
        clearBadge();
        unmount();
        return;
      }

      const preparedRules = prepareRules(rules);
      const activeRule = pickRule(location.href, preparedRules);

      if (!activeRule) {
        clearBadge();
        unmount();
        return;
      }

      const computedStyle = resolveStyle(STATE.baseStyle, activeRule);
      mount(activeRule, computedStyle);
    } catch (e) {
      // fail safe
    }
  }

  function observeUrlChanges() {
    let lastHref = location.href;
    const check = () => {
      if (lastHref !== location.href) {
        lastHref = location.href;
        refresh();
      }
    };
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = function () {
      const ret = origPush.apply(this, arguments);
      queueMicrotask(check);
      return ret;
    };
    history.replaceState = function () {
      const ret = origReplace.apply(this, arguments);
      queueMicrotask(check);
      return ret;
    };
    window.addEventListener("popstate", check);
  }

  function getActiveState() {
    return {
      enabled: STATE.enabled,
      hidden: STATE.hidden,
      rule: STATE.rule
        ? {
            label: STATE.rule.label || "",
            pattern: STATE.rule.pattern || "",
            matchType: STATE.rule.matchType || "auto",
            mode: STATE.rule.mode || "",
            appliedMode: STATE.style ? STATE.style.mode : "",
            showBadge:
              typeof STATE.rule.showBadge === "boolean"
                ? STATE.rule.showBadge
                : undefined,
            appliedShowBadge: STATE.style ? !!STATE.style.showBadge : false,
            position: STATE.rule.position || "top-left",
            bg: STATE.rule.bg,
            fg: STATE.rule.fg,
            border: STATE.rule.border,
            scope: STATE.rule.scope || null,
          }
        : null,
    };
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    if (changes.rules || changes.style || changes.enabled) {
      STATE.rulesSignature = ""; // force recompute
      refresh();
    }
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || typeof msg !== "object") return;

    if (msg.type === "toggleIndicator") {
      STATE.hidden = !STATE.hidden;
      if (STATE.container) {
        STATE.container.style.display = STATE.hidden ? "none" : "block";
      }
      if (STATE.hidden) {
        clearBadge();
      } else if (STATE.rule && STATE.style) {
        applyBadge(STATE.rule, STATE.style);
      }
      if (sendResponse) {
        sendResponse({ hidden: STATE.hidden, ...getActiveState() });
      }
      return true;
    }

    if (msg.type === "getState") {
      sendResponse(getActiveState());
    }
  });

  if (window.top === window) {
    refresh();
    observeUrlChanges();
  }
})();
