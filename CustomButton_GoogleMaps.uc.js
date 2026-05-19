// ==UserScript==
// @name           Custom Button: Google Maps
// @description    Adds a Google Maps button via Factory
// @include        main
// ==/UserScript==

(function() {
  if (location != "chrome://browser/content/browser.xul" &&
      location != "chrome://browser/content/browser.xhtml") return;

  // Create the holding pen if it doesn't exist yet
  window.UC_ButtonConfigQueue = window.UC_ButtonConfigQueue || [];

  // Drop our config into the pen
  window.UC_ButtonConfigQueue.push({
    id: "custombutton_googlemaps",
    name: "Google Maps",
    icon: "chrome://userchromejs/content/icons/googlemaps.svg",
    searchUrl: "https://www.google.com/maps/search/%s",
    defaultUrl: "https://www.google.com/maps",
    menu: [
      { type: "bookmark", name: "🏠 Home", url: "https://www.google.com/maps/dir/?api=1&origin=My+Location&destination=home" },
      { type: "bookmark", name: "🏢 Work", url: "https://www.google.com/maps/dir/?api=1&origin=My+Location&destination=work" },
      { type: "bookmark", name: "🎒 School", url: "https://www.google.com/maps/dir/?api=1&origin=My+Location&destination=school" }
    ]
  });
})();