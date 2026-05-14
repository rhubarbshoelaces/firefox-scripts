// ==UserScript==
// @name           BackTrack Ancestry
// @description    Adds parent-tab switching, ancestry dropdown, native menu integration, and session persistence.
// @author         rhubarbshoelaces
// @homepageURL    https://github.com/rhubarbshoelaces/firefox-scripts/
// @include        main
// ==/UserScript==

(function() {
  if (location != "chrome://browser/content/browser.xhtml") return;

  // Track the last clicked navigation button to accurately identify popup triggers
  let lastNavBtn = null;
  window.addEventListener("mousedown", (e) => {
      let target = e.target.closest("#back-button, #forward-button, #context-back, #context-forward");
      if (target) lastNavBtn = target.id;
  }, true);

  // =====================================================================
  // 1. ANCESTRY TRACKING ENGINE
  // =====================================================================
  function getAncestors(startTab) {
      let ancestors = [];
      let current = startTab;
      
      while (current && current.openerTab && ancestors.length < 10) {
          let opener = current.openerTab;
          
          if (opener.closing || !gBrowser.tabs.includes(opener)) break;
          if (ancestors.includes(opener)) break; 
          
          ancestors.push(opener);
          current = opener;
      }
      return ancestors;
  }

  // =====================================================================
  // 2. CUSTOM POPUP BUILDER (Used when NO back history exists)
  // =====================================================================
  function getOrCreateAncestryMenu() {
      let popup = document.getElementById("uc-ancestry-popup");
      if (popup) return popup;

      popup = document.createXULElement("menupopup");
      popup.id = "uc-ancestry-popup";
      document.getElementById("mainPopupSet").appendChild(popup);

      popup.addEventListener("popupshowing", function() {
          while (popup.firstChild) popup.firstChild.remove();
          
          let currentTab = gBrowser.selectedTab;
          let ancestors = getAncestors(currentTab);
          
          if (ancestors.length === 0) {
              let empty = document.createXULElement("menuitem");
              empty.setAttribute("label", "No parent tab history");
              empty.setAttribute("disabled", "true");
              popup.appendChild(empty);
              return;
          }

          ancestors.forEach((ancTab) => {
              let item = document.createXULElement("menuitem");
              
              item.setAttribute("label", ancTab.label || "Untitled Tab");
              item.setAttribute("image", ancTab.getAttribute("image") || "chrome://global/skin/icons/defaultFavicon.svg");
              item.setAttribute("class", "menuitem-iconic"); 
              
              item.addEventListener("command", function() {
                  gBrowser.selectedTab = ancTab;
                  gBrowser.removeTab(currentTab);
              });
              popup.appendChild(item);
          });
      });
      return popup;
  }

  // =====================================================================
  // 3. EVENT INTERCEPTORS
  // =====================================================================
  function attachAncestryLogic(btnId) {
      let btn = document.getElementById(btnId);
      if (!btn) return;
      
      let pressTimer;
      let isLongPress = false;

      btn.addEventListener("mousedown", (e) => {
          if (e.button !== 0 || gBrowser.canGoBack) return; 
          
          let ancestors = getAncestors(gBrowser.selectedTab);
          if (ancestors.length === 0) return; 

          e.preventDefault();
          e.stopImmediatePropagation();
          isLongPress = false;

          pressTimer = setTimeout(() => {
              isLongPress = true;
              let ancestryMenu = getOrCreateAncestryMenu();
              ancestryMenu.openPopup(btn, "after_start", 0, 0, false, false);
          }, 400); 
      }, true); 

      btn.addEventListener("mouseup", (e) => {
          if (e.button !== 0 || gBrowser.canGoBack) return;
          
          let ancestors = getAncestors(gBrowser.selectedTab);
          if (ancestors.length === 0) return;

          clearTimeout(pressTimer);
          e.preventDefault();
          e.stopImmediatePropagation();

          btn.dataset.ancestryHandled = "true";
          setTimeout(() => delete btn.dataset.ancestryHandled, 100);

          if (!isLongPress) {
              let contextMenu = document.getElementById("contentAreaContextMenu");
              if (btnId === "context-back" && contextMenu) contextMenu.hidePopup();
              
              let childTabToClose = gBrowser.selectedTab;
              gBrowser.selectedTab = ancestors[0];
              gBrowser.removeTab(childTabToClose);
          }
      }, true);

      btn.addEventListener("mouseleave", () => clearTimeout(pressTimer));
  }

  // =====================================================================
  // 4. NATIVE MENU INJECTION (Used when back history DOES exist)
  // =====================================================================
  function attachNativeMenuLogic() {
      let bfMenu = document.getElementById("backForwardMenu");
      if (!bfMenu) return;

      bfMenu.addEventListener("popupshowing", function(e) {
          if (e.target !== bfMenu) return;

          // Clean up previously injected items
          let oldSep = document.getElementById("uc-ancestry-native-sep");
          let oldItem = document.getElementById("uc-ancestry-native-item");
          if (oldSep) oldSep.remove();
          if (oldItem) oldItem.remove();

          // Identify trigger using native properties or our fallback tracker
          let triggerNode = bfMenu.triggerNode || bfMenu.anchorNode || document.popupNode;
          let triggerId = triggerNode ? triggerNode.id : lastNavBtn;
          
          if (triggerId !== "back-button" && triggerId !== "context-back") return;

          let currentTab = gBrowser.selectedTab;
          let ancestors = getAncestors(currentTab);
          if (ancestors.length === 0) return;
          let parentTab = ancestors[0];

          requestAnimationFrame(() => {
              let sep = document.createXULElement("menuseparator");
              sep.id = "uc-ancestry-native-sep";

              let item = document.createXULElement("menuitem");
              item.id = "uc-ancestry-native-item";
              item.setAttribute("label", parentTab.label || "Untitled Tab");
              item.setAttribute("image", parentTab.getAttribute("image") || "chrome://global/skin/icons/defaultFavicon.svg");
              item.setAttribute("class", "menuitem-iconic");
              item.setAttribute("tooltiptext", "Switch to parent tab and close current tab");
              
              item.addEventListener("command", function() {
                  gBrowser.selectedTab = parentTab;
                  gBrowser.removeTab(currentTab);
              });

              bfMenu.appendChild(sep);
              bfMenu.appendChild(item);
          });
      });
  }

  // =====================================================================
  // 5. THE SHIELD 
  // =====================================================================
  window.addEventListener("click", (e) => {
      let target = e.target.closest("#back-button, #context-back");
      if (target && target.dataset.ancestryHandled) {
          e.preventDefault();
          e.stopImmediatePropagation();
      }
  }, true); 

  // =====================================================================
  // 6. SESSION STORE ORPHAN RECOVERY (DNA TAGGING)
  // =====================================================================
  function getOrAssignTabId(tab) {
      let id = SessionStore.getCustomTabValue(tab, "uc-tab-id");
      if (!id) {
          id = Date.now() + "-" + Math.random().toString(36).substr(2, 9);
          SessionStore.setCustomTabValue(tab, "uc-tab-id", id);
      }
      return id;
  }

  function initDNA() {
      for (let tab of gBrowser.tabs) {
          getOrAssignTabId(tab);
      }

      gBrowser.tabContainer.addEventListener("TabOpen", (e) => {
          let tab = e.target;
          getOrAssignTabId(tab);
          
          setTimeout(() => {
              if (tab.openerTab) {
                  let parentId = getOrAssignTabId(tab.openerTab);
                  SessionStore.setCustomTabValue(tab, "uc-parent-id", parentId);
              }
          }, 100);
      });

      window.addEventListener("SSTabRestored", (e) => {
          let tab = e.target;
          let parentId = SessionStore.getCustomTabValue(tab, "uc-parent-id");
          
          if (parentId && !tab.openerTab) {
              let parentTab = Array.from(gBrowser.tabs).find(t => SessionStore.getCustomTabValue(t, "uc-tab-id") === parentId);
              if (parentTab) {
                  tab.openerTab = parentTab;
              }
          }
      });
  }

  // =====================================================================
  // 7. INITIALIZATION
  // =====================================================================
  if (gBrowserInit.delayedStartupFinished) {
      attachAncestryLogic("back-button");
      attachAncestryLogic("context-back");
      attachNativeMenuLogic();
      initDNA();
  } else {
      let obs = (subject, topic) => {
          if (topic == "browser-delayed-startup-finished" && subject == window) {
              Services.obs.removeObserver(obs, topic);
              attachAncestryLogic("back-button");
              attachAncestryLogic("context-back");
              attachNativeMenuLogic();
              initDNA();
          }
      };
      Services.obs.addObserver(obs, "browser-delayed-startup-finished");
  }
})();