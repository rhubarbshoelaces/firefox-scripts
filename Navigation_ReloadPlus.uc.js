// ==UserScript==
// @name           Navigation: Reload Plus
// @description    Long-press the reload button for a menu to Bypass Cache, Clear Cookies, and Clear Storage.
// @author         rhubarbshoelaces
// @homepageURL    https://github.com/rhubarbshoelaces/firefox-scripts/
// @include        main
// ==/UserScript==

(function() {
    if (location != "chrome://browser/content/browser.xhtml") return;

    function init() {
        let reloadBtn = document.getElementById("reload-button");
        let contextReloadBtn = document.getElementById("context-reload");
        let popupSet = document.getElementById("mainPopupSet");
        
        if (!popupSet || document.getElementById("uc-reload-clear-popup")) return;

        let popup = document.createXULElement("menupopup");
        popup.id = "uc-reload-clear-popup";

        function forceReload() {
            let reloadCmd = document.getElementById("Browser:ReloadSkipCache");
            if (reloadCmd) reloadCmd.doCommand();
            else gBrowser.selectedBrowser.reload();
        }

        function nukeSiteData(flags) {
            let principal = gBrowser.selectedBrowser.contentPrincipal;
            if (!principal || principal.isNullPrincipal || principal.isSystemPrincipal) {
                return forceReload();
            }

            let clearDataService = Cc["@mozilla.org/clear-data-service;1"].getService(Ci.nsIClearDataService);
            let reloadFired = false;
            let doReload = () => { if (!reloadFired) { reloadFired = true; forceReload(); } };

            let callback = {
                onDataDeleted: doReload,
                QueryInterface: ChromeUtils.generateQI(["nsIClearDataCallback"])
            };

            try {
                clearDataService.deleteDataFromPrincipal(principal, true, flags, callback);
                setTimeout(doReload, 500);
            } catch(e) {
                doReload();
            }
        }

        const menuItems = [
            ["Bypass Cache", "chrome://global/skin/icons/reload.svg", () => forceReload()],
            ["Clear Cookies", "chrome://userchromejs/content/icons/cookie.svg", () => nukeSiteData(Ci.nsIClearDataService.CLEAR_COOKIES)],
            ["Clear Local Storage", "chrome://global/skin/icons/delete.svg", () => nukeSiteData(Ci.nsIClearDataService.CLEAR_COOKIES | Ci.nsIClearDataService.CLEAR_DOM_STORAGES)]
        ];

        menuItems.forEach(([label, icon, action]) => {
            let item = document.createXULElement("menuitem");
            item.setAttribute("label", label);
            item.setAttribute("class", "menuitem-iconic"); 
            item.setAttribute("image", icon);
            item.addEventListener("command", () => {
                document.getElementById("contentAreaContextMenu")?.hidePopup();
                action();
            });
            popup.appendChild(item);
        });

        popupSet.appendChild(popup);

        function stopEvent(e) { e.preventDefault(); e.stopImmediatePropagation(); }

        function attachLongPress(btn) {
            if (!btn) return;
            let pressTimer;
            let isLongPress = false;

            btn.addEventListener("mousedown", (e) => {
                if (e.button !== 0) return;
                isLongPress = false;
                pressTimer = setTimeout(() => {
                    isLongPress = true;
                    popup.openPopup(btn, "after_start", 0, 0, false, false, e);
                }, 400); 
            }, true);

            btn.addEventListener("mouseup", (e) => {
                clearTimeout(pressTimer);
                if (isLongPress) stopEvent(e);
            }, true);

            btn.addEventListener("mouseleave", () => clearTimeout(pressTimer));

            ["click", "command"].forEach(type => {
                btn.addEventListener(type, (e) => {
                    if (isLongPress) stopEvent(e);
                }, true);
            });
        }

        attachLongPress(reloadBtn);
        attachLongPress(contextReloadBtn);
    }

    if (gBrowserInit.delayedStartupFinished) {
        init();
    } else {
        let obs = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(obs, topic);
                init();
            }
        };
        Services.obs.addObserver(obs, "browser-delayed-startup-finished");
    }
})();