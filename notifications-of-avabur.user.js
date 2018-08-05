// ==UserScript==
// @name           Notifications of Avabur
// @namespace      https://github.com/davidmcclelland/
// @author         Dave McClelland <davidmcclelland@gmail.com>
// @homepage       https://github.com/davidmcclelland/notifications-of-avabur
// @supportURL     https://github.com/davidmcclelland/notifications-of-avabur/issues
// @downloadURL    https://github.com/davidmcclelland/notifications-of-avabur/raw/master/notifications-of-avabur.user.js
// @description    Never miss another gauntlet again!
// @match          https://*.avabur.com/game*
// @version        1.13.0-beta1
// @icon           https://rawgit.com/davidmcclelland/notifications-of-avabur/master/res/img/logo-32.png
// @run-at         document-end
// @connect        githubusercontent.com
// @connect        github.com
// @connect        self
// @grant          GM_addStyle
// @require        https://rawgit.com/davidmcclelland/notifications-of-avabur/master/lib/toastmessage/javascript/jquery.toastmessage.js
// @require        https://cdnjs.cloudflare.com/ajax/libs/buzz/1.2.0/buzz.min.js
// @require        https://raw.githubusercontent.com/lodash/lodash/4.17.4/dist/lodash.min.js
// @require        https://cdn.jsdelivr.net/npm/vue
// @license        LGPL-2.1
// @noframes
// ==/UserScript==

