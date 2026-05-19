// ==UserScript==
// @name           Custom Button: Wikipedia
// @description    Wikipedia button via Factory
// @include        main
// ==/UserScript==

(function() {
  if (location != "chrome://browser/content/browser.xul" &&
      location != "chrome://browser/content/browser.xhtml") return;

  window.UC_ButtonConfigQueue = window.UC_ButtonConfigQueue || [];

  window.UC_ButtonConfigQueue.push({
    id: "custombutton_wiki_combined",
    name: "Wikipedia",
    icon: "chrome://userchromejs/content/icons/wikipedia.svg",
    searchUrl: "https://duckduckgo.com/?q=!w+%s",
    defaultUrl: "https://en.wikipedia.org/wiki/Special:Watchlist",
    menu: [
      {
        type: "search",
        name: "Wikimedia Commons",
        image: "chrome://userchromejs/content/icons/wikimediacommons.svg",
        searchUrl: "https://commons.wikimedia.org/w/index.php?search=%s",
        defaultUrl: "https://commons.wikimedia.org/wiki/Special:Main_Page"
      },
      {
        type: "search",
        name: "Wiktionary Search",
        image: "chrome://userchromejs/content/icons/wiktionary.svg",
        searchUrl: "https://duckduckgo.com/?q=!wt+%s",
        defaultUrl: "https://en.wiktionary.org/wiki/Wiktionary:Word_of_the_day"
      },
      {
        type: "separator"
      },
      {
        type: "custom",
        onBuild: function(popup, aDocument, win) {
          const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

          let loadingItem = aDocument.createElementNS(XUL_NS, "menuitem");
          loadingItem.setAttribute("label", "Loading feeds...");
          loadingItem.setAttribute("disabled", "true");
          popup.appendChild(loadingItem);

          // 1. Fetch ITN (HTML Scrape)
          let fetchITN = new Promise((resolve) => {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", "https://en.m.wikipedia.org/wiki/Template:In_the_news", true);
            xhr.onload = () => {
              let elements = [];
              try {
                let doc = new DOMParser().parseFromString(xhr.responseText, "text/html");
                let items = doc.querySelectorAll("ul > li");
                for (let li of items) {
                  if (li.closest(".documentation, .itn-footer")) continue;
                  let boldLink = li.querySelector("b a");
                  if (!boldLink) continue;

                  let link = boldLink.getAttribute("href");
                  if (!link.startsWith("http")) link = "https://en.wikipedia.org" + link;
                  let text = li.textContent.trim().replace(/\s+/g, " ").replace(/\s*\(pictured\)/gi, "");

                  elements.push({name: text, url: link, image: "chrome://userchromejs/content/icons/wikipedia.svg"});
                }
              } catch (e) { console.error("ITN parsing error:", e); }
              resolve(elements);
            };
            xhr.onerror = () => resolve([]);
            xhr.send();
          });

          // 2. Fetch WOTD (Custom XML Parse)
          let fetchWOTD = new Promise((resolve) => {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", "https://en.wiktionary.org/w/api.php?action=featuredfeed&feed=wotd", true);
            xhr.onload = () => {
              let elements = [];
              try {
                let doc = new DOMParser().parseFromString(xhr.responseText, "text/xml");
                let items = doc.querySelectorAll("item");
                let itemsArray = Array.from(items).reverse();

                for (let i = 0; i < Math.min(itemsArray.length, 19); i++) {
                  let itemNode = itemsArray[i];
                  let link = itemNode.querySelector("link")?.textContent;
                  let rawDescription = itemNode.querySelector("description")?.textContent || "";
                  let descDoc = new DOMParser().parseFromString(rawDescription, "text/html");
                  let word = descDoc.querySelector("#WOTD-rss-title")?.textContent.trim() || "No word";
                  let definition = descDoc.querySelector("#WOTD-rss-description")?.textContent.trim() || "";
                  
                  elements.push({name: `${word}: ${definition}`, url: link, image: "chrome://userchromejs/content/icons/wiktionary.svg"});
                }
              } catch (e) { console.error("RSS parsing error:", e); }
              resolve(elements);
            };
            xhr.onerror = () => resolve([]);
            xhr.send();
          });

          // 3. Resolve together and build the XUL items sequentially
          Promise.all([fetchITN, fetchWOTD]).then(([itnElements, wotdElements]) => {
            loadingItem.remove();

            let createItem = (el) => {
              let mi = aDocument.createElementNS(XUL_NS, "menuitem");
              mi.setAttribute("label", el.name);
              mi.setAttribute("image", el.image);
              mi.setAttribute("class", "menuitem-iconic");
              mi.addEventListener("click", (ev) => {
                popup.hidePopup();
                win.openUILink(el.url, ev, {
                  where: (ev.button === 1 || ev.ctrlKey || ev.metaKey) ? "tab" : "current",
                  triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({})
                });
              });
              popup.appendChild(mi);
            };

            itnElements.forEach(createItem);
            
            if (itnElements.length > 0 && wotdElements.length > 0) {
              popup.appendChild(aDocument.createElementNS(XUL_NS, "menuseparator"));
            }
            
            wotdElements.forEach(createItem);
          });
        }
      }
    ]
  });
})();