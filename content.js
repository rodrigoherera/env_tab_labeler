// content.js
(() => {
  const STATE = {
    mounted: false,
    rule: null,
    style: null,
    hidden: false,
    container: null,
    shadow: null,
  };

  const zMax = 2147483647;

  function pickRule(url, rules) {
    // Match by regex or substring on hostname/href
    let u;
    try {
      u = new URL(url);
    } catch (e) {
      return null;
    }
    for (const r of rules || []) {
      const p = (r.pattern || "").trim();
      if (!p) continue;
      if (p.startsWith("/") && p.endsWith("/")) {
        try {
          const re = new RegExp(p.slice(1, -1));
          if (re.test(url)) return r;
        } catch (e) {}
      } else {
        const needle = p.toLowerCase();
        const hostLower = u.hostname.toLowerCase();
        const urlLower = url.toLowerCase();
        if (hostLower.includes(needle) || urlLower.includes(needle)) return r;
      }
    }
    return null;
  }

  function buildStyles({ bg, fg, border, style, position }) {
    const opacity =
      style && typeof style.opacity === "number" ? style.opacity : 0.9;
    const size = (style && style.size) || "medium";
    const mode = (style && style.mode) || "ribbon";
    const pos = position || "top-left";
    const fontFamily =
      (style && style.fontFamily) ||
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';

    const sizes = {
      small: { font: 11, padY: 2, padX: 6, ribbonW: 120, ribbonH: 24 },
      medium: { font: 13, padY: 4, padX: 10, ribbonW: 160, ribbonH: 28 },
      large: { font: 16, padY: 6, padX: 14, ribbonW: 200, ribbonH: 34 },
    };
    const S = sizes[size] || sizes.medium;

    const css = `
      :host, .env-root, .env-ribbon, .env-banner, .env-border { all: initial; }

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

  function unmount() {
    if (STATE.container && STATE.container.isConnected) {
      STATE.container.remove();
    }
    STATE.container = null;
    STATE.shadow = null;
    STATE.mounted = false;
  }

  function mount(rule, style) {
    unmount();

    STATE.rule = rule;
    STATE.style = style;

    if (!rule) return;

    // Create host + shadow
    const host = document.createElement("div");
    host.setAttribute("data-env-tab-labeler", "1");
    host.style.position = "fixed";
    host.style.inset = "0";
    host.style.zIndex = String(zMax);
    host.style.pointerEvents = "none";

    const shadow = host.attachShadow({ mode: "open" });
    const root = document.createElement("div");
    root.className = "env-root";

    // Styles
    const styleEl = document.createElement("style");
    styleEl.textContent = buildStyles({
      bg: rule.bg,
      fg: rule.fg,
      border: rule.border,
      style,
      position: rule.position,
    });
    shadow.appendChild(styleEl);

    // Mode-specific UI
    if (style.mode === "banner") {
      const banner = document.createElement("div");
      banner.className = "env-banner";
      banner.textContent = rule.label || "ENV";
      root.appendChild(banner);
    } else if (style.mode === "border") {
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

    // Tell background to show a badge
    if (style.showBadge) {
      chrome.runtime.sendMessage({
        type: "setBadge",
        text: rule.label || "ENV",
        color: rule.bg,
      });
    }
  }

  async function refresh() {
    try {
      const { enabled, rules, style } = await chrome.storage.sync.get([
        "enabled",
        "rules",
        "style",
      ]);
      if (!enabled) {
        unmount();
        chrome.runtime.sendMessage({ type: "clearBadge" });
        return;
      }
      const rule = pickRule(location.href, rules);
      if (!rule) {
        unmount();
        chrome.runtime.sendMessage({ type: "clearBadge" });
        return;
      }

      mount(rule, style || {});
    } catch (e) {
      // Fail safe
    }
  }

  function observeUrlChanges() {
    // Refresh indicator when SPA navigation changes the URL
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

  // Listen for changes and messages
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    refresh();
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === "toggleIndicator") {
      STATE.hidden = !STATE.hidden;
      if (STATE.container)
        STATE.container.style.display = STATE.hidden ? "none" : "block";
    }
  });

  // Only run at top window (not inside iframes) for clarity
  if (window.top === window) {
    refresh();
    observeUrlChanges();
  }
})();