//Check if the user can even support the bot
if (typeof (MutationObserver) === "undefined") {
    console.log("Cannot support mutation observer!");
} else {
    (function ($, MutationObserver, buzz) {
        'use strict';

        /**
         * Creates a GitHub CDN URL
         * @param {String} path Path to the file without leading slashes
         * @param {String} [author] The author. Defaults to davidmcclelland
         * @param {String} [repo] The repository. Defaults to notifications-of-avabur
         * @returns {String} The URL
         */
        const gh_url = function (path, author, repo) {
            author = author || "davidmcclelland";
            repo = repo || "notifications-of-avabur";

            // return "https://cdn.rawgit.com/" + author + "/" + repo + "/" +
            //     GM_info.script.version + "/" + path;
            return "https://rawgit.com/" + author + "/" + repo + "/" +
                'master' + "/" + path;
        };

        const URLS = {
            sfx: {
                message_ding: gh_url('res/sfx/message_ding.wav')
            },
            img: {
                icon: gh_url('res/img/logo-32.png'),
                chatSearch: gh_url('res/img/noa-chat.png'),
                construction: gh_url('res/img/noa-construction.png'),
                craftingSearch: gh_url('res/img/noa-crafting.png'),
                lootSearch: gh_url('res/img/noa-drop.png'),
                event: gh_url('res/img/noa-event.png'),
                fatigued: gh_url('res/img/noa-fatigued.png'),
                harvestron: gh_url('res/img/noa-harvestron.png'),
                quest: gh_url('res/img/noa-quest.png'),
                weakened: gh_url('res/img/noa-weakened.png'),
                whisper: gh_url('res/img/noa-whisper.png')
            }
        };

        const clickToAChannelTab = function (node) {
            if (typeof node.getToAChannelInfo === 'function') {
                let { channelID } = node.getToAChannelInfo();
                if (false !== channelID) {
                    $(`#channelTab${channelID}`).click();
                }
            }
        };



        /////////////////////////////////////////////////////
        // This is the script code. Don't change it unless //
        // you know what you're doing ;)                   //
        /////////////////////////////////////////////////////

        const DEFAULT_USER_SETTINGS = {
            recurToDiscord: false,
            muteWhileAfk: true,
            recurringNotificationsTimeout: 20,
            soundVolume: 80,
            lowStaminaThreshold: 5,
            popupDurationSec: 5,
            fatigue: { popup: true, sound: true, log: false, clanDiscord: false, personalDiscord: false, recur: true },
            eventFiveMinuteCountdown: { popup: true, sound: true, log: true, clanDiscord: false, personalDiscord: false, recur: true },
            eventElimination: { popup: false, sound: false, log: false, clanDiscord: false, personalDiscord: false },
            eventTimeRemaining: [],
            harvestron: { popup: true, sound: true, log: true, clanDiscord: false, personalDiscord: false, recur: true },
            construction: { popup: true, sound: true, log: true, clanDiscord: false, personalDiscord: false, recur: true },
            whisper: { popup: true, sound: true, log: true, clanDiscord: false, personalDiscord: false },
            questComplete: { popup: true, sound: true, log: true, clanDiscord: false, personalDiscord: false, recur: true },
            chatSearch: [],
            craftingSearch: [],
            lootSearch: [],
            clanDiscord: { webhook: '', target: '' },
            personalDiscord: { webhook: '', target: '' }
        };

        const SETTINGS_KEY = 'NoASettings';

        const NOA_STYLES = `
.row.text-center > div {
    display: inline-block;
    float: none;
}
#NoASettings input {
    margin-right: 10px;
}
#NoASettings textarea {
    width: 50%;
    height: 80px;
}
#NoASettings hr {
    margin-top: 10px;
    margin-bottom: 10px;
}
#notificationLogItems {
    margin-top: 10px;
}
        `;

        const SETTINGS_DIALOG_HTML = `
<div id="NoASettings" style="display: none; margin: 10px;">
    <div id="NoASettingsButtonWrapper" class="center">
        <a id="NoANotificationSettingsButton">
            <button class="btn btn-primary">Notifications</button>
        </a>
        <a id="NoAAdvancedSettingsButton">
            <button class="btn btn-primary">Advanced</button>
        </a>
        <a id="NoAImportExportButton">
            <button class="btn btn-primary">Import/Export</button>
        </a>
        <a id="NoALogButton">
            <button class="btn btn-primary">Log</button>
        </a>
    </div>
    <div id="NoASettingsContentWrapper">
        <div id="NoANotificationSettingsWrapper">
            <div>
                <h4 class="nobg">General</h4>
                <div class="row">
                    <div class="col-xs-3">
                        <label>
                            <input id="recurToDiscordEditor" type="checkbox" v-model="userSettings.recurToDiscord"> Recur to Discord
                        </label>
                    </div>
                    <div class="col-xs-3">
                        <label>Recurrence Time (sec)</label>
                        <input id="recurringNotificationsTimeoutEditor" type="number" min="1" max="100" v-model="userSettings.recurringNotificationsTimeout">
                    </div>
                    <div class="col-xs-3">
                        <label>Sound Volume</label>
                        <input id="soundVolumeEditor" type="number" min="1" max="100" v-model="userSettings.soundVolume">
                    </div>
                    <div class="col-xs-3">
                        <label>Low Stamina Threshold</label>
                        <input id="lowStaminaThresholdEditor" type="number" min="0" max="9999" v-model="userSettings.lowStaminaThreshold">
                    </div>
                    <div class="col-xs-3">
                        <label>
                            <input id="muteWhileAfkEditor" type="checkbox" v-model="userSettings.muteWhileAfk">Mute While AFK</label>
                    </div>
                    <div class="col-xs-3">
                        <label>Popup Duration (sec)
                            <input id="popupDurationEditor" type="number" min="1" max="60" v-model="userSettings.popupDurationSec">
                    </div>
                </div>
            </div>
            <hr>
            <div>
                <h4 class="nobg">Clan Discord</h4>
                <div class="row">
                    <label class="col-xs-3">
                        <a href="https://discordapp.com/developers/docs/resources/webhook#execute-webhook" target="_blank">Webhook</a>
                    </label>
                    <div class="col-xs-9">
                        <input id="clanDiscordWebhookEditor" type="text" style="width: 80%;" v-model="userSettings.clanDiscord.webhook">
                    </div>
                </div>
                <div class="row">
                    <label class="col-xs-3">User/Group</label>
                    <div class="col-xs-9">
                        <input id="clanDiscordTargetEditor" type="text" style="width: 80%;" v-model="userSettings.clanDiscord.target">
                    </div>
                </div>
            </div>
            <hr>
            <div>
                <h4 class="nobg">Personal Discord</h4>
                <div class="row">
                    <label class="col-xs-3">
                        <a href="https://discordapp.com/developers/docs/resources/webhook#execute-webhook" target="_blank">Webhook</a>
                    </label>
                    <div class="col-xs-9">
                        <input id="personalDiscordWebhookEditor" type="text" style="width: 80%;" v-model="userSettings.personalDiscord.webhook">
                    </div>
                </div>
                <div class="row">
                    <label class="col-xs-3">User/Group</label>
                    <div class="col-xs-9">
                        <input id="personalDiscordTargetEditor" type="text" style="width: 80%;" v-model="userSettings.personalDiscord.target">
                    </div>
                </div>
            </div>
            <hr>
            <table id="NoASettingsTable" class="table table-condensed">
                <thead>
                    <tr>
                        <td></td>
                        <th scope="col">Popup</th>
                        <th scope="col">Sound</th>
                        <th scope="col">Log</th>
                        <th scope="col">Clan</th>
                        <th scope="col">Personal</th>
                        <th scope="col">Recur</th>
                        <th scope="col">Popup Icon URL</th>
                        <th scope="col">Sound File URL</th>
                        <th scope="col">Test Notifications</th>
                    </tr>
                </thead>
                <tbody>
                    <tr is="settings-entry" name="Fatigue" :setting="userSettings.fatigue"></tr>
                    <tr is="settings-entry" name="Harvestron" :setting="userSettings.harvestron"></tr>
                    <tr is="settings-entry" name="Construction" :setting="userSettings.construction"></tr>
                    <tr is="settings-entry" name="Quest Complete" :setting="userSettings.questComplete"></tr>
                    <tr is="settings-entry" name="Whisper" :setting="userSettings.whisper"></tr>
                    <tr is="settings-entry" name="Gauntlet Queue Reminder" :setting="userSettings.eventFiveMinuteCountdown"></tr>
                    <tr is="settings-entry" name="Event Weakened" :setting="userSettings.eventElimination"></tr>
                </tbody>
            </table>
        </div>
        <div id="NoAAdvancedSettingsWrapper">
            <table class="table table-condensed">
                <thead>
                    <tr>
                        <td></td>
                        <th scope="col">Popup</th>
                        <th scope="col">Sound</th>
                        <th scope="col">Log</th>
                        <th scope="col">Clan</th>
                        <th scope="col">Personal</th>
                        <th scope="col">Recur</th>
                        <th scope="col">Popup Icon URL</th>
                        <th scope="col">Sound File URL</th>
                        <th scope="col">Test Notifications</th>
                        <th scope="col">Remove</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="header">
                        <th colspan="3" scope="col">
                            <h3 class="nobg">
                                <span>Chat Search (<a href="https://github.com/davidmcclelland/notifications-of-avabur/wiki/Chat-search" target="_blank">Help</a>)</span>
                                <button type="button" class="btn btn-primary btn-sm" v-on:click="addChatSearch()" style="margin-top: 0;">Add</button>
                            </h3>
                        </th>
                    </tr>
                    <tr v-for="(chatSearch, index) in userSettings.chatSearch" is="settings-entry" :setting="chatSearch" type="regex" :collection="userSettings.chatSearch" :index="index"></tr>
                </tbody>
                <tbody>
                    <tr class="header">
                        <th colspan="3" scope="col">
                            <h3 class="nobg">
                                <span>Crafting Search (<a href="https://github.com/davidmcclelland/notifications-of-avabur/wiki/Crafting-search" target="_blank">Help</a>)</span>
                                <button type="button" class="btn btn-primary btn-sm" v-on:click="addCraftingSearch()" style="margin-top: 0;">Add</button>
                            </h3>
                        </th>
                    </tr>
                    <tr v-for="(craftingSearch, index) in userSettings.craftingSearch" is="settings-entry" :setting="craftingSearch" type="regex" :collection="userSettings.craftingSearch" :index="index"></tr>
                </tbody>
                <tbody>
                    <tr class="header">
                        <th colspan="3" scope="col">
                            <h3 class="nobg">
                                <span>Loot Search (<a href="https://github.com/davidmcclelland/notifications-of-avabur/wiki/Loot-search" target="_blank">Help</a>)</span>
                                <button type="button" class="btn btn-primary btn-sm" v-on:click="addLootSearch()" style="margin-top: 0;">Add</button>
                            </h3>
                        </th>
                    </tr>
                    <tr v-for="(lootSearch, index) in userSettings.lootSearch" is="settings-entry" :setting="lootSearch" type="regex" :collection="userSettings.lootSearch" :index="index"></tr>
                </tbody>
                <tbody>
                    <tr class="header">
                        <th colspan="3" scope="col">
                            <h3 class="nobg">
                                <span>Event Time Remaining</span>
                                <button type="button" class="btn btn-primary btn-sm" v-on:click="addEventTime()" style="margin-top: 0;">Add</button>
                            </h3>
                        </th>
                    </tr>
                    <tr v-for="(eventTime, index) in userSettings.eventTimeRemaining" is="settings-entry" :setting="eventTime" type="eventTime" :collection="userSettings.eventTimeRemaining" :index="index"></tr>
                </tbody>
            </table>
        </div>
        <div id="NoASettingsImportExportWrapper">
            <div class="row" style="margin-top: 5px;">
                <textarea onfocus="this.select()" v-model="importExportValue"></textarea>
            </div>
            <div class="row">
                <button type="button" class="btn btn-primary" v-on:click="tryImportSettings">Import Displayed</button>
                <button type="button" class="btn btn-primary" v-on:click="displayCurrentSettings">Display Current</button>
            </div>
        </div>
        <div id="NoANotificationLog">
            <button class="btn btn-primary" id="notificationLogRefresh">Refresh</button>
            <ul id="notificationLogItems"></ul>
        </div>
    </div>
    <div class="row" style="display: none;" id="NoaSettingsSavedLabel">
        <strong class="col-xs-12">
            Settings have been saved
        </strong>
    </div>
</div>
        `;

        const INTERNAL_UPDATE_URL = "https://api.github.com/repos/davidmcclelland/notifications-of-avabur/contents/notifications-of-avabur.user.js";

        var userSettings = null;
        var importExportValue = null;

        var isEventCountdownActive = false;
        var hasQueuedForGauntlet = false;

        var counters = {
            lastConstructionNotification: 0,
            lastFatigueNotification: 0,
            lastHarvestronNotification: 0,
            lastQuestNotification: 0,
            lastGauntletQueueNotification: 0,
        };


        var notificationLogEntries = [];

        var checkForUpdateTimer = 0;

        // Obviously no sound is playing, but we need to block audio until the dom is loaded
        var isSoundPlaying = true;

        // I suspect that this may help fix some issues with Chrome's new auto-playing audio changes
        window.addEventListener('load', function () {
            isSoundPlaying = false;
        });

        if (!String.format) {
            String.format = function (format) {
                var args = Array.prototype.slice.call(arguments, 1);
                return format.replace(/{(\d+)}/g, function (match, number) {
                    return typeof args[number] != 'undefined' ? args[number] : match;
                });
            };
        }

        /** Misc function container */
        const fn = {
            versionCompare: function (v1, v2) {
                var regex = new RegExp("(\.0+)+");
                v1 = v1.replace(regex, "").split(".");
                v2 = v2.replace(regex, "").split(".");
                var min = Math.min(v1.length, v2.length);

                var diff = 0;
                for (var i = 0; i < min; i++) {
                    diff = parseInt(v1[i], 10) - parseInt(v2[i], 10);
                    if (diff !== 0) {
                        return diff;
                    }
                }

                return v1.length - v2.length;
            },
            checkForUpdate: function () {
                var version = "";
                $.get(INTERNAL_UPDATE_URL).done(function (res) {
                    var match = atob(res.content).match(/\/\/\s+@version\s+([^\n]+)/);
                    version = match[1];

                    if (fn.versionCompare(GM_info.script.version, version) < 0) {
                        var message = "<li class=\"chat_notification\">Notifications Of Avabur has been updated to version " + version + "! <a href=\"https://github.com/davidmcclelland/notifications-of-avabur/raw/master/notifications-of-avabur.user.js\" target=\"_blank\">Update</a> | <a href=\"https://github.com/davidmcclelland/notifications-of-avabur/commits/master\" target=\"_blank\">Changelog</a></li>";
                        // TODO: Handle chat direction like ToA does
                        $("#chatMessageList").prepend(message);
                    } else {
                        checkForUpdateTimer = setTimeout(fn.checkForUpdate, 24 * 60 * 60 * 1000);
                    }
                });
            },
            sendDiscordMessage: function (webhook, target, text) {
                if (webhook && target && text) {
                    let messageContent = text;
                    if (target && target.length) {
                        messageContent = target + ' ' + text;
                    }

                    if (webhook.includes("discordapp")) {
                        $.post(webhook, { content: messageContent });
                    } else {
                        $.ajax({
                            data: 'payload=' + JSON.stringify({
                                "text": messageContent
                            }),
                            dataType: 'json',
                            processData: false,
                            type: 'POST',
                            url: webhook
                        });
                    }
                }
            },
            /**
             * Creates a floaty notification and plays a sound, based on preferences
             * @param {String} text Text to display
             * @param {String} iconUrl Icon to display in the popup
             * @param {object} settings Settings for this type of notification
             * @param {number} recurrenceCounter The number of seconds this event has recurred for. Optional, defaults to zero
             * @param {Function} [onPopupClick] An optional function to be called back when/if a popup is clicked
             */
            notification: function (text, defaultPopupIcon, settings, recurrenceCounter, onPopupClick, onPopupClickArgs = []) {
                recurrenceCounter = _.defaultTo(recurrenceCounter, 0);

                const isFirstRecurrence = (recurrenceCounter === 0);

                const recurrenceEnabled = _.defaultTo(settings.recur, false);
                const discordRecurrenceEnabled = _.defaultTo(userSettings.recurToDiscord, false);
                // It's a good recurrence if it is the first one, or if recurring notifications are on
                // and it's been long enough since the previous
                const isGoodRecurrence = isFirstRecurrence ||
                    (recurrenceEnabled && (recurrenceCounter % userSettings.recurringNotificationsTimeout === 0));

                // While muted, only log. No sounds, popups, or discord
                const isMuted = fn.checkIsMuted();

                // Only ever send to discord and log the first instance of a recurrence,j
                // even if it's a good recurrence
                // Only ever log on the first recurrence.
                const doLog = settings.log && isFirstRecurrence;

                // Only send to discord if discord is enabled and (it's the first recurrence or (it's a good recurrence and recur to discord is enabled))
                const doClanDiscord = !isMuted && settings.clanDiscord && (isFirstRecurrence || (isGoodRecurrence && discordRecurrenceEnabled));
                const doPersonalDiscord = !isMuted && settings.personalDiscord && (isFirstRecurrence || (isGoodRecurrence && discordRecurrenceEnabled));

                // Recur popup and sound notifications
                const doPopup = !isMuted && settings.popup && isGoodRecurrence;
                const doSound = !isMuted && settings.sound && isGoodRecurrence;

                if (doLog) {
                    notificationLogEntries.push({
                        timestamp: new Date(),
                        text: text
                    });
                }

                if (notificationLogEntries.length > 100) {
                    notificationLogEntries.shift();
                }

                if (doPopup) {
                    var popupIconUrl = settings.popupIcon;
                    if (!popupIconUrl || !popupIconUrl.length) {
                        popupIconUrl = defaultPopupIcon;
                    }

                    Notification.requestPermission().then(function () {
                        var n = new Notification(GM_info.script.name, {
                            icon: popupIconUrl,
                            body: text
                        });
                        const popupDurationSec = _.defaultTo(userSettings.popupDurationSec, 5);
                        setTimeout(n.close.bind(n), popupDurationSec * 1000);
                        n.addEventListener('click', function (e) {
                            window.focus();
                            e.target.close();

                            if (typeof onPopupClick === 'function') {
                                if (!Array.isArray(onPopupClickArgs)) {
                                    onPopupClickArgs = [onPopupClickArgs];
                                }
                                onPopupClick.apply(null, onPopupClickArgs);
                            }

                        }, false);
                    });
                }

                if (doSound) {
                    var soundFileUrl = settings.soundFile;
                    if (!soundFileUrl || !soundFileUrl.length) {
                        soundFileUrl = URLS.sfx.message_ding;
                    }

                    if (!isSoundPlaying) {
                        const buzzFile = new buzz.sound(soundFileUrl, { volume: userSettings.soundVolume });

                        buzzFile.bind('ended', function () {
                            isSoundPlaying = false;
                        });

                        buzzFile.bind('error', function () {
                            console.log('[NoA] Error playing audio file: ', this.getErrorMessage());
                            isSoundPlaying = false;
                        });

                        buzzFile.play();
                        isSoundPlaying = true;
                    }
                }

                if (doClanDiscord) {
                    fn.sendDiscordMessage(userSettings.clanDiscord.webhook, userSettings.clanDiscord.target, text);
                }

                if (doPersonalDiscord) {
                    fn.sendDiscordMessage(userSettings.personalDiscord.webhook, userSettings.personalDiscord.target, text);
                }
            },
            displaySettingsSavedLabel: function () {
                const label = document.getElementById('NoaSettingsSavedLabel');
                if (label && label.style) {
                    label.style.display = 'block';
                }
            },
            debouncedHideSettingsSavedLabel: _.debounce(function () {
                const label = document.getElementById('NoaSettingsSavedLabel');
                if (label && label.style) {
                    label.style.display = 'none';
                }
            }, 3000),
            getUpgradedRegexSetting: function (oldSetting) {
                const retVal = [];
                _.forEach(oldSetting.searchText.split(/\r?\n/), function (singleSearch) {
                    const newSetting = _.clone(oldSetting);
                    newSetting.searchText = singleSearch;
                    retVal.push(newSetting);
                });
                return retVal;
            },
            loadUserSettings: function () {
                var loadedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY));
                userSettings = _.defaultsDeep(loadedSettings, DEFAULT_USER_SETTINGS);

                // Previously, regex searches were stored as a string and then split at text-search time.
                if (!_.isArray(userSettings.chatSearch)) {
                    userSettings.chatSearch = fn.getUpgradedRegexSetting(userSettings.chatSearch);
                }

                if (!_.isArray(userSettings.craftingSearch)) {
                    userSettings.craftingSearch = fn.getUpgradedRegexSetting(userSettings.craftingSearch);
                }

                if (!_.isArray(userSettings.lootSearch)) {
                    userSettings.lootSearch = fn.getUpgradedRegexSetting(userSettings.lootSearch);
                }

                // Save settings to store any defaulted settings
                fn.storeUserSettings();
            },
            storeUserSettings: function () {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(userSettings));

                fn.displaySettingsSavedLabel();
                fn.debouncedHideSettingsSavedLabel();
            },
            checkIsAfk: function () {
                const element = document.getElementById('iAmAFK');
                return element && (element.style.display !== 'none');
            },
            checkIsMuted: function () {
                return userSettings.muteWhileAfk && fn.checkIsAfk();
            },
            checkConstructionVisible: function () {
                var div = document.getElementById('constructionNotifier');
                if (div && (div.style.display !== 'none')) {
                    const constructionCallback = function () {
                        $('#constructionNotifier').click();
                    };

                    fn.notification('Construction available!', URLS.img.construction, userSettings.construction, counters.lastConstructionNotification, constructionCallback);
                    counters.lastConstructionNotification++;
                } else {
                    counters.lastConstructionNotification = 0;
                }
            },
            checkFatigue: function () {
                const searchSpan = document.getElementById('autosRemaining');

                const staminaRemainingText = searchSpan.innerText || searchSpan.textContent;
                const staminaRemainingNumber = parseInt(staminaRemainingText, 10);
                if (staminaRemainingNumber <= 0) {
                    fn.notification('You are fatigued!', URLS.img.fatigued, userSettings.fatigue, counters.lastFatigueNotification);
                    counters.lastFatigueNotification++;
                } else {
                    counters.lastFatigueNotification = 0;
                }
            },
            checkHarvestronVisible: function () {
                var div = document.getElementById('harvestronNotifier');
                if (div && (div.style.display !== 'none')) {
                    const harvestronCallback = function () {
                        $('#harvestronNotifier').click();
                    };

                    fn.notification('Harvestron available!', URLS.img.harvestron, userSettings.harvestron, counters.lastHarvestronNotification, harvestronCallback);
                    counters.lastHarvestronNotification++;
                } else {
                    counters.lastHarvestronNotification = 0;
                }
            },
            checkQuestComplete: function () {
                var visibleQuestDivId;
                const possibleQuestDivIds = ['bq_info', 'tq_info', 'pq_info'];
                for (var i = 0; i < possibleQuestDivIds.length; i++) {
                    var questDiv = document.getElementById(possibleQuestDivIds[i]);
                    if (questDiv) {
                        var parentDiv = questDiv.parentElement;
                        if (parentDiv && (parentDiv.style.display !== 'none')) {
                            visibleQuestDivId = possibleQuestDivIds[i];
                            break;
                        }
                    }
                }

                if (!visibleQuestDivId) {
                    return;
                }

                const visibleQuestDiv = $('#' + visibleQuestDivId);

                if (visibleQuestDivId && (visibleQuestDiv.text().startsWith('You have completed your quest!'))) {
                    const questCallback = function () {
                        // Find the first <a> sibling of the vibile questDiv and click it
                        visibleQuestDiv.siblings('a').first().click();
                    };

                    const notificationText = visibleQuestDiv.siblings('a').first().text().trim() + ' complete!';
                    fn.notification(notificationText, URLS.img.quest, userSettings.questComplete, counters.lastQuestNotification, questCallback);
                    counters.lastQuestNotification++;
                } else {
                    counters.lastQuestNotification = 0;
                }
            },
            checkRecordsVisible: function (records) {
                for (var i = 0; i < records.length; i++) {
                    const target = $(records[i].target);
                    var style = window.getComputedStyle(target[0]);
                    if (style.display !== 'none') {
                        return true;
                    }
                }
                return false;
            },
            findSearchValues: function (text, searchValues) {
                // Look for any values in the array
                for (var k = 0; k < searchValues.length; k++) {
                    if (searchValues[k].searchText.length && text.match(new RegExp(searchValues[k].searchText, 'i'))) {
                        return searchValues[k];
                    }
                }
            },
            isToAProcessed: function (node) {
                return $(node).hasClass('processed');
            },
            findSearchValuesInRecords: function (records, searchValues) {
                for (var i = 0; i < records.length; i++) {
                    const addedNodes = records[i].addedNodes;
                    if (addedNodes.length) {
                        for (var j = 0; j < addedNodes.length; j++) {
                            const text = $(addedNodes[j]).text();
                            const foundSearchValue = fn.findSearchValues(text, searchValues);
                            if (!fn.isToAProcessed(addedNodes[j]) && foundSearchValue) {
                                return {
                                    node: addedNodes[j],
                                    searchValue: foundSearchValue,
                                }
                            }
                        }
                    }
                }
                return null;
            },
            checkEventParticipation: function () {
                return document.querySelector('#bossWrapper').style.display !== 'none';
            },
            checkQueuedForGauntlet: function () {
                // If they've already queued then we don't need to do anything else
                if(hasQueuedForGauntlet) {
                    return;
                }

                // If they're in the gauntlet, stop alerting
                if (fn.checkEventParticipation()) {
                    return;
                }

                // If the gauntlet is over, there's no point in continuing
                if ($('#eventCountdown').css('display') === 'none') {
                    return;
                }

                // Actually display the notification
                const eventCallback = function () {
                    $('#event_start').click();
                };

                fn.notification('An event is starting soon!', URLS.img.event, userSettings.eventFiveMinuteCountdown, counters.lastGauntletQueueNotification, eventCallback);
                
                if(userSettings.eventFiveMinuteCountdown.recur) {
                    counters.lastGauntletQueueNotification ++; // We want every recurrence of this to force a notification
                    setTimeout(fn.checkQueuedForGauntlet, 1000);
                }
            },
            setupEventNotifications: function (countdownBadgeText) {
                if (!isEventCountdownActive) {
                    if (countdownBadgeText === '!' || countdownBadgeText.startsWith('*')) {
                        return;
                    }

                    isEventCountdownActive = true;
                    // First thing's first, figure out how long until the event (in seconds)
                    /* We handle this a bit odd - if the countdown string doesn't list 'm', then it is displaying
                    only seconds. This could be slightly more elegantly solved with indexof, but I already wrote it this way and it works. */
                    var minutesString = '0';
                    var secondsString = '0';
                    if (countdownBadgeText.includes('m')) {
                        minutesString = countdownBadgeText.slice(0, 2);
                        secondsString = countdownBadgeText.slice(3, 5);
                    } else {
                        secondsString = countdownBadgeText.slice(0, 2);
                    }
                    var secondsUntilEventStart = (parseInt(minutesString, 10) * 60) + parseInt(secondsString, 10);
                    var secondsUntilEventEnd = secondsUntilEventStart + (60*15);

                    hasQueuedForGauntlet = false;
                    counters.lastGauntletQueueNotification = 0;
                    fn.checkQueuedForGauntlet();

                    userSettings.eventTimeRemaining.forEach(function(timeSetting) {
                        var notificationSeconds = timeSetting.timeMinutes * 60; // This is seconds from the end of the event
                        setTimeout(function() {
                            fn.notification(timeSetting.timeMinutes + ' minute(s) left in the event!', URLS.img.event, timeSetting);
                        }, (secondsUntilEventEnd - notificationSeconds) * 1000);
                    });

                    // End of the event, set the flag back to false
                    setTimeout(function() {
                        isEventCountdownActive = false;
                    }, secondsUntilEventEnd * 1000);
                }
            },
        };

        /** Collection of mutation observers the script uses */
        const OBSERVERS = {
            chat_search: new MutationObserver(
                /** @param {MutationRecord[]} records */
                function (records) {
                    var searchResults = fn.findSearchValuesInRecords(records, userSettings.chatSearch);
                    if (searchResults && searchResults.node) {
                        fn.notification(searchResults.node.textContent, URLS.img.chatSearch, searchResults.searchValue, null, clickToAChannelTab, searchResults.node);
                    }


                    for (var i = 0; i < records.length; i++) {
                        const addedNodes = records[i].addedNodes;
                        if (addedNodes.length) {
                            for (var j = 0; j < addedNodes.length; j++) {
                                const text = $(addedNodes[j]).text();
                                if (!fn.isToAProcessed(addedNodes[j]) && text.match(/^\[[0-9]+:[0-9]+:[0-9]+\]\s*Whisper from/)) {
                                    fn.notification(text, URLS.img.whisper, userSettings.whisper, null, clickToAChannelTab, addedNodes[j]);
                                    break;
                                }
                            }
                        }
                    }

                    for (var i = 0; i < records.length; i++) {
                        const addedNodes = records[i].addedNodes;
                        if (addedNodes.length) {
                            for (var j = 0; j < addedNodes.length; j++) {
                                const text = $(addedNodes[j]).text();
                                if (!fn.isToAProcessed(addedNodes[j]) && text.match(/^\[[0-9]+:[0-9]+:[0-9]+\]\s*The event begins in/)) {
                                    hasQueuedForGauntlet = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            ),
            loot_search: new MutationObserver(
                /** @param {MutationRecord[]} records */
                function (records) {
                    var searchResults = fn.findSearchValuesInRecords(records, userSettings.lootSearch);
                    if (searchResults && searchResults.node) {
                        fn.notification(searchResults.node.textContent, URLS.img.lootSearch, searchResults.searchValue);
                        return;
                    }
                }
            ),
            crafting_search: new MutationObserver(
                /** @param {MutationRecord[]} records */
                function (records) {
                    var searchResults = fn.findSearchValuesInRecords(records, userSettings.craftingSearch);
                    // Weird special case, because the crafting progress bar is full of different divs, but it's very useful to search
                    if (!searchResults) {
                        const craftingXpCountText = $('#craftingXPCount').text();
                        searchResults = fn.findSearchValues(craftingXpCountText, userSettings.craftingSearch);
                    }
                    if (searchResults) {
                        fn.notification(searchResults.node.textContent, URLS.img.craftingSearch, searchResults.searchValue);
                    }
                }
            ),
            lowStamina: new MutationObserver(
                function (records) {
                    for (var i = 0; i < records.length; i++) {
                        const addedNodes = records[i].addedNodes;
                        if (addedNodes.length) {
                            for (var j = 0; j < addedNodes.length; j++) {
                                const text = $(addedNodes[j]).text();
                                if (text === userSettings.lowStaminaThreshold.toString()) {
                                    fn.notification('Your stamina is low!', URLS.img.fatigued, userSettings.fatigue);
                                }
                            }
                        }
                    }
                }
            ),
            event: new MutationObserver(
                function (records) {
                    for (var i = 0; i < records.length; i++) {
                        const addedNodes = records[i].addedNodes;
                        if (addedNodes.length) {
                            for (var j = 0; j < addedNodes.length; j++) {
                                if (!isEventCountdownActive) {
                                    const text = $(addedNodes[j]).text();
                                    fn.setupEventNotifications(text);
                                }
                            }
                        }
                    }
                }
            ),
            bossFailure: new MutationObserver(
                function (records) {
                    if (fn.checkRecordsVisible(records)) {
                        fn.notification('You are fighting while weakened!', URLS.img.weakened, userSettings.eventElimination);
                    }
                }
            ),

        };

        (function () {
            const ON_LOAD = {
                "Initializing settings": function () {
                    GM_addStyle(NOA_STYLES);

                    fn.loadUserSettings();
                },
                "Starting script update monitor": function () {
                    checkForUpdateTimer = setTimeout(fn.checkForUpdate, 10000);
                },
                "Starting chat monitor": function () {
                    OBSERVERS.chat_search.observe(document.querySelector("#chatMessageList"), {
                        childList: true
                    });
                },
                "Starting loot monitor": function() {
                    OBSERVERS.loot_search.observe(document.querySelector("#latestLoot"), {
                        childList: true
                    });
                },
                "Starting crafting monitor": function() {
                    OBSERVERS.crafting_search.observe(document.querySelector('#craftingGainWrapper'), {
                        childList: true,
                        subtree: true
                    });
                },
                "Starting fatigue monitor": function () {
                    setInterval(fn.checkFatigue, 1000);

                    OBSERVERS.lowStamina.observe(document.querySelector('#autosRemaining'), {
                        childList: true
                    });
                },
                "Starting harvestron monitor": function () {
                    setInterval(fn.checkHarvestronVisible, 1000);
                },
                "Starting construction monitor": function () {
                    setInterval(fn.checkConstructionVisible, 1000);
                },
                "Starting quest monitor": function () {
                    setInterval(fn.checkQuestComplete, 1000);
                },
                "Starting event monitor": function () {
                    OBSERVERS.event.observe(document.querySelector("#eventCountdown"), { childList: true });
                },
                "Starting boss failure monitor": function () {
                    const bossFailureNotifications = document.getElementsByClassName('gauntletWeakened');

                    // There should be only one of these
                    if (bossFailureNotifications && bossFailureNotifications.length) {
                        OBSERVERS.bossFailure.observe(bossFailureNotifications[0], { attributes: true });
                    } else {
                        console.log('No boss failure notification divs found!');
                    }
                },
                "Adding HTML elements": function () {
                    const accountSettingsWrapper = $('#accountSettingsWrapper');
                    var settingsLinksWrapper = $('#settingsLinksWrapper');

                    var noaSettingsButton = $('<a id="noaPreferences"><button class="btn btn-primary">NoA</button></a>');
                    var noaSettingsPage = $(SETTINGS_DIALOG_HTML);
                    accountSettingsWrapper.append(noaSettingsPage);

                    Object.defineProperty(Vue.prototype, '$lodash', { value: _ });
                    Vue.component('settings-entry', {
                        props: {
                            setting: Object,
                            name: String,
                            type: {
                                type: String,
                                default: 'normal',
                                validator: function(value) {
                                    return ['normal', 'regex', 'eventTime'].indexOf(value) !== -1;
                                },
                            },
                            collection: Array,
                            index: Number,
                        },
                        methods: {
                            notificationTest: function () {
                                const description = this.name || this.setting.searchText || 'Setting';
                                fn.notification('Testing ' + description + ' notifications', URLS.img.icon, this.setting);
                            },
                            remove: function() {
                                this.$delete(this.collection, this.index);
                            }
                        },
                        template: `
                        <tr>
                            <th scope="row" v-if="type === 'normal'">{{name}}</th>
                            <td v-if="type === 'regex'"><input type="text" v-model="setting.searchText"></td>
                            <td v-if="type === 'eventTime'"><input type="number" v-model="setting.timeMinutes" step="0.5"></td>
                            <td><input type="checkbox" v-model="setting.popup"></td>
                            <td><input type="checkbox" v-model="setting.sound"></td>
                            <td><input type="checkbox" v-model="setting.log"></td>
                            <td><input type="checkbox" v-model="setting.clanDiscord"></td>
                            <td><input type="checkbox" v-model="setting.personalDiscord"></td>
                            <td><input type="checkbox" v-model="setting.recur" v-if="!$lodash.isNil(setting.recur)"></td>
                            <td><input type="text" v-model="setting.popupIcon"></td>
                            <td><input type="text" v-model="setting.soundFile"></td>
                            <td><button class="btn btn-primary btn-xs" style="margin-top: 0px;" v-on:click="notificationTest()">Test</button></td>
                            <td><button class="btn btn-primary btn-xs" style="margin-top: 0px;" v-if="collection" v-on:click="remove()">Remove</button></td>
                        </tr>
                        `
                    });

                    const settingsApp = new Vue({
                        el: '#NoASettingsContentWrapper',
                        data:
                        {
                            userSettings: userSettings,
                            importExportValue: importExportValue,
                        },
                        methods:
                        {
                            addChatSearch: function () {
                                userSettings.chatSearch.push({ popup: true, sound: true, log: true, clanDiscord: false, personalDiscord: false, searchText: '', });
                            },
                            addCraftingSearch: function () {
                                userSettings.craftingSearch.push({ popup: true, sound: true, log: true, clanDiscord: false, personalDiscord: false, searchText: '', });
                            },
                            addLootSearch: function () {
                                userSettings.lootSearch.push({ popup: true, sound: true, log: true, clanDiscord: false, personalDiscord: false, searchText: '', });
                            },
                            addEventTime: function() {
                                userSettings.eventTimeRemaining.push({popup: true, sound: true, log: true, clanDiscord: false, personalDiscord: false, timeMinutes: 1, });
                            },
                            tryImportSettings: function () {
                                try {
                                    const parsed = JSON.parse(this.importExportValue);
                                    // TODO - I'm not sure if both of these need updated
                                    userSettings = parsed;
                                    this.userSettings = parsed;
                                    fn.storeUserSettings();
                                } catch (e) {
                                    console.log('Failed to parse settings import', this.importExportValue);
                                }
                            },
                            displayCurrentSettings: function() {
                                this.importExportValue = JSON.stringify(userSettings);
                            },
                        },
                        watch: {
                            userSettings: {
                                handler: fn.storeUserSettings,
                                deep: true,
                            }
                        }
                    });

                    $('#NoANotificationSettingsButton').click(function () {
                        $('#NoANotificationSettingsButton').addClass('active').siblings().removeClass('active');
                        $('#NoANotificationSettingsWrapper').css('display', 'block').siblings().css('display', 'none');
                    });

                    $('#NoAAdvancedSettingsButton').click(function () {
                        $('#NoAAdvancedSettingsButton').addClass('active').siblings().removeClass('active');
                        $('#NoAAdvancedSettingsWrapper').css('display', 'block').siblings().css('display', 'none');
                    });

                    $('#NoAImportExportButton').click(function () {
                        $('#NoAImportExportButton').addClass('active').siblings().removeClass('active');
                        $('#NoASettingsImportExportWrapper').css('display', 'block').siblings().css('display', 'none');
                    });

                    $('#NoALogButton').click(function () {
                        $('#NoALogButton').addClass('active').siblings().removeClass('active');
                        $('#NoANotificationLog').css('display', 'block').siblings().css('display', 'none');
                        populateNotificationLog();
                    });

                    $('#NoANotificationSettingsButton').click();

                    noaSettingsButton.click(function () {
                        // Remove the active class from all of the buttons in the settings link wrapper, then set the settings button active
                        noaSettingsButton.addClass('active').siblings().removeClass('active');

                        // Hide all the children of the settings wrapper, then display only the settings link wrapper and the NoA settings page
                        accountSettingsWrapper.children().css('display', 'none');
                        settingsLinksWrapper.css('display', 'block');
                        $('#NoASettings').css('display', 'block');
                    });
                    settingsLinksWrapper.append(noaSettingsButton);

                    function hideNoaSettings() {
                        $('#NoASettings').css('display', 'none');
                        $('#notificationLogItems').empty();
                    }

                    noaSettingsButton.siblings().each(function () {
                        $(this).click(hideNoaSettings);
                    });

                    const notificationLogRefreshButton = $('#notificationLogRefresh');
                    const notificationLogItems = $('#notificationLogItems');
                    notificationLogRefreshButton.click(populateNotificationLog);
                    function populateNotificationLog() {
                        notificationLogItems.empty();
                        // iterate backwards - display newest first
                        for (var notificationCounter = notificationLogEntries.length - 1; notificationCounter >= 0; notificationCounter--) {
                            notificationLogItems.append('<li>' + formatLogEntry(notificationLogEntries[notificationCounter]) + '</li>');
                        }
                    }

                    function formatLogEntry(entry) {
                        if (!!/^\[\d\d:\d\d:\d\d\]/.exec(entry.text)) {
                            return entry.text;
                        } else {
                            return '[' +
                                new Date(entry.timestamp).toLocaleTimeString(undefined, { timeZone: 'America/New_York', hour12: false }) +
                                '] ' +
                                entry.text;
                        }
                    }
                },
            };

            const keys = Object.keys(ON_LOAD);
            for (var i = 0; i < keys.length; i++) {
                console.log('[' + GM_info.script.name + ' (' + GM_info.script.version + ')] ' + keys[i]);
                ON_LOAD[keys[i]]();
            }
        })();

    })(jQuery, MutationObserver, buzz);
}
