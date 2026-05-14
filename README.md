# Firefox Custom UI Scripts (.uc.js)

A collection of custom userchrome scripts to enhance and modify the Firefox interface. 

These scripts allow for deep UI customization that goes beyond what standard CSS can do, including custom toolbar buttons, advanced tab navigation, and OS-specific menu fixes. Every script is entirely self-contained (icons are baked into the code) so you only need to download the `.uc.js` file you want.

## ⚠️ Prerequisites

Firefox does not support `.uc.js` scripts out of the box. You **must** install a script loader first. 

I recommend using **[Alex Vallat's fork of the xiaoxiaoflood script loader](https://github.com/AlexVallat/firefox-scripts)**, as it is actively maintained for modern versions of Firefox. 
Follow the installation instructions on that repository to prep your browser before using the scripts below.

## Installation
1. Navigate to your Firefox profile directory (Type `about:support` in your URL bar and click "Open Directory" next to Profile Folder).
2. Open the `chrome` folder.
3. Download the `.uc.js` scripts you want from this repository and place them inside the `chrome` folder.
4. Add any relevant icons to the folder `chrome\utils\icons`.
5. Restart Firefox.

## The Scripts

### Custom Buttons (`ButtonFactory.uc.js`)
These scripts require the ButtonFactory.uc.js to run, but are highly customizable and intended to replace toolbar buttons created with the extension [Custom Buttons](https://sourceforge.net/projects/custombuttons/) using simple JSON formatting. The "search" type buttons will perform a search using text from either Firefox's search bar, URL bar, or highlighted text on the page. I've uploaded several examples to demonstrate formatting and possibilities.

### Close & Unclose Navigation (`Navigation_CloseUnclose.uc`)
Modifies the native Back and Forward buttons. When there is no history to go back to, the Back button becomes a "Close Tab" button. When there is no forward history, the Forward button becomes a "Reopen Closed Tab" dropdown.

### Reload Plus (`Navigation_ReloadPlus.uc.js`)
Adds a dropdown menu with "Bypass Cache" (like Shift+Reload) as well as reload after Firefox performs "Clear Cookies" on the site or "Clear Local Storage" on the site.

### Back Track (`Navigation_BackTrack.uc.js`)
Working with the Close & Unclose Navigation, this tells Firefox to switch back to a parent tab when a child tab is closed, and adds parent tab information to the back menu.

### Windows Context Menus for Mac (`Windows-StyleContextMenu_macOS-Only.uc.js`)
*macOS Only*
Horizontal Back/Forward/Reload icon row at the top of the right-click context menu for macOS, bringing it in line with the Windows 11 Firefox experience and built to work in concert with the Close & Unclose script.

### UserChromeJS Folder Organizer (`UserChromeJS_Folder_Orgainizer`)
Sorts scripts in the UserChromeJS menu into subfolders based on their name, with any text before a colon becoming the subfolder name.

### Mile Wide Back (`MileWideBack.uc.js`)
This make the vertical left side of the browser window a back/forward/reload/reopen tab button and is a replacement for addons [like this one](https://addons.mozilla.org/en-US/firefox/addon/milewideback-webext/) that were limited by the WebExtensions API.
