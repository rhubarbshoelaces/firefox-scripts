// ==UserScript==
// @name           Utility: userChromeJS Folders
// @description    Automatically groups userChrome scripts into submenus natively.
// @author         rhubarbshoelaces
// @homepageURL    https://github.com/rhubarbshoelaces/firefox-scripts/
// @include        main
// ==/UserScript==

(function() {
    if (location != "chrome://browser/content/browser.xul" &&
        location != "chrome://browser/content/browser.xhtml") return;

    function initFolderOrganizer() {
        if (!window.UC || !window.UC.rebuild) {
            setTimeout(initFolderOrganizer, 200);
            return;
        }

        // 1. Completely overwrite the Toolbar Popup to natively build folders
        UC.rebuild.onpopup = function (event) {
            let document = event.target.ownerDocument;

            if (event.target != document.getElementById('userChromejs_options')) return;

            while (document.getElementById('uc-menuseparator').nextSibling) {
                document.getElementById('uc-menuseparator').nextSibling.remove();
            }

            let enabled = xPref.get(_uc.PREF_ENABLED);

            event.target.appendChild(this.elBuilder(document, 'menuitem', {
                label: enabled ? 'Enabled' : 'Disabled (click to Enable)',
                oncommand: _ => xPref.set(_uc.PREF_ENABLED, ' + !enabled + '),
                type: 'checkbox',
                checked: enabled
            }));

            if (Object.keys(_uc.scripts).length > 1) {
                event.target.appendChild(this.elBuilder(document, 'menuseparator'));
            }

            let folders = {};
            let standalones = [];

            // Generate all items and sort them
            Object.values(_uc.scripts).sort((a, b) => a.name.localeCompare(b.name)).forEach(script => {
                if (_uc.ALWAYSEXECUTE.includes(script.filename)) return;

                let scriptName = script.name ? script.name : script.filename;
                let folderName = null;
                let displayName = scriptName;

                if (scriptName.includes(': ')) {
                    let parts = scriptName.split(': ');
                    folderName = parts[0];
                    displayName = parts.slice(1).join(': ');
                }

                let mi = this.elBuilder(document, 'menuitem', {
                    label: displayName,
                    onclick: e => UC.rebuild.clickScriptMenu(e),
                    onmouseup: e => UC.rebuild.shouldPreventHide(e),
                    type: 'checkbox',
                    checked: script.isEnabled,
                    class: 'userChromejs_script',
                    restartless: !!script.shutdown
                });
                mi.filename = script.filename;
                let homepage = script.homepageURL || script.downloadURL || script.updateURL || script.reviewURL;
                if (homepage) mi.setAttribute('homeURL', homepage);
                mi.setAttribute('tooltiptext', `
                    Left-Click: Enable/Disable
                    Middle-Click: Enable/Disable and keep this menu open
                    Right-Click: Edit
                    Ctrl + Left-Click: Reload Script
                    Ctrl + Middle-Click: Open Homepage
                    Ctrl + Right-Click: Uninstall
                `.replace(/^\n| {2,}/g, '') + (script.description ? '\nDescription: ' + script.description : '')
                                            + (homepage ? '\nHomepage: ' + homepage : ''));

                if (folderName) {
                    if (!folders[folderName]) {
                        let folderMenu = this.elBuilder(document, 'menu', { label: folderName, class: 'menu-iconic' });
                        let folderPopup = this.elBuilder(document, 'menupopup', {});
                        folderMenu.appendChild(folderPopup);
                        folders[folderName] = { menu: folderMenu, popup: folderPopup };
                    }
                    folders[folderName].popup.appendChild(mi);
                } else {
                    standalones.push(mi);
                }
            });

            // Append folders first, then standalones
            let folderNames = Object.keys(folders).sort((a, b) => a.localeCompare(b));
            folderNames.forEach(name => event.target.appendChild(folders[name].menu));
            standalones.forEach(item => event.target.appendChild(item));

            document.getElementById('showToolsMenu').setAttribute('label', 'Switch to ' + (this.showToolButton ? 'button in Navigation Bar' : 'item in Tools Menu'));
        };

        // 2. Completely overwrite the Hamburger Menu to natively build subviews
        UC.rebuild.onHamPopup = function (aEvent) {
            const enabledMenuItem = aEvent.target.querySelector('#appMenu-userChromeJS-enabled');
            enabledMenuItem.checked = xPref.get(_uc.PREF_ENABLED);

            const scriptsSeparator = aEvent.target.querySelector('#appMenu-userChromeJS-scriptsSeparator');
            while (scriptsSeparator.nextSibling) {
                scriptsSeparator.nextSibling.remove();
            }

            let doc = aEvent.target.ownerDocument;
            let multiView = aEvent.target.closest('panelmultiview') || doc.getElementById('appMenu-multiView');
            
            let folders = {};
            let standalones = [];

            Object.values(_uc.scripts).sort((a, b) => a.name.localeCompare(b.name)).forEach(script => {
                if (_uc.ALWAYSEXECUTE.includes(script.filename)) return;

                let scriptName = script.name ? script.name : script.filename;
                let folderName = null;
                let displayName = scriptName;

                if (scriptName.includes(': ')) {
                    let parts = scriptName.split(': ');
                    folderName = parts[0];
                    displayName = parts.slice(1).join(': ');
                }

                let scriptMenuItem = UC.rebuild.createMenuItem(doc, null, null, displayName);
                scriptMenuItem.onclick = e => UC.rebuild.clickScriptMenu(e);
                scriptMenuItem.type = 'checkbox';
                scriptMenuItem.checked = script.isEnabled;
                scriptMenuItem.setAttribute('restartless', !!script.shutdown);
                scriptMenuItem.filename = script.filename;
                let homepage = script.homepageURL || script.downloadURL || script.updateURL || script.reviewURL;
                if (homepage) scriptMenuItem.setAttribute('homeURL', homepage);
                scriptMenuItem.setAttribute('tooltiptext', `
                    Left-Click: Enable/Disable
                    Middle-Click: Enable/Disable and keep this menu open
                    Right-Click: Edit
                    Ctrl + Left-Click: Reload Script
                    Ctrl + Middle-Click: Open Homepage
                    Ctrl + Right-Click: Uninstall
                `.replace(/^\n| {2,}/g, '') + (script.description ? '\nDescription: ' + script.description : '')
                                            + (homepage ? '\nHomepage: ' + homepage : ''));

                if (folderName) {
                    if (!folders[folderName]) {
                        let subviewId = 'appMenu-ucjs-folder-' + folderName.replace(/[^a-zA-Z0-9]/g, '-');
                        
                        let oldView = doc.getElementById(subviewId);
                        if (oldView) oldView.remove();

                        let folderNavBtn = doc.createXULElement('toolbarbutton');
                        folderNavBtn.setAttribute('label', folderName);
                        folderNavBtn.className = 'subviewbutton subviewbutton-nav';
                        folderNavBtn.addEventListener('command', function() {
                            window.PanelUI.showSubView(subviewId, this);
                        });
                        
                        let subView = doc.createXULElement('panelview');
                        subView.id = subviewId;
                        subView.className = 'PanelUI-subView';
                        
                        let subViewBody = doc.createXULElement('vbox');
                        subViewBody.className = 'panel-subview-body';
                        subView.appendChild(subViewBody);
                        
                        multiView.appendChild(subView);
                        folders[folderName] = { navBtn: folderNavBtn, body: subViewBody };
                    }
                    folders[folderName].body.appendChild(scriptMenuItem);
                } else {
                    standalones.push(scriptMenuItem);
                }
            });

            let folderNames = Object.keys(folders).sort((a, b) => a.localeCompare(b));
            let parent = scriptsSeparator.parentElement;

            folderNames.forEach(name => parent.appendChild(folders[name].navBtn));
            standalones.forEach(item => parent.appendChild(item));
        };
    }
    
    initFolderOrganizer();
})();