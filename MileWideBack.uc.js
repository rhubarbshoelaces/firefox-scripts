// ==UserScript==
// @name           Mile Wide Back
// @description    Invisible left-edge bumper for navigation and tab switching.
// @author         rhubarbshoelaces
// @homepageURL    https://github.com/rhubarbshoelaces/firefox-scripts/
// @include        main
// ==/UserScript==

(function() {
  if (location != "chrome://browser/content/browser.xhtml") return;

  function init() {
    let browserContainer = document.getElementById("browser");
    if (!browserContainer || document.getElementById("uc-mile-wide-edge")) return;

    let edgeBox = document.createXULElement("vbox");
    edgeBox.id = "uc-mile-wide-edge";
    edgeBox.style.cssText = `
      width: 4px !important; min-width: 4px !important;
      margin-right: -4px !important; position: relative !important; 
      background-color: transparent !important; z-index: 2147483647 !important; cursor: help !important; 
    `;
    browserContainer.insertBefore(edgeBox, browserContainer.firstChild);

    let stop = (e) => { e.preventDefault(); e.stopPropagation(); };
    let doCmd = (id) => document.getElementById(id)?.doCommand();
    let closeTab = () => doCmd("cmd_close");

    // LEFT CLICK: Reload (Ctrl) OR Go Back / Close Tab
    edgeBox.addEventListener("click", (e) => {
      if (e.button !== 0) return;
      stop(e);
      if (e.ctrlKey || e.metaKey) doCmd("Browser:Reload");
      else gBrowser.canGoBack ? gBrowser.goBack() : closeTab();
    }, true);

    // MIDDLE CLICK: Undo Close (Ctrl) OR Close Tab
    edgeBox.addEventListener("auxclick", (e) => {
      if (e.button !== 1) return;
      stop(e);
      (e.ctrlKey || e.metaKey) ? doCmd("History:UndoCloseTab") : closeTab();
    }, true);

    // RIGHT CLICK: Go Forward
    edgeBox.addEventListener("contextmenu", (e) => {
      stop(e);
      if (gBrowser.canGoForward) gBrowser.goForward();
    }, true);

    // SCROLL WHEEL: Switch Tabs
    edgeBox.addEventListener("wheel", (e) => {
      stop(e);
      gBrowser.tabContainer.advanceSelectedTab(e.deltaY > 0 ? 1 : -1, true);
    }, true);
  }

  if (gBrowserInit.delayedStartupFinished) init();
  else Services.obs.addObserver(function obs(s, t) {
    if (t == "browser-delayed-startup-finished" && s == window) {
      Services.obs.removeObserver(obs, t); init(); 
    }
  }, "browser-delayed-startup-finished");
})();