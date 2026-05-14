// ==UserScript==
// @name           Navigation: Close & Unclose
// @description    Back to Close, Forward to Unclose. Cleanly combined with hardcoded tooltips.
// @author         rhubarbshoelaces
// @homepageURL    https://github.com/rhubarbshoelaces/firefox-scripts/
// @include        main
// ==/UserScript==

(function() {
  if (location != "chrome://browser/content/browser.xhtml") return;

  let backCmd = document.getElementById("Browser:Back");
  let fwdCmd = document.getElementById("Browser:Forward");
  let backBtn = document.getElementById("back-button");
  let fwdBtn = document.getElementById("forward-button");
  let contextBack = document.getElementById("context-back");
  let contextFwd = document.getElementById("context-forward");
  let contextMenu = document.getElementById("contentAreaContextMenu");

  function closeTab() { document.getElementById("cmd_close")?.doCommand(); }
  function undoCloseTab() { document.getElementById("History:UndoCloseTab")?.doCommand(); }
  function stopEvent(e) { e.preventDefault(); e.stopImmediatePropagation(); }

  if (backCmd) {
      backCmd.addEventListener("command", function(e) {
          if (!gBrowser.canGoBack) { stopEvent(e); closeTab(); }
      }, true);
  }
  
  if (fwdCmd) {
      fwdCmd.addEventListener("command", function(e) {
          if (!gBrowser.canGoForward) { stopEvent(e); undoCloseTab(); }
      }, true);
  }

  function updateUIState() {
      let noBack = !gBrowser.canGoBack;
      let noFwd = !gBrowser.canGoForward;
      
      let modifier = AppConstants.platform === "macosx" ? "Cmd" : "Alt";
      let nativeBackTip = `Go back one page (${modifier}+Left Arrow)`;
      let nativeFwdTip = `Go forward one page (${modifier}+Right Arrow)`;

      if (backCmd && backBtn) {
          backBtn.removeAttribute("data-l10n-id");
          if (noBack) {
              backCmd.removeAttribute("disabled");
              backBtn.removeAttribute("disabled");
              backBtn.setAttribute("back-to-close", "true");
              backBtn.setAttribute("tooltiptext", "Close current tab (Ctrl+W)");
          } else {
              backBtn.removeAttribute("back-to-close");
              backBtn.setAttribute("tooltiptext", nativeBackTip);
          }
      }

      if (contextBack) {
          contextBack.removeAttribute("data-l10n-id");
          if (noBack) {
              contextBack.removeAttribute("disabled");
              contextBack.setAttribute("back-to-close", "true");
              contextBack.setAttribute("image", "chrome://userchromejs/content/icons/dashedback.svg");
              contextBack.setAttribute("label", "Close Tab");
              contextBack.setAttribute("tooltiptext", "Close current tab (Ctrl+W)");
          } else {
              contextBack.removeAttribute("back-to-close");
              contextBack.removeAttribute("image");               
              contextBack.setAttribute("label", "Back");
              contextBack.setAttribute("tooltiptext", nativeBackTip);
          }
      }

      if (fwdCmd && fwdBtn) {
          fwdBtn.removeAttribute("data-l10n-id");
          if (noFwd) {
              fwdCmd.removeAttribute("disabled");
              fwdBtn.removeAttribute("disabled");
              fwdBtn.setAttribute("forward-to-unclose", "true");
              fwdBtn.setAttribute("tooltiptext", "Reopen closed tab (Ctrl+Shift+T)");
              fwdBtn.removeAttribute("context");
          } else {
              fwdBtn.removeAttribute("forward-to-unclose");
              fwdBtn.setAttribute("tooltiptext", nativeFwdTip);
              fwdBtn.setAttribute("context", "backForwardMenu");
          }
      }

      if (contextFwd) {
          contextFwd.removeAttribute("data-l10n-id");
          if (noFwd) {
              contextFwd.removeAttribute("disabled");
              contextFwd.setAttribute("forward-to-unclose", "true");
              contextFwd.setAttribute("image", "chrome://userchromejs/content/icons/dashedforward.svg");
              contextFwd.setAttribute("label", "Reopen Closed Tab");
              contextFwd.setAttribute("tooltiptext", "Reopen closed tab (Ctrl+Shift+T)");
          } else {
              contextFwd.removeAttribute("forward-to-unclose");
              contextFwd.removeAttribute("image");               
              contextFwd.setAttribute("label", "Forward");
              contextFwd.setAttribute("tooltiptext", nativeFwdTip);
          }
      }
  }

  function getOrCreateUndoMenu() {
      let popup = document.getElementById("uc-custom-undo-popup");
      if (popup) return popup;

      popup = document.createXULElement("menupopup");
      popup.id = "uc-custom-undo-popup";
      document.getElementById("mainPopupSet").appendChild(popup);

      popup.addEventListener("popupshowing", function() {
          while (popup.firstChild) popup.firstChild.remove();
          let closedTabs = SessionStore.getClosedTabData(window);
          
          if (closedTabs.length === 0) {
              let empty = document.createXULElement("menuitem");
              empty.setAttribute("label", "No recently closed tabs");
              empty.setAttribute("disabled", "true");
              popup.appendChild(empty);
              return;
          }

          for (let i = 0; i < Math.min(closedTabs.length, 15); i++) {
              let tabData = closedTabs[i];
              let item = document.createXULElement("menuitem");
              item.setAttribute("label", tabData.title);
              item.setAttribute("image", tabData.image || "chrome://global/skin/icons/defaultFavicon.svg");
              item.setAttribute("class", "menuitem-iconic"); 
              
              item.addEventListener("command", () => SessionStore.undoCloseTab(window, i));
              popup.appendChild(item);
          }
      });
      return popup;
  }

  if (backBtn) {
      backBtn.addEventListener("click", function(e) {
          if (e.button === 0 && !gBrowser.canGoBack) { stopEvent(e); closeTab(); }
      }, true); 
  }

  if (contextMenu) {
      contextMenu.addEventListener("click", function(e) {
          let target = e.target.closest("#context-back");
          if (target && !gBrowser.canGoBack) {
              stopEvent(e);
              contextMenu.hidePopup();
              closeTab();
          }
      }, true); 
  }

  function attachUncloseLogic(btn) {
      if (!btn) return;
      let pressTimer;
      let isLongPress = false;

      btn.addEventListener("mousedown", (e) => {
          if (e.button !== 0 || gBrowser.canGoForward) return; 
          stopEvent(e);
          isLongPress = false;

          pressTimer = setTimeout(() => {
              isLongPress = true;
              getOrCreateUndoMenu().openPopup(btn, "after_start", 0, 0, false, false);
          }, 400); 
      }, true); 

      btn.addEventListener("mouseup", (e) => {
          if (e.button !== 0 || gBrowser.canGoForward) return;
          clearTimeout(pressTimer);
          stopEvent(e);

          if (!isLongPress) {
              if (btn.id === "context-forward" && contextMenu) contextMenu.hidePopup();
              undoCloseTab();
          }
      }, true);

      btn.addEventListener("mouseleave", () => clearTimeout(pressTimer));

      ["click", "command", "contextmenu"].forEach(type => {
          btn.addEventListener(type, (e) => {
              if (!gBrowser.canGoForward) stopEvent(e);
          }, true);
      });
  }

  attachUncloseLogic(fwdBtn);
  attachUncloseLogic(contextFwd);

  function forceEnable(element, checkFn) {
      if (!element) return;
      new MutationObserver((mutations) => {
          for (let m of mutations) {
              if (m.attributeName === "disabled" && element.hasAttribute("disabled") && checkFn()) {
                  updateUIState();
              }
          }
      }).observe(element, { attributes: true, attributeFilter: ["disabled"] });
  }

  forceEnable(backCmd, () => !gBrowser.canGoBack);
  forceEnable(contextBack, () => !gBrowser.canGoBack);
  forceEnable(fwdCmd, () => !gBrowser.canGoForward);
  forceEnable(contextFwd, () => !gBrowser.canGoForward);

  gBrowser.addTabsProgressListener({
      onLocationChange: (aBrowser) => { if (aBrowser === gBrowser.selectedBrowser) updateUIState(); },
      onStateChange: (aBrowser) => { if (aBrowser === gBrowser.selectedBrowser) updateUIState(); }
  });
  window.addEventListener("TabSelect", updateUIState);
  window.addEventListener("SSTabRestored", updateUIState);

  if (contextMenu) {
      contextMenu.addEventListener("popupshowing", () => requestAnimationFrame(updateUIState));
  }

  updateUIState();

  window.addEventListener("mouseup", function(e) {
      if (e.button === 3 && !gBrowser.canGoBack) { stopEvent(e); closeTab(); }
      if (e.button === 4 && !gBrowser.canGoForward) { stopEvent(e); undoCloseTab(); }
  }, true);

  window.addEventListener("keydown", function(e) {
      let noBack = !gBrowser.canGoBack;
      let noFwd = !gBrowser.canGoForward;
      if (!noBack && !noFwd) return;

      let isBackKey = false, isFwdKey = false;
      
      if (e.key === "Backspace") {
          try {
              if (Services.prefs.getIntPref("browser.backspace_action", 2) === 0) {
                  let tag = e.originalTarget.tagName;
                  if (tag !== "INPUT" && tag !== "TEXTAREA" && !e.originalTarget.isContentEditable) {
                      if (e.shiftKey) isFwdKey = true; else isBackKey = true;
                  }
              }
          } catch(err) {}
      }
      
      if (isBackKey && noBack) { stopEvent(e); closeTab(); }
      if (isFwdKey && noFwd) { stopEvent(e); undoCloseTab(); }
  }, true);

  let style = document.createElement("style");
  style.id = "uc-nav-plus-style";
  style.textContent = `
      #back-button[back-to-close="true"] > .toolbarbutton-icon {
          list-style-image: url("chrome://userchromejs/content/icons/dashedback.svg") !important;
      }
      #forward-button[forward-to-unclose="true"] > .toolbarbutton-icon {
          list-style-image: url("chrome://userchromejs/content/icons/dashedforward.svg") !important;
      }
  `;
  document.head.appendChild(style);
})();