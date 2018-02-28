# Notifications of Avabur
Notifies users (with sounds and toasts) of events within Relics of Avabur.

## Installation
* Install TamperMonkey ([Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en)), ([Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/))
  * GreaseMonkey on FireFox is not recommended, but feel free to test it.
* After installing TamperMonkey, install [Notifications of Avabur](https://github.com/davidmcclelland/notifications-of-avabur/raw/master/notifications-of-avabur.user.js)
* Refresh Avabur
* Settings for NoA are found under `Account Management.`

## Features
* Recurring notifications for
  * Harvestron available
  * Construction available
  * Quest complete
  * Fatigue
* One-time Notifications for:
  * Low stamina/fatigued
  * Event countdown started
  * Event started
  * Whispers
  * Knocked out of gauntlet
  * Text search for chat, loot, and crafting
    * Be careful with these - it watches your own chat messages too!
    * Regexes are supported, so go crazy!
* Discord publishing for all notifications
* Settings
  * Popup for each event (independent)
  * Sound for each event (independent)
  * Sound volume
  * Log event
  * Custom sound file
* Log for the last 100 notifications displayed

## Discord Notifications
Discord notifications are toggled on and off like every other type, but also require some additional configuration.

### Webhook Creation
On a discord server on which you are an admin: right click a text channel, select webhooks, create webhook, set name/icon as you wish, then copy the webhook url. Enter this as either the personal or clan discord webhook fields.

### User/Group
Direct user mentions and group mentions are both accepted. `@everyone` and `@here` work great. If you would like to notify individual users, you must use the format `<@UserId>` where UserId is the ID of the desired user (not username). Information on getting user IDs can be found [here](https://www.reddit.com/r/discordapp/comments/61n0sj/pinging_rolesusers_linking_text_channels_through/dffsiuk/). Multiple user names can be specified, eg `<@FirstUserId> <@SecondUserId>`.

## Custom Sounds
Custom sounds must be hosted by a fileserver accessible to your browser. This can be an external website if you find a file hosted online.

### Locally Hosted Sounds
If you would like to host audio files from your computer, the Python HTTP Server can be very easy to set up. See [this page](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/set_up_a_local_testing_server#Running_a_simple_local_HTTP_server) for instructions on setting it up. Assuming you have the file `myaudiofile.wav` hosted locally on port 8000, enter `http://127.0.0.1:800/myaudiofile.wav` into the Sound File URL in NoA.

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
