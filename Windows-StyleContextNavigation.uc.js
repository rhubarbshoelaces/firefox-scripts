// ==UserScript==
// @name           Windows Context Navigation for macOS
// @description    Rebuilds the icon row, supports Close/Unclose, suppresses ghost icons dynamically
// @author         rhubarbshoelaces
// @homepageURL    https://github.com/rhubarbshoelaces/firefox-scripts/
// @include        main
// ==/UserScript==

(function() {
  if (location != "chrome://browser/content/browser.xhtml") return;

  function init() {
      let contextMenu = document.getElementById("contentAreaContextMenu");
      if (!contextMenu) return;

      if (document.getElementById("context-navigation")) return;

      let back = document.getElementById("context-back");
      let fwd = document.getElementById("context-forward");
      let reload = document.getElementById("context-reload");

      if (!back || !fwd || !reload) return;

      back.classList.remove("menuitem-iconic");
      fwd.classList.remove("menuitem-iconic");
      reload.classList.remove("menuitem-iconic");

      let bouncer = new MutationObserver(muts => {
          muts.forEach(m => m.target.removeAttribute("image"));
      });
      
      [back, fwd].forEach(btn => {
          btn.removeAttribute("image");
          bouncer.observe(btn, { attributes: true, attributeFilter: ["image"] });
      });

      let navContainer = document.createXULElement("hbox");
      navContainer.id = "context-navigation";

      // Insert the container and move the buttons into it
      contextMenu.insertBefore(navContainer, back);
      navContainer.append(back, fwd, reload);

      let css = `
        #context-navigation {
            display: flex !important;
            flex-direction: row !important;
            padding: 4px 6px !important;
            color: -moz-menutext !important;
        }
        
        #context-navigation > menuitem {
            flex: 1 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            padding: 6px !important;
            margin: 0 2px !important;
            border-radius: 4px !important;
            -moz-appearance: none !important;
            color: inherit !important;
            list-style-image: none !important;
        }

        /* Aggressively hide native text labels and generated image nodes */
        #context-navigation > menuitem > .menu-text,
        #context-navigation > menuitem > .menu-accel-container,
        #context-navigation > menuitem > .menu-iconic-left,
        #context-navigation > menuitem > .menu-iconic-icon,
        #context-navigation > menuitem > image,
        #context-navigation > menuitem::part(icon) {
            display: none !important;
        }
        
        /* Create the solid block of color using the inherited text color */
        #context-navigation > menuitem::after {
            content: "";
            display: block !important;
            width: 16px !important;
            height: 16px !important;
            background-color: currentColor !important;
        }

        #context-back::after {
            mask: url("chrome://browser/skin/back.svg") center/contain no-repeat !important;
            -webkit-mask: url("chrome://browser/skin/back.svg") center/contain no-repeat !important;
        }
        #context-forward::after {
            mask: url("chrome://browser/skin/forward.svg") center/contain no-repeat !important;
            -webkit-mask: url("chrome://browser/skin/forward.svg") center/contain no-repeat !important;
        }
        #context-reload::after {
            mask: url("chrome://global/skin/icons/reload.svg") center/contain no-repeat !important;
            -webkit-mask: url("chrome://global/skin/icons/reload.svg") center/contain no-repeat !important;
        }

        #context-back[back-to-close="true"]::after {
            mask: url("chrome://userchromejs/content/icons/dashedback.svg") center/contain no-repeat !important;
            -webkit-mask: url("chrome://userchromejs/content/icons/dashedback.svg") center/contain no-repeat !important;
        }
        #context-forward[forward-to-unclose="true"]::after {
            mask: url("chrome://userchromejs/content/icons/dashedforward.svg") center/contain no-repeat !important;
            -webkit-mask: url("chrome://userchromejs/content/icons/dashedforward.svg") center/contain no-repeat !important;
        }

        /* Hover highlight */
        #context-navigation > menuitem:hover {
            background-color: var(--arrowpanel-dimmed, rgba(128,128,128,0.2)) !important;
        }
      `;
      let style = document.createElement("style");
      style.textContent = css;
      document.head.appendChild(style);
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