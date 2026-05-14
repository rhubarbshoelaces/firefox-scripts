// ==UserScript==
// @name           Custom Button: Go Up
// @description    Adds a button to go up in the URL path (Factory + Internal Logic)
// @author         rhubarbshoelaces
// @homepageURL    https://github.com/rhubarbshoelaces/firefox-scripts/
// @include        main
// ==/UserScript==

(function() {
  if (location != "chrome://browser/content/browser.xul" &&
      location != "chrome://browser/content/browser.xhtml") return;

  // --- Logic Internal to this Button ---
  function getUpLevels(uri) {
    try {
      let u = new URL(uri);
      let levels = [];
      let parts = u.pathname.split("/").filter(Boolean);

      // 1. Path levels (e.g., /folder/sub/ -> /folder/)
      for (let i = parts.length - 1; i >= 0; i--) {
        let newPath = "/" + parts.slice(0, i).join("/");
        levels.push(`${u.protocol}//${u.host}${newPath}`);
      }

      // 2. Subdomain levels (e.g., sub.domain.com -> domain.com)
      let domainParts = u.hostname.split(".");
      while (domainParts.length > 2) {
        domainParts.shift();
        levels.push(`${u.protocol}//${domainParts.join(".")}`);
      }
      
      return [...new Set(levels)];
    } catch (e) { return []; }
  }

  window.UC_ButtonConfigQueue = window.UC_ButtonConfigQueue || [];

  window.UC_ButtonConfigQueue.push({
    id: "custombutton_goup",
    name: "Go Up",
    icon: "chrome://userchromejs/content/icons/up.svg",
    
    searchUrl: "INTERNAL:GO_UP",
    defaultUrl: "INTERNAL:GO_UP",

    onInit: function(button, aDocument, win) {
      button.addEventListener("click", (e) => {
        if (e.button !== 0 && e.button !== 1) return;
        
        let url = win.gBrowser.currentURI.spec;
        let levels = getUpLevels(url);
        
        if (levels.length > 0) {
          win.openUILink(levels[0], e, {
            triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({})
          });
          e.stopImmediatePropagation();
        }
      }, true);
    },

    menu: [
      {
        type: "custom",
        onBuild: function(popup, aDocument, win) {
          const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
          let url = win.gBrowser.currentURI.spec;
          let favicon = win.gBrowser.selectedTab.image || "chrome://global/skin/icons/defaultFavicon.svg";
          let levels = getUpLevels(url);

          if (levels.length === 0) {
            let mi = aDocument.createElementNS(XUL_NS, "menuitem");
            mi.setAttribute("label", "At Top Level");
            mi.setAttribute("disabled", "true");
            popup.appendChild(mi);
            return;
          }

          levels.forEach(lvl => {
            let mi = aDocument.createElementNS(XUL_NS, "menuitem");
            mi.setAttribute("label", lvl);
            mi.setAttribute("image", favicon);
            mi.setAttribute("class", "menuitem-iconic");
            mi.addEventListener("click", (ev) => {
              popup.hidePopup();
              win.openUILink(lvl, ev, {
                where: (ev.button === 1 || ev.ctrlKey || ev.metaKey) ? "tab" : "current",
                triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({})
              });
            });
            popup.appendChild(mi);
          });
        }
      }
    ]
  });
})();