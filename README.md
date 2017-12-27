# Notifications of Avabur
Notifies users (with sounds and toasts) of events within Relics of Avabur.

## Installation
* Install TamperMonkey ([Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en)), ([Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/))
  * GreaseMonkey on FireFox is not recommended, but feel free to test it.
* After installing TamperMonkey, install [Notifications of Avabur](https://github.com/davidmcclelland/notifications-of-avabur/blob/master/notifications-of-avabur.user.js)
* Refresh Avabur
* Settings for NoA are found under `Account Management.`

## Features
* Recurring notifications for
  * Harvestron available
  * Construction available
  * Quest complete
* One-time Notifications for:
  * Low stamina/fatigued
  * Event countdown started
  * Event started
  * Whispers
  * Knocked out of gauntlet
  * Text search for chat, loot, and crafting
    * Be careful with these - it watches your own chat messages too!
    * Regexes are supported, so go crazy!
* Discord publishing for events
* Settings
  * Popup for each event (independent)
  * Sound for each event (independent)
  * Sound volume
* Log for the last 100 notifications displayed

## TODOs/Vague Ideas
* Recurring notifications for
  * Fatigue
* Effect changes (double->triple, rage->fury, etc)
* Throttle notifications to prevent being spammed
* Come up with additional features
* Settings
  * Throttle timer

## Help
If you need help, you should join the AvaNotifications channel on RoA.

## Bugs/Suggestions
If you have bugs to report or feature suggestions, file an issue on the github repository.

## Special Thanks
Userscript heavily borrows from Avabur Improved by [Alorel](https://github.com/Alorel)

Sound effects from RSilveira and morrisjm on freesound.org

Logo icon designed by Freepik from www.flaticon.com

Thanks to AshenSwift for assistance with styling and cross-browser support, @dang on ava for some PRs and tons of regex help, along with everyone who helped me test early on.
