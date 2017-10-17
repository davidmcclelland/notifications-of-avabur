# Notifications of Avabur
Notifies users (with sounds and toasts) of events within Relics of Avabur.

## Installation
* Install TamperMonkey ([Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en)), ([Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/))
  * GreaseMonkey on FireFox is not recommended, but feel free to test it.
* After installing TamperMonkey, install [Notifications of Avabur](https://github.com/davidmcclelland/notifications-of-avabur/blob/master/notifications-of-avabur.user.js)
* Refresh Avabur
* Settings for NoA are found under `Account Management.`

## Features
* Notifications for:
  * Fatigued
  * Event countdown started
  * Event started
  * Harvestron available
  * Construction available
  * Whispers
  * Knocked out of gauntlet
  * Quest complete

## Needs testing
* Settings
  * Popup for each event (independent)
  * Sound for each event (independent)
* Chat search
  * Be careful with this one - it watches your own chat messages too!
  * Regexes are supported, so go crazy!
  * Items crossed out below should be supported with creative search requests

## TODOs/Vague Ideas
* Sound volume
* Effect changes (double->triple, rage->fury, etc)
* Searching through crafting and drop output
* ~~@mentions in chat~~
* Debounce notifications to prevent being spammed
* ~~Mentioned in event~~
* Documentation
* Come up with additional features
* Settings
  * Debounce timer

## Special Thanks
Userscript heavily borrows from Avabur Improved by [Alorel](https://github.com/Alorel)

Sound effects from RSilveira and morrisjm on freesound.org

Logo icon designed by Freepik from www.flaticon.com

Thanks to AshenSwift for assistance with styling and cross-browser support, along with everyone who helped me test early on.
