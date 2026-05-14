// ==UserScript==
// @name           Custom Button: Toggle Find Bar
// @description    Toggles the Find Bar via Factory Actions
// @author         rhubarbshoelaces
// @homepageURL    https://github.com/rhubarbshoelaces/firefox-scripts/
// @include        main
// ==/UserScript==

(function() {
  if (location != "chrome://browser/content/browser.xul" &&
      location != "chrome://browser/content/browser.xhtml") return;

  window.UC_ButtonConfigQueue = window.UC_ButtonConfigQueue || [];

  window.UC_ButtonConfigQueue.push({
    id: "custombutton_findbartoggle",
    name: "Find",
    icon: "chrome://userchromejs/content/icons/find_in_page.svg",
    searchUrl: "ACTION:TOGGLE_FINDBAR",
    defaultUrl: "ACTION:TOGGLE_FINDBAR"
  });
})();