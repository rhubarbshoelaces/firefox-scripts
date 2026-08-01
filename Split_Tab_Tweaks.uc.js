// ==UserScript==
// @name           Split Tab Tweaks
// @description    Fixes for picky split tab hitboxes and Alt+Click to separate split tabs
// @author         rhubarbshoelaces
// @include        main
// ==/UserScript==

(function () {
  if (location != "chrome://browser/content/browser.xhtml") return;

  function init() {
    const tabsToolbar = document.getElementById("TabsToolbar");
    if (!tabsToolbar) return;

    let isUnsplitting = false;
    let unsplitResetTimeout;

    const killGhostClicks = (e) => {
      if (isUnsplitting && e.button === 0 && e.isTrusted) {
        e.preventDefault();
        e.stopImmediatePropagation();
        
        if (e.type === "click") {
          isUnsplitting = false;
          clearTimeout(unsplitResetTimeout);
        }
      }
    };

    tabsToolbar.addEventListener("mouseup", killGhostClicks, true);
    tabsToolbar.addEventListener("click", killGhostClicks, true);

    tabsToolbar.addEventListener("mousedown", (e) => {
      if (e.button !== 0 || !e.isTrusted) return;

      // ---------------------------------------------------------
      // Alt + Click to Separate/Un-split a tab
      // ---------------------------------------------------------
      if (e.altKey) {
        const tab = e.target.closest("tab");

        if (tab && tab.closest("tab-split-view-wrapper")) {

          isUnsplitting = true;
          clearTimeout(unsplitResetTimeout);
          unsplitResetTimeout = setTimeout(() => { isUnsplitting = false; }, 300);

          e.preventDefault();
          e.stopImmediatePropagation();

          setTimeout(() => {
            const separateMenuItem = document.getElementById("context_separateSplitView");
            
            if (separateMenuItem && window.TabContextMenu) {
              const originalContextTab = window.TabContextMenu.contextTab;
              const originalContextTabs = window.TabContextMenu.contextTabs;
              
              window.TabContextMenu.contextTab = tab;
              window.TabContextMenu.contextTabs = [tab]; 
              
              separateMenuItem.dispatchEvent(new Event("command", { bubbles: true }));
              
              window.TabContextMenu.contextTab = originalContextTab;
              window.TabContextMenu.contextTabs = originalContextTabs;
            }
          }, 0);
          return;
        }
      }

      // ---------------------------------------------------------
      // Select a split tab when clicking above it
      // ---------------------------------------------------------
      if (e.clientY <= 15 && !e.altKey) {
        const splitWrappers = document.querySelectorAll("tab-split-view-wrapper");
        
        for (let wrapper of splitWrappers) {
          let rect = wrapper.getBoundingClientRect();
          if (e.clientX >= rect.left && e.clientX <= rect.right) {
            const innerTabs = wrapper.querySelectorAll(".tabbrowser-tab");
            for (let actualTab of innerTabs) {
              let tabRect = actualTab.getBoundingClientRect();
              if (e.clientX >= tabRect.left && e.clientX <= tabRect.right) {
                e.preventDefault();
                e.stopImmediatePropagation();
                window.gBrowser.selectedTab = actualTab;
                return;
              }
            }
          }
        }
      }
      if (e.clientY > 15 && !e.altKey) {
        const tab = e.target.closest("tab");
        if (tab && tab.closest("tab-split-view-wrapper")) {
          if (e.target.closest(".tab-close-button")) return;
          e.preventDefault();
          e.stopImmediatePropagation();
          window.gBrowser.selectedTab = tab;
        }
      }
    }, true); 
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