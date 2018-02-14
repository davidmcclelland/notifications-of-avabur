// ==UserScript==
// @name           Notifications of Avabur
// @namespace      https://github.com/davidmcclelland/
// @author         Dave McClelland <davidmcclelland@gmail.com>
// @homepage       https://github.com/davidmcclelland/notifications-of-avabur
// @supportURL     https://github.com/davidmcclelland/notifications-of-avabur/issues
// @description    Never miss another gauntlet again!
// @match          https://*.avabur.com/game*
// @version        1.6.0
// @icon           https://rawgit.com/davidmcclelland/notifications-of-avabur/master/res/img/logo-32.png
// @run-at         document-end
// @connect        githubusercontent.com
// @connect        github.com
// @connect        self
// @grant          GM_addStyle
// @require        https://rawgit.com/davidmcclelland/notifications-of-avabur/master/lib/toastmessage/javascript/jquery.toastmessage.js
// @require        https://cdnjs.cloudflare.com/ajax/libs/buzz/1.2.0/buzz.min.js
// @require        https://raw.githubusercontent.com/lodash/lodash/4.17.4/dist/lodash.min.js
// @license        LGPL-2.1
// @noframes
// ==/UserScript==

//Check if the user can even support the bot
if (typeof(MutationObserver) === "undefined") {
    console.log("Cannot support mutation observer!");
} else {
    (function($, MutationObserver, buzz) {
        'use strict';

        /**
         * Creates a GitHub CDN URL
         * @param {String} path Path to the file without leading slashes
         * @param {String} [author] The author. Defaults to davidmcclelland
         * @param {String} [repo] The repository. Defaults to notifications-of-avabur
         * @returns {String} The URL
         */
        const gh_url = function(path, author, repo) {
            author = author || "davidmcclelland";
            repo = repo || "notifications-of-avabur";

            // return "https://cdn.rawgit.com/" + author + "/" + repo + "/" +
            //     GM_info.script.version + "/" + path;
            return "https://rawgit.com/" + author + "/" + repo + "/" +
                'master' + "/" + path;
        };

        const URLS = {
            sfx: {
                message_ding: gh_url("res/sfx/message_ding.wav")
            },
            img: {
                icon: gh_url("res/img/logo-32.png")
            }
        };



        /////////////////////////////////////////////////////
        // This is the script code. Don't change it unless //
        // you know what you're doing ;)                   //
        /////////////////////////////////////////////////////

        const DEFAULT_USER_SETTINGS = {
            recurToDiscord: false,
            recurringNotificationsTimeout: 20,
            soundVolume: 80,
            lowStaminaThreshold: 5,
            fatigue: {popup: true, sound: true, log: false, clanDiscord: false, personalDiscord: false, recur: true},
            eventFiveMinuteCountdown: {popup: true, sound: true, log: true, clanDiscord: false, personalDiscord: false},
            eventThirtySecondCountdown: {popup: true, sound: true, log: true, clanDiscord: false, personalDiscord: false},
            eventStarting: {popup: true, sound: true, log: true, clanDiscord: false, personalDiscord: false},
            eventTenMinutesRemaining: {popup: true, sound: true, log: true, clanDiscord: false, personalDiscord: false},
            eventFiveMinutesRemaining: {popup: true, sound: true, log: true, clanDiscord: false, personalDiscord: false},
            eventElimination: {popup: true, sound: true, log: true, clanDiscord: false, personalDiscord: false},
            harvestron: {popup: true, sound: true, log: true, clanDiscord: false, personalDiscord: false, recur: true},
            construction: {popup: true, sound: true, log: true, clanDiscord: false, personalDiscord: false, recur: true},
            whisper: {popup: true, sound: true, log: true, clanDiscord: false, personalDiscord: false},
            questComplete: {popup: true, sound: true, log: true, clanDiscord: false, personalDiscord: false, recur: true},
            chatSearch: {popup: true, sound: true, log: true, clanDiscord: false, personalDiscord: false, searchText: ''},
            lootSearch: {popup: true, sound: true, log: true, clanDiscord: false, personalDiscord: false, searchText: ''},
            craftingSearch: {popup: true, sound: true, log: true, clanDiscord: false, personalDiscord: false, searchText: ''},
            clanDiscord: {webhook: '', target: ''},
            personalDiscord: {webhook: '', target: ''}
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
    </div>
    <div id="NoASettingsContentWrapper">
        <div id="NoANotificationSettingsWrapper">
            <table id="NoASettingsTable" class="table">
                <thead>
                    <tr>
                        <td></td>
                        <th scope="col">Popup</th>
                        <th scope="col">Sound</th>
                        <th scope="col">Log</th>
                        <th scope="col">Clan</th>
                        <th scope="col">Personal</th>
                        <th scope="col">Recur</th>
                        <th scope="col">Sound File URL</th>
                </thead>
                <tbody></tbody>
            </table>
        </div>
        <div id="NoAAdvancedSettingsWrapper">
            <div>
                <h4 class="nobg">General</h4>
                <div class="row">
                    <div class="col-xs-3">
                        <label><input id="recurToDiscordEditor" type="checkbox">Recur to Discord</label>
                    </div><div class="col-xs-3">
                        <label>Recurrence Time (sec)</label>
                        <input id="recurringNotificationsTimeoutEditor" type="number" min="1" max="100">
                    </div><div class="col-xs-3">
                        <label>Sound Volume</label>
                        <input id="soundVolumeEditor"                   type="number" min="1" max="100">
                    </div><div class="col-xs-3">
                        <label>Low Stamina Threshold</label>
                        <input id="lowStaminaThresholdEditor"           type="number" min="0" max="9999">
                    </div>
                </div>
            </div>
            <hr>
            <div>
                <h4 class="nobg">Clan Discord</h4>
                <div class="row">
                    <label class="col-xs-3"><a href="https://discordapp.com/developers/docs/resources/webhook#execute-webhook" target="_blank">Webhook</a></label>
                    <div class="col-xs-9">
                        <input id="clanDiscordWebhookEditor" type="text" style="width: 80%;">
                    </div>
                </div>
                <div class="row">
                    <label class="col-xs-3">User/Group</label>
                    <div class="col-xs-9">
                        <input id="clanDiscordTargetEditor" type="text" style="width: 80%;">
                    </div>
                </div>
            </div>
            <hr>
            <div>
                <h4 class="nobg">Personal Discord</h4>
                <div class="row">
                    <label class="col-xs-3"><a href="https://discordapp.com/developers/docs/resources/webhook#execute-webhook" target="_blank">Webhook</a></label>
                    <div class="col-xs-9">
                        <input id="personalDiscordWebhookEditor" type="text" style="width: 80%;">
                    </div>
                </div>
                <div class="row">
                    <label class="col-xs-3">User/Group</label>
                    <div class="col-xs-9">
                        <input id="personalDiscordTargetEditor" type="text" style="width: 80%;">
                    </div>
                </div>
            </div>
            <hr>
            <div>
                <h4 class="nobg">Chat Search Text (<a href="https://github.com/davidmcclelland/notifications-of-avabur/wiki/Chat-search" target="_blank">Help</a>)</h4>
                <div class="row">
                    <div class="col-xs-12">
                        <textarea id="chatSearchTextEditor"></textarea>
                    </div>
                </div>
            </div>
            <hr>
            <div>
                <h4 class="nobg">Loot Search Text (<a href="https://github.com/davidmcclelland/notifications-of-avabur/wiki/Loot-search" target="_blank">Help</a>)</h4>
                <div class="row">
                    <div class="col-xs-12">
                        <textarea id="lootSearchTextEditor"></textarea>
                    </div>
                </div>
            </div>
            <hr>
            <div>
                <h4 class="nobg">Crafting Search Text (<a href="https://github.com/davidmcclelland/notifications-of-avabur/wiki/Crafting-search" target="_blank">Help</a>)</h4>
                <div class="row">
                    <div class="col-xs-12">
                        <textarea id="craftingSearchTextEditor"></textarea>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="row" style="display: none;" id="NoaSettingsSavedLabel">
        <strong class="col-xs-12">
            Settings have been saved
        </strong>
    </div>
</div>
        `;

        var userSettings = null;

        var isEventCountdownActive = false;

        var counters = {
            lastConstructionNotification: 0,
            lastFatigueNotification: 0,
            lastHarvestronNotification: 0,
            lastQuestNotification: 0,
        };


        var notificationLogEntries = [];

        if (!String.format) {
          String.format = function(format) {
            var args = Array.prototype.slice.call(arguments, 1);
            return format.replace(/{(\d+)}/g, function(match, number) { 
              return typeof args[number] != 'undefined' ? args[number] : match;
            });
          };
        }

        /** Misc function container */
        const fn = {
            sendDiscordMessage: function(webhook, target, text) {
                if (webhook && target && text) {
                    const messageContent = target + ' ' + text;
                    $.post(webhook, {content: messageContent});
                }
            },
            /**
             * Creates a floaty notification and plays a sound, based on preferences
             * @param {String} text Text to display
             * @param {object} settings Settings for this type of notification
             * @param {number} recurrenceCounter The number of seconds this event has recurred for. Optional, defaults to zero
             */
            notification: function(text, settings, recurrenceCounter) {
                recurrenceCounter = _.defaultTo(recurrenceCounter, 0);

                const isFirstRecurrence = (recurrenceCounter === 0);

                const recurrenceEnabled = _.defaultTo(settings.recur, false);
                const discordRecurrenceEnabled = _.defaultTo(settings.recurToDiscord);
                // It's a good recurrence if it is the first one, or if recurring notifications are on
                // and it's been long enough since the previous
                var isGoodRecurrence = isFirstRecurrence ||
                    (recurrenceEnabled && (recurrenceCounter % userSettings.recurringNotificationsTimeout === 0));

                // Only ever send to discord and log the first instance of a recurrence,j
                // even if it's a good recurrence
                // Only ever log on the first recurrence.
                const doLog = settings.log && isFirstRecurrence;

                // Only send to discord if discord is enabled and (it's the first recurrence or (it's a good recurrence and recur to discord is enabled))
                const doClanDiscord = settings.clanDiscord && (isFirstRecurrence || (isGoodRecurrence && discordRecurrenceEnabled));
                const doPersonalDiscord = settings.personalDiscord && (isFirstRecurrence || (isGoodRecurrence && discordRecurrenceEnabled));

                // Recur popup and sound notifications
                const doPopup = settings.popup && isGoodRecurrence;
                const doSound = settings.sound && isGoodRecurrence;

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
                    Notification.requestPermission().then(function() {
                        var n = new Notification(GM_info.script.name,  {
                            icon: URLS.img.icon,
                            body: text
                        });
                        setTimeout(n.close.bind(n), 5000);
                        n.addEventListener('click', function(e) {
                            window.focus();
                            e.target.close();
                        }, false);
                    });
                }

                if (doSound) {

                    var soundFileUrl = settings.soundFile;
                    if (!soundFileUrl || !soundFileUrl.length) {
                        soundFileUrl = URLS.sfx.message_ding;
                    }
                    const buzzFile = new buzz.sound(soundFileUrl, {volume: userSettings.soundVolume});
                    buzzFile.play();
                }

                if (doClanDiscord) {
                    fn.sendDiscordMessage(userSettings.clanDiscord.webhook, userSettings.clanDiscord.target, text);
                }

                if (doPersonalDiscord) {
                    fn.sendDiscordMessage(userSettings.personalDiscord.webhook, userSettings.personalDiscord.target, text);
                }
            },
            displaySettingsSavedLabel: function() {
                const label = document.getElementById('NoaSettingsSavedLabel');
                if (label && label.style) {
                    label.style.display = 'block';
                }
            },
            debouncedHideSettingsSavedLabel: _.debounce(function() {
                const label = document.getElementById('NoaSettingsSavedLabel');
                if (label && label.style) {
                    label.style.display = 'none';
                }
            }, 3000),
            loadUserSettings: function() {
                var loadedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY));
                userSettings = _.defaultsDeep(loadedSettings, DEFAULT_USER_SETTINGS);

                // Save settings to store any defaulted settings
                fn.storeUserSettings();
            },
            storeUserSettings: function() {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(userSettings));

                fn.displaySettingsSavedLabel();
                fn.debouncedHideSettingsSavedLabel();
            },
            populateSingleNotificationEditor: function(editorPrefix, notificationSettings) {
                $('#' + editorPrefix + 'PopupEditor')[0].checked = notificationSettings.popup;
                $('#' + editorPrefix + 'SoundEditor')[0].checked = notificationSettings.sound;
                $('#' + editorPrefix + 'LogEditor')[0].checked = notificationSettings.log;
                $('#' + editorPrefix + 'ClanDiscordEditor')[0].checked = notificationSettings.clanDiscord;
                $('#' + editorPrefix + 'PersonalDiscordEditor')[0].checked = notificationSettings.personalDiscord;
                $('#' + editorPrefix + 'SoundFileEditor').val(notificationSettings.soundFile);

                if(notificationSettings.hasOwnProperty('recur')) {
                    $('#' + editorPrefix + 'RecurEditor')[0].checked = notificationSettings.recur;
                }
            },
            populateSettingsEditor: function() {
                $('#recurToDiscordEditor')[0].checked = userSettings.recurToDiscord;
                $('#recurringNotificationsTimeoutEditor').val(userSettings.recurringNotificationsTimeout);
                $('#soundVolumeEditor').val(userSettings.soundVolume);
                $('#lowStaminaThresholdEditor').val(userSettings.lowStaminaThreshold);
                $('#clanDiscordWebhookEditor').val(userSettings.clanDiscord.webhook);
                $('#clanDiscordTargetEditor').val(userSettings.clanDiscord.target);
                $('#personalDiscordWebhookEditor').val(userSettings.personalDiscord.webhook);
                $('#personalDiscordTargetEditor').val(userSettings.personalDiscord.target);
                $('#chatSearchTextEditor').val(userSettings.chatSearch.searchText);
                $('#lootSearchTextEditor').val(userSettings.lootSearch.searchText);
                $('#craftingSearchTextEditor').val(userSettings.craftingSearch.searchText);

                fn.populateSingleNotificationEditor('fatigue', userSettings.fatigue);
                fn.populateSingleNotificationEditor('eventFiveMinuteCountdown', userSettings.eventFiveMinuteCountdown);
                fn.populateSingleNotificationEditor('eventThirtySecondCountdown', userSettings.eventThirtySecondCountdown);
                fn.populateSingleNotificationEditor('eventStarting', userSettings.eventStarting);
                fn.populateSingleNotificationEditor('eventTenMinutesRemaining', userSettings.eventTenMinutesRemaining);
                fn.populateSingleNotificationEditor('eventFiveMinutesRemaining', userSettings.eventFiveMinutesRemaining);
                fn.populateSingleNotificationEditor('eventElimination', userSettings.eventElimination);
                fn.populateSingleNotificationEditor('harvestron', userSettings.harvestron);
                fn.populateSingleNotificationEditor('construction', userSettings.construction);
                fn.populateSingleNotificationEditor('whisper', userSettings.whisper);
                fn.populateSingleNotificationEditor('questComplete', userSettings.questComplete);
                fn.populateSingleNotificationEditor('chatSearch', userSettings.chatSearch);
                fn.populateSingleNotificationEditor('lootSearch', userSettings.lootSearch);
                fn.populateSingleNotificationEditor('craftingSearch', userSettings.craftingSearch);
            },
            saveSingleNotificationEditor: function(editorPrefix, notificationSettings) {
                notificationSettings.popup = $('#' + editorPrefix + 'PopupEditor')[0].checked;
                notificationSettings.sound = $('#' + editorPrefix + 'SoundEditor')[0].checked;
                notificationSettings.log = $('#' + editorPrefix + 'LogEditor')[0].checked;
                notificationSettings.clanDiscord = $('#' + editorPrefix + 'ClanDiscordEditor')[0].checked;
                notificationSettings.personalDiscord = $('#' + editorPrefix + 'PersonalDiscordEditor')[0].checked;
                notificationSettings.soundFile = $('#' + editorPrefix + 'SoundFileEditor').val();

                if(notificationSettings.hasOwnProperty('recur')) {
                    notificationSettings.recur = $('#' + editorPrefix + 'RecurEditor')[0].checked;
                }
            },
            saveSettingsEditor: function() {
                userSettings.recurToDiscord = $('#recurToDiscordEditor')[0].checked;
                userSettings.recurringNotificationsTimeout = parseInt($('#recurringNotificationsTimeoutEditor').val(), 10);
                userSettings.soundVolume = parseInt($('#soundVolumeEditor').val(), 10);
                userSettings.lowStaminaThreshold = parseInt($('#lowStaminaThresholdEditor').val(), 10);
                userSettings.clanDiscord.webhook = $('#clanDiscordWebhookEditor').val();
                userSettings.clanDiscord.target = $('#clanDiscordTargetEditor').val();
                userSettings.personalDiscord.webhook = $('#personalDiscordWebhookEditor').val();
                userSettings.personalDiscord.target = $('#personalDiscordTargetEditor').val();
                userSettings.chatSearch.searchText = $('#chatSearchTextEditor').val();
                userSettings.lootSearch.searchText = $('#lootSearchTextEditor').val();
                userSettings.craftingSearch.searchText = $('#craftingSearchTextEditor').val();

                fn.saveSingleNotificationEditor('fatigue', userSettings.fatigue);
                fn.saveSingleNotificationEditor('eventFiveMinuteCountdown', userSettings.eventFiveMinuteCountdown);
                fn.saveSingleNotificationEditor('eventThirtySecondCountdown', userSettings.eventThirtySecondCountdown);
                fn.saveSingleNotificationEditor('eventStarting', userSettings.eventStarting);
                fn.saveSingleNotificationEditor('eventTenMinutesRemaining', userSettings.eventTenMinutesRemaining);
                fn.saveSingleNotificationEditor('eventFiveMinutesRemaining', userSettings.eventFiveMinutesRemaining);
                fn.saveSingleNotificationEditor('eventElimination', userSettings.eventElimination);
                fn.saveSingleNotificationEditor('harvestron', userSettings.harvestron);
                fn.saveSingleNotificationEditor('construction', userSettings.construction);
                fn.saveSingleNotificationEditor('whisper', userSettings.whisper);
                fn.saveSingleNotificationEditor('questComplete', userSettings.questComplete);
                fn.saveSingleNotificationEditor('chatSearch', userSettings.chatSearch);
                fn.saveSingleNotificationEditor('lootSearch', userSettings.lootSearch);
                fn.saveSingleNotificationEditor('craftingSearch', userSettings.craftingSearch);

                fn.storeUserSettings();
            },
            checkConstructionVisible: function() {
                var div = document.getElementById('constructionNotifier');
                if (div && (div.style.display !== 'none')) {
                    fn.notification('Construction available!', userSettings.construction, counters.lastConstructionNotification);
                    counters.lastConstructionNotification++;
                } else {
                    counters.lastConstructionNotification = 0;
                }
            },
            checkFatigue: function() {
                const autosRemainingSpans = document.getElementsByClassName('autosRemaining');

                /* There is one of these spans in each of the main wrappers (battle, tradeskill, crafting, carving).
                It seems like all of them are currently updated with the same "autosRemaining" value each action,
                so there's no need to watch all of them. */
                if (autosRemainingSpans && autosRemainingSpans.length) {
                    const searchSpan = autosRemainingSpans[0];
                    const staminaRemainingText = searchSpan.innerText || searchSpan.textContent;
                    const staminaRemainingNumber = parseInt(staminaRemainingText, 10);
                    if (staminaRemainingNumber <= 0) {
                        fn.notification('You are fatigued!', userSettings.fatigue, counters.lastFatigueNotification);
                        counters.lastFatigueNotification++;
                    } else {
                        counters.lastFatigueNotification = 0;
                    }
                }
            },
            checkHarvestronVisible: function() {
                var div = document.getElementById('harvestronNotifier');
                if (div && (div.style.display !== 'none')) {
                    fn.notification('Harvestron available!', userSettings.harvestron, counters.lastHarvestronNotification);
                    counters.lastHarvestronNotification++;
                } else {
                    counters.lastHarvestronNotification = 0;
                }
            },
            checkQuestComplete: function() {
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

                if (visibleQuestDivId && ($('#' + visibleQuestDivId).text().startsWith('You have completed your quest!'))) {
                    fn.notification('Quest complete!', userSettings.questComplete, counters.lastQuestNotification);
                    counters.lastQuestNotification++;
                } else {
                    counters.lastQuestNotification = 0;
                }
            },
            checkRecordsVisible: function(records) {
                for (var i = 0; i < records.length; i++) {
                    const target = $(records[i].target);
                    var style = window.getComputedStyle(target.context);
                    if (style.display !== 'none') {
                        return true;
                    }
                }
                return false;
            },
            findSearchValues: function(text, searchValues) {
                // Look for any values listed under the given key
                var searchValuesSplit = searchValues.split(/\r?\n/);
                for (var k = 0; k < searchValuesSplit.length; k++) {
                    if (searchValuesSplit[k].length && text.match(new RegExp(searchValuesSplit[k], 'i'))) {
                        return true;
                    }
                }
            },
            findSearchValuesInRecords: function(records, searchValues) {
                for (var i = 0; i < records.length; i++) {
                    const addedNodes = records[i].addedNodes;
                    if (addedNodes.length) {
                        for (var j = 0; j < addedNodes.length; j++) {
                            const text = $(addedNodes[j]).text();
                            if (fn.findSearchValues(text, searchValues)) {
                                return text;
                            }
                        }
                    }
                }
                return false;
            },
            checkEventParticipation: function() {
                return document.querySelector('#bossWrapper').style.display !== 'none';
            },
            setupEventNotifications: function(countdownBadgeText) {
                if (!isEventCountdownActive) {
                    if (countdownBadgeText === '!') {
                        return;
                    }

                    isEventCountdownActive = true;
                    // First thing's first, figure out how long until the event (in seconds)
                    /* We handle this a bit odd - if the countdown string doesn't list 'm', then it is displaying
                    only seconds. This currently only happens on beta when testing events, but NoA shouldn't break on beta.
                    This could be slightly more elegantly solved with indexof, but I already wrote it this way and it works. */
                    var minutesString = '0';
                    var secondsString = '0';
                    if (countdownBadgeText.includes('m')) {
                        minutesString = countdownBadgeText.slice(0, 2);
                        secondsString = countdownBadgeText.slice(3, 5);
                    } else {
                        secondsString = countdownBadgeText.slice(0, 2);
                    }
                    var secondsUntilEventStart = (parseInt(minutesString, 10) * 60) + parseInt(secondsString, 10);

                    fn.notification('An event is starting in five minutes!', userSettings.eventFiveMinuteCountdown);

                    // 30 second warning
                    setTimeout(function() {
                        fn.notification('An event is starting in thirty seconds!', userSettings.eventThirtySecondCountdown);
                    }, (secondsUntilEventStart - 30) * 1000);

                    // 1 second warning
                    setTimeout(function() {
                        fn.notification('An event is starting!', userSettings.eventStarting);
                    }, (secondsUntilEventStart - 1) * 1000);

                    // 10 minutes remaining
                    setTimeout(function() {
                        if (!fn.checkEventParticipation()) {
                            fn.notification('Ten minutes remaining in the event!', userSettings.eventTenMinutesRemaining);
                        }
                    }, (secondsUntilEventStart + (60 * 5)) * 1000);

                    // 5 minutes remaining
                    setTimeout(function() {
                        if (!fn.checkEventParticipation()) {
                            fn.notification('Five minutes remaining in the event!', userSettings.eventFiveMinutesRemaining);
                        }
                    }, (secondsUntilEventStart + (60 * 10)) * 1000);

                    // End of the event
                    setTimeout(function() {
                        isEventCountdownActive = false;
                    }, (secondsUntilEventStart + (60 * 15)) * 1000);
                }
            },            
        };

        /** Collection of mutation observers the script uses */
        const OBSERVERS = {
            chat_search: new MutationObserver(
                /** @param {MutationRecord[]} records */
                function(records) {
                    var text = fn.findSearchValuesInRecords(records, userSettings.chatSearch.searchText);
                    if (text) {
                        fn.notification(text, userSettings.chatSearch);
                        return;
                    }

                    for (var i = 0; i < records.length; i++) {
                        const addedNodes = records[i].addedNodes;
                        if (addedNodes.length) {
                            for (var j = 0; j < addedNodes.length; j++) {
                                const text = $(addedNodes[j]).text();
                                if (text.match(/^\[[0-9]+:[0-9]+:[0-9]+]\s*Whisper from/)) {
                                    fn.notification(text, userSettings.whisper);
                                    return;
                                }
                            }
                        }
                    }
                }
            ),
            loot_search: new MutationObserver(
                /** @param {MutationRecord[]} records */
                function(records) {
                    var text = fn.findSearchValuesInRecords(records, userSettings.lootSearch.searchText);
                    if (text) {
                        fn.notification(text, userSettings.lootSearch);
                        return;
                    }
                }
            ),
            crafting_search: new MutationObserver(
                /** @param {MutationRecord[]} records */
                function(records) {
                    var text = fn.findSearchValuesInRecords(records, userSettings.craftingSearch.searchText);
                    // Weird special case, because the crafting progress bar is full of different divs, but it's very useful to search
                    if (!text) {
                        const craftingXpCountText = $('#craftingXPCount').text();
                        if (fn.findSearchValues(craftingXpCountText, userSettings.craftingSearch.searchText)) {
                            text = craftingXpCountText;
                        }
                    }
                    if (text) {
                        fn.notification(text, userSettings.craftingSearch);
                    }
                }
            ),
            lowStamina: new MutationObserver(
                function(records) {
                    for (var i = 0; i < records.length; i++) {
                        const addedNodes = records[i].addedNodes;
                        if (addedNodes.length) {
                            for (var j = 0; j < addedNodes.length; j++) {
                                const text = $(addedNodes[j]).text();
                                if (text === userSettings.lowStaminaThreshold.toString()) {
                                    fn.notification('Your stamina is low!', userSettings.fatigue);
                                }
                            }
                        }
                    }
                }
            ),
            event: new MutationObserver(
                function(records) {
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
                function(records) {
                    if (fn.checkRecordsVisible(records)) {
                        fn.notification('You were eliminated from the gauntlet!', userSettings.eventElimination);
                    }
                }
            ),

        };

        (function() {
            const ON_LOAD = {
                "Initializing settings": function() {
                    GM_addStyle(NOA_STYLES);

                    fn.loadUserSettings();
                },
                "Starting chat monitor": function() {
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
                "Starting fatigue monitor": function() {
                    setInterval(fn.checkFatigue, 1000);

                    const autosRemainingSpans = document.getElementsByClassName('autosRemaining');

                    /* There is one of these spans in each of the main wrappers (battle, tradeskill, crafting, carving).
                    It seems like all of them are currently updated with the same "autosRemaining" value each action,
                    so there's no need to watch all of them. */
                    if (autosRemainingSpans && autosRemainingSpans.length) {
                        OBSERVERS.lowStamina.observe(autosRemainingSpans[0], {
                            childList: true
                        });
                    }
                },
                "Starting harvestron monitor": function() {
                    setInterval(fn.checkHarvestronVisible, 1000);
                },
                "Starting construction monitor": function() {
                    setInterval(fn.checkConstructionVisible, 1000);
                },
                "Starting quest monitor": function() {
                    setInterval(fn.checkQuestComplete, 1000);
                },
                "Starting event monitor": function() {
                    OBSERVERS.event.observe(document.querySelector("#eventCountdown"), { childList: true });
                },
                "Starting boss failure monitor": function() {
                    const bossFailureNotifications = document.getElementsByClassName('boss_failure_notification');

                    // There should be only one of these
                    if (bossFailureNotifications && bossFailureNotifications.length) {
                        OBSERVERS.bossFailure.observe(bossFailureNotifications[0], { attributes: true });
                    }
                },
                "Adding HTML elements": function() {
                    const accountSettingsWrapper = $('#accountSettingsWrapper');
                    var settingsLinksWrapper = $('#settingsLinksWrapper');

                    var noaSettingsButton = $('<a id="noaPreferences"><button class="btn btn-primary">NoA Settings</button></a>');
                    var noaSettingsPage = $(SETTINGS_DIALOG_HTML);
                    accountSettingsWrapper.append(noaSettingsPage);

                    function appendSettingsRow(title, prefix, canRecur) {
                        const recurrenceEditor = canRecur ? '<input id="{1}RecurEditor" type="checkbox">' : '';
                        const rowTemplate = `
                        <tr>
                            <th scope="row">{0}</th>
                            <td><input id="{1}PopupEditor" type="checkbox"></td>
                            <td><input id="{1}SoundEditor" type="checkbox"></td>
                            <td><input id="{1}LogEditor" type="checkbox"></td>
                            <td><input id="{1}ClanDiscordEditor" type="checkbox"></td>
                            <td><input id="{1}PersonalDiscordEditor" type="checkbox"></td>
                            <td>{2}</td>
                            <td><input id="{1}SoundFileEditor" type="text" placeholder="Default"></td>
                        </tr>`;

                        // This is a bit confusing - we're doing a double replace, so this needs called twice.
                        const firstFormat = String.format(rowTemplate, title, prefix, recurrenceEditor);
                        const rowToAdd = String.format(firstFormat, title, prefix, recurrenceEditor);
                        $('#NoASettingsTable tbody').append(rowToAdd);
                    }
                    appendSettingsRow('Fatigue', 'fatigue', true);
                    appendSettingsRow('Harvestron', 'harvestron', true);
                    appendSettingsRow('Construction', 'construction', true);
                    appendSettingsRow('Quest Complete', 'questComplete', true);
                    appendSettingsRow('Whisper', 'whisper', false);
                    appendSettingsRow('Chat Search', 'chatSearch', false);
                    appendSettingsRow('Loot Search', 'lootSearch', false);
                    appendSettingsRow('Crafting Search', 'craftingSearch', false);
                    appendSettingsRow('Event 5 Minute Countdown', 'eventFiveMinuteCountdown', false);
                    appendSettingsRow('Event 30 Second Countdown', 'eventThirtySecondCountdown', false);
                    appendSettingsRow('Event Starting', 'eventStarting', false);
                    appendSettingsRow('Event 10 Minutes Remaining', 'eventTenMinutesRemaining', false);
                    appendSettingsRow('Event 5 Minutes Remaining', 'eventFiveMinutesRemaining', false);
                    appendSettingsRow('Event Elimination', 'eventElimination', false);

                    $('#NoANotificationSettingsButton').click(function() {
                        $('#NoANotificationSettingsButton').addClass('active').siblings().removeClass('active');
                        $('#NoANotificationSettingsWrapper').css('display', 'block').siblings().css('display', 'none');
                    });

                    $('#NoAAdvancedSettingsButton').click(function() {
                        $('#NoAAdvancedSettingsButton').addClass('active').siblings().removeClass('active');
                        $('#NoAAdvancedSettingsWrapper').css('display', 'block').siblings().css('display', 'none');
                    });

                    $('#NoANotificationSettingsButton').click();

                    $('#NoASettings input').change(fn.saveSettingsEditor);
                    $('#NoASettings textarea').change(fn.saveSettingsEditor);
                    noaSettingsButton.click(function() {
                        // Remove the active class from all of the buttons in the settings link wrapper, then set the settings button active
                        noaSettingsButton.addClass('active').siblings().removeClass('active');

                        // Hide all the children of the settings wrapper, then display only the settings link wrapper and the NoA settings page
                        accountSettingsWrapper.children().css('display', 'none');
                        settingsLinksWrapper.css('display', 'block');
                        noaSettingsPage.css('display', 'block');

                        // Load current settings into the dialog
                        fn.populateSettingsEditor();
                    });
                    settingsLinksWrapper.append(noaSettingsButton);

                    const notificationLogButton = $('<a id="NoALogButton"><button class="btn btn-primary">NoA Log</button></a>');
                    settingsLinksWrapper.append(notificationLogButton);

                    function hideNoaSettings() {
                        noaSettingsPage.css('display', 'none');
                    }

                    noaSettingsButton.siblings().each(function() {
                        $(this).click(hideNoaSettings);
                    });

                    const notificationLog = $('<div id="NoANotificationLog"><button class="btn btn-primary" id="notificationLogRefresh">Refresh</button><ul id="notificationLogItems"></ul></div>');

                    accountSettingsWrapper.append(notificationLog);
                    const notificationLogRefreshButton = $('#notificationLogRefresh');
                    const notificationLogItems = $('#notificationLogItems');

                    notificationLogRefreshButton.click(populateNotificationLog);

                    notificationLogButton.click(function() {
                        // Remove the active class from all of the buttons in the settings link wrapper, then set the notification log button active
                        settingsLinksWrapper.children('.active').removeClass('active');
                        notificationLogButton.addClass('active');

                        // Hide all the children of the settings wrapper, then display only the settings link wraper and the notification log
                        accountSettingsWrapper.children().css('display', 'none');
                        settingsLinksWrapper.css('display', 'block');
                        notificationLog.css('display', 'block');

                        populateNotificationLog();
                    });

                    // When hiding the notfication log (from clicking any other button), remove all the list items
                    function hideNotificationLog() {
                        notificationLogItems.empty();
                        notificationLog.css('display', 'none');
                    }

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
                                new Date(entry.timestamp).toLocaleTimeString(undefined,{timeZone: 'America/New_York', hour12: false}) +
                                '] ' +
                                entry.text;
                        }
                    }

                    notificationLogButton.siblings().each(function() {
                        $(this).click(hideNotificationLog);
                    });
                },
            };

            const keys = Object.keys(ON_LOAD);
            for (var i = 0; i < keys.length; i++) {
                console.log('[' + GM_info.script.name + '] ' + keys[i]);
                ON_LOAD[keys[i]]();
            }
        })();

    })(jQuery, MutationObserver, buzz);
}