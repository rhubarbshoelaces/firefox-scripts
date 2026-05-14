// ==UserScript==
// @name           Custom Button: Gmail
// @description    Adds a Gmail button via Factory
// @author         rhubarbshoelaces
// @homepageURL    https://github.com/rhubarbshoelaces/firefox-scripts/
// @include        main
// ==/UserScript==

(function() {
  if (location != "chrome://browser/content/browser.xul" &&
      location != "chrome://browser/content/browser.xhtml") return;

  window.UC_ButtonConfigQueue = window.UC_ButtonConfigQueue || [];

  window.UC_ButtonConfigQueue.push({
    id: "custombutton_gmail",
    name: "Gmail",
    icon: "chrome://userchromejs/content/icons/gmail.svg",
    searchUrl: "https://mail.google.com/mail/u/0/#search/%s",
    defaultUrl: "https://mail.google.com/mail/u/0/#search/is%3Aunread+-in%3Aspam+-in%3Atrash",
    menu: [
      {
        type: "bookmark",
        name: "Compose",
		image: "chrome://userchromejs/content/icons/gmail_new.png",
        url: "https://mail.google.com/mail/#compose"
      },
      {
        type: "bookmark",
        name: "Inbox",
		image: "chrome://userchromejs/content/icons/inbox_f0f0f0.png",		
        url: "https://mail.google.com/mail/u/0/#inbox"
      },
      {
        type: "bookmark",
        name: "All Mail",
		image: "chrome://userchromejs/content/icons/all_mail.png",
        url: "https://mail.google.com/mail/u/0/#all"
      }
    ]
  });
})();