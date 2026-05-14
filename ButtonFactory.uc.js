// ==UserScript==
// @name           Custom Button: +Factory
// @description    Utility Script for making custom buttons
// @author         rhubarbshoelaces
// @homepageURL    https://github.com/rhubarbshoelaces/firefox-scripts/
// @include        main
// ==/UserScript==

window.UC_ButtonFactory = {
  // --- CORE HELPER: Extract Domain ---
  getDomain: function(win) {
    try {
      let hostname = new URL(win.gBrowser.currentURI.spec).hostname;
      let parts = hostname.split(".");
      if (parts.length >= 2) {
        let lastTwo = parts.slice(-2).join(".");
        let lastThree = parts.slice(-3).join(".");
        const specialCases = ["co.uk", "org.uk", "ac.uk", "gov.uk"];
        return (specialCases.includes(lastTwo) && parts.length >= 3) ? lastThree : lastTwo;
      }
    } catch (e) {}
    return "";
  },

  // --- CORE HELPER: Smart Text Extraction & Search ---
  executeSmartSearch: function(win, aDocument, event, searchUrlTemplate, defaultUrlTemplate) {
    let domain = window.UC_ButtonFactory.getDomain(win);

    let doSearch = (query) => {
      // Action 1: Focus URL Bar
      if (!query && defaultUrlTemplate === "ACTION:FOCUS_URLBAR") {
        if (win.gURLBar && win.gURLBar.inputField) {
          win.gURLBar.focus();
          win.gURLBar.select();
          ["mousedown", "mouseup", "click"].forEach(type => {
            win.gURLBar.inputField.dispatchEvent(new win.MouseEvent(type, { bubbles: true, cancelable: true, view: win, button: 0 }));
          });
        }
        return;
      }

      // Action 2: Toggle Find Bar
      if (defaultUrlTemplate === "ACTION:TOGGLE_FINDBAR") {
        let fb = win.gFindBar;
        if (fb && !fb.hidden) {
          fb.close();
        } else {
          win.gLazyFindCommand("onFindCommand");
          setTimeout(() => {
            fb = win.gFindBar;
            if (fb && fb._findField && query) {
              fb._findField.value = query;
              fb._findField.dispatchEvent(new Event("input"));
            }
          }, 50);
        }
        return;
      }

      let finalUrl = query 
        ? searchUrlTemplate.replace("%s", encodeURIComponent(query)).replace(/%domain%/g, domain)
        : defaultUrlTemplate.replace(/%domain%/g, domain);
      
      win.openUILink(finalUrl, event, {
        where: (event.button === 1 || event.ctrlKey || event.metaKey) ? "tab" : "current",
        triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({})
      });
    };

    // Flattened Smart Search Cascade
    win.gBrowser.selectedBrowser.finder.getInitialSelection().then(res => {
      let txt = res?.selectedText?.trim() || "";
      if (txt) return doSearch(txt);

      try { txt = aDocument.commandDispatcher.focusedWindow.getSelection().toString().trim(); } catch (e) {}
      if (txt) return doSearch(txt);

      let sb = aDocument.getElementById("searchbar-new");
      txt = sb?.value.trim() || "";
      if (txt && txt !== sb.getAttribute("empty")) return doSearch(txt);

      let ub = (win.gURLBar?.value || "").trim();
      let isUrl = /^(?:https?|file|chrome|about|moz-extension):/i.test(ub) || /^[^\s]+\.[a-z]{2,}(?:\/.*)?$/i.test(ub);
      if (ub && !isUrl) return doSearch(ub);

      doSearch(""); // Fallback
    });
  },

  create: function (config) {
    try {
      CustomizableUI.createWidget({
        id: config.id,
        type: "custom",
        defaultArea: CustomizableUI.AREA_NAVBAR,
        onBuild: function (aDocument) {
          const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
          const win = aDocument.defaultView;
          
          // Identify OS to safely branch event listeners
          const isMac = win.navigator.platform.includes("Mac");

          const button = aDocument.createElementNS(XUL_NS, "toolbarbutton");
          button.setAttribute("id", config.id);
          button.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
          button.setAttribute("label", config.name);
          button.setAttribute("tooltiptext", config.name);
          if (config.icon) button.setAttribute("image", config.icon);

          if (typeof config.onInit === "function") config.onInit(button, aDocument, win);

          const popup = aDocument.createElementNS(XUL_NS, "menupopup");
          popup.setAttribute("id", config.id + "_popup");
          button.appendChild(popup);

          let pressTimer;
          let isLongPress = false;

          // Abstracted menu builder to prevent code duplication
          const buildMenu = () => {
            popup.textContent = ""; 
            if (!config.menu) return;

            config.menu.forEach(item => {
              if (item.type === "bookmark") {
                let mi = aDocument.createElementNS(XUL_NS, "menuitem");
                mi.setAttribute("label", item.name);
                if (item.image) { 
                  mi.setAttribute("image", item.image); 
                  mi.setAttribute("class", "menuitem-iconic");
                } else {
                  mi.setAttribute("style", "margin-left: -26px !important;");
                }
                
                let action = (ev) => {
                  popup.hidePopup();
                  let finalUrl = item.url;
                  let currentUrl = win.gBrowser.currentURI.spec;
                  
                  if (finalUrl.includes("%url%")) {
                    if (currentUrl.startsWith("chrome:") || currentUrl.startsWith("about:")) return;
                    finalUrl = finalUrl.replace(/%url%/g, currentUrl);
                  }
                  if (finalUrl.includes("%domain%")) {
                    finalUrl = finalUrl.replace(/%domain%/g, encodeURIComponent(window.UC_ButtonFactory.getDomain(win)));
                  }

                  if (item.splitView && typeof win.gBrowser.addTabSplitView === "function") {
                    let newTab = win.gBrowser.addTab(finalUrl, { triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({}) });
                    win.gBrowser.addTabSplitView([win.gBrowser.selectedTab, newTab]);
                  } else {
                    win.openUILink(finalUrl, ev, {
                      where: (ev.button === 1 || ev.ctrlKey || ev.metaKey || item.splitView) ? "tab" : "current",
                      triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({})
                    });
                  }
                };
                
                // OS Branching for safe clicks
                if (isMac) {
                  mi.addEventListener("command", action);
                  mi.addEventListener("click", (ev) => { if (ev.button === 1) action(ev); });
                } else {
                  mi.addEventListener("click", action);
                }
                
                popup.appendChild(mi);
              } 
              
              else if (item.type === "search") {
                let mi = aDocument.createElementNS(XUL_NS, "menuitem");
                mi.setAttribute("label", item.name);
                if (item.image) { mi.setAttribute("image", item.image); mi.setAttribute("class", "menuitem-iconic"); }
                
                let action = (ev) => {
                  popup.hidePopup();
                  window.UC_ButtonFactory.executeSmartSearch(win, aDocument, ev, item.searchUrl, item.defaultUrl);
                };
                
                if (isMac) {
                  mi.addEventListener("command", action);
                  mi.addEventListener("click", (ev) => { if (ev.button === 1) action(ev); });
                } else {
                  mi.addEventListener("click", action);
                }
                
                popup.appendChild(mi);
              } 
              
              else if (item.type === "separator") {
                popup.appendChild(aDocument.createElementNS(XUL_NS, "menuseparator"));
              } 
              
              else if (item.type === "rss") {
                let loadingItem = aDocument.createElementNS(XUL_NS, "menuitem");
                loadingItem.setAttribute("label", "Loading feeds...");
                loadingItem.setAttribute("disabled", "true");
                popup.appendChild(loadingItem);

                let xhr = new XMLHttpRequest();
                xhr.open("GET", item.url, true);
                xhr.onload = () => {
                  try {
                    loadingItem.remove(); 
                    let doc = new DOMParser().parseFromString(xhr.responseText, "text/xml");
                    let entries = doc.querySelectorAll("item, entry");

                    for (let i = 0; i < Math.min(entries.length, item.limit || 15); i++) {
                      let title = entries[i].querySelector("title")?.textContent || "No title";
                      if (item.trimTitle) {
                        try { title = title.replace(new RegExp(item.trimTitle), ""); } catch (e) {}
                      }

                      let link = entries[i].querySelector("link")?.textContent || entries[i].querySelector("link")?.getAttribute("href");
                      
                      let sourceUrl = entries[i].querySelector("source")?.getAttribute("url");
                      let iconBaseUrl = sourceUrl || link;
                      
                      let iconUrl = item.image;
                      if (!iconUrl && iconBaseUrl) {
                        try {
                          iconUrl = `https://www.google.com/s2/favicons?domain=${new URL(iconBaseUrl).hostname}&sz=32`;
                        } catch (e) {}
                      }

                      let mi = aDocument.createElementNS(XUL_NS, "menuitem");
                      mi.setAttribute("label", title);
                      if (iconUrl) {
                        mi.setAttribute("image", iconUrl);
                        mi.setAttribute("class", "menuitem-iconic");
                      }
                      
                      let action = (ev) => {
                        popup.hidePopup();
                        win.openUILink(link, ev, {
                          where: (ev.button === 1 || ev.ctrlKey || ev.metaKey) ? "tab" : "current",
                          triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({})
                        });
                      };
                      
                      if (isMac) {
                        mi.addEventListener("command", action);
                        mi.addEventListener("click", (ev) => { if (ev.button === 1) action(ev); });
                      } else {
                        mi.addEventListener("click", action);
                      }
                      
                      popup.appendChild(mi);
                    }
                  } catch (err) { loadingItem.setAttribute("label", "Error parsing feeds."); }
                };
                xhr.onerror = () => { loadingItem.setAttribute("label", "Error fetching feeds."); };
                xhr.send();
              }
              
              else if (item.type === "custom" && typeof item.onBuild === "function") {
                item.onBuild(popup, aDocument, win);
              }
            });

            button.style.pointerEvents = "none";
            popup.style.pointerEvents = "auto"; 
            popup.openPopup(button, "after_start", 0, 0, false, false);
          };

          button.addEventListener("mousedown", (e) => {
            if (e.button !== 0) return;
            isLongPress = false;
            clearTimeout(pressTimer);

            pressTimer = setTimeout(() => {
              isLongPress = true;
              buildMenu();
            }, 500);
          });

          popup.addEventListener("popuphidden", () => {
            button.style.pointerEvents = "";
            popup.style.pointerEvents = "";
            setTimeout(() => { isLongPress = false; }, 50);
          });

          button.addEventListener("mouseup", () => clearTimeout(pressTimer));
          button.addEventListener("mouseout", (e) => {
            if (!isLongPress && e.relatedTarget && !button.contains(e.relatedTarget)) clearTimeout(pressTimer);
          });

          button.addEventListener("click", (e) => {
            if (e.target !== button || isLongPress) return;
            if (e.button === 0 || e.button === 1) {
              window.UC_ButtonFactory.executeSmartSearch(win, aDocument, e, config.searchUrl, config.defaultUrl);
            }
          });

          return button;
        }
      });
    } catch (e) {
      Components.utils.reportError(e);
    }
  }
};

// 1. Create the holding pen if a button script hasn't already created it
window.UC_ButtonConfigQueue = window.UC_ButtonConfigQueue || [];

// 2. Process any buttons that loaded BEFORE the factory
window.UC_ButtonConfigQueue.forEach(config => {
    window.UC_ButtonFactory.create(config);
});

// 3. Hijack the queue so any buttons that load AFTER the factory are processed instantly
window.UC_ButtonConfigQueue.push = function(config) {
    window.UC_ButtonFactory.create(config);
};