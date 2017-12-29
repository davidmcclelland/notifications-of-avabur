// ==UserScript==
// @name           Notifications of Avabur
// @namespace      https://github.com/davidmcclelland/
// @author         Dave McClelland <davidmcclelland@gmail.com>
// @homepage       https://github.com/davidmcclelland/notifications-of-avabur
// @supportURL     https://github.com/davidmcclelland/notifications-of-avabur/issues
// @description    Never miss another gauntlet again!
// @match          https://*.avabur.com/game*
// @version        1.4.1
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

const Toast = { //Tampermonkey's scoping won't let this constant be globally visible
    error: function(msg) {
        console.error(msg);
        $().toastmessage('showErrorToast', msg);
    },
    notice: function(msg) {
        $().toastmessage('showNoticeToast', msg);
    },
    success: function(msg) {
        $().toastmessage('showSuccessToast', msg);
    },
    warn: function(msg) {
        console.warn(msg);
        $().toastmessage('showWarningToast', msg);
    },
    incompatibility: function(what) {
        $().toastmessage('showToast', {
            text: "Your browser does not support " + what +
                ". Please <a href='https://www.google.co.uk/chrome/browser/desktop/' target='_blank'>" +
                "Download the latest version of Google Chrome</a>",
            sticky: true,
            position: 'top-center',
            type: 'error'
        });
    }
};

//Check if the user can even support the bot
if (typeof(MutationObserver) === "undefined") {
    log.error("Cannot support mutation observer!");
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
            recurringNotifications: true,
            recurringNotificationsTimeout: 20,
            soundVolume: 80,
            fatigue: {popup: true, sound: true, log: false},
            event: {popup: true, sound: true, log: true, discordWebhook: '', discordMessage: ''},
            harvestron: {popup: true, sound: true, log: true},
            construction: {popup: true, sound: true, log: true},
            whisper: {popup: true, sound: true, log: true},
            questComplete: {popup: true, sound: true, log: true},
            chatSearch: {popup: true, sound: true, log: true, searchText: ''},
            lootSearch: {popup: true, sound: true, log: true, searchText: ''},
            craftingSearch: {popup: true, sound: true, log: true, searchText: ''}
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
    <div>
        <div class="row">
            <h4 class="col-xs-12 nobg">General</h4>
        </div><div class="row">
            <div class="col-xs-4">
                <label><input id="recurringNotificationsEditor" type="checkbox">Recurring Notifications</label>
            </div><div class="col-xs-4">
                <label>Recurrence Time (sec)</label>
                <input id="recurringNotificationsTimeoutEditor" type="number" min="1" max="100">
            </div><div class="col-xs-4">
                <label>Sound Volume</label>
                <input id="soundVolumeEditor"                   type="number" min="1" max="100">
            </div>
        </div>
    </div>
    <hr>
    <div>
        <div class="row">
            <h4 class="col-xs-12 nobg">Fatigue</h4>
        </div><div class="row">
            <div class="col-xs-4">
                <label><input id="fatiguePopupEditor"           type="checkbox">Popup</label>
            </div><div class="col-xs-4">
                <label><input id="fatigueSoundEditor"           type="checkbox">Sound</label>
            </div><div class="col-xs-4">
                <label><input id="fatigueLogEditor"             type="checkbox">Log</label>
            </div>
        </div>
    </div>
    <hr>
    <div>
        <div class="row">
            <h4 class="col-xs-12 nobg">Harvestron</h4>
        </div><div class="row">
            <div class="col-xs-4">
                <label><input id="harvestronPopupEditor"        type="checkbox">Popup</label>
            </div><div class="col-xs-4">
                <label><input id="harvestronSoundEditor"        type="checkbox">Sound</label>
            </div><div class="col-xs-4">
                <label><input id="harvestronLogEditor"          type="checkbox">Log</label>
            </div>
        </div>
    </div>
    <hr>
    <div>
        <div class="row">
            <h4 class="col-xs-12 nobg">Construction</h4>
        </div><div class="row">
            <div class="col-xs-4">
                <label><input id="constructionPopupEditor"      type="checkbox">Popup</label>
            </div><div class="col-xs-4">
                <label><input id="constructionSoundEditor"      type="checkbox">Sound</label>
            </div><div class="col-xs-4">
                <label><input id="constructionLogEditor"        type="checkbox">Log</label>
            </div>
        </div>
    </div>
    <hr>
    <div>
        <div class="row">
            <h4 class="col-xs-12 nobg">Whisper</h4>
        </div><div class="row">
            <div class="col-xs-4">
                <label><input id="whisperPopupEditor"           type="checkbox">Popup</label>
            </div><div class="col-xs-4">
                <label><input id="whisperSoundEditor"           type="checkbox">Sound</label>
            </div><div class="col-xs-4">
                <label><input id="whisperLogEditor"             type="checkbox">Log</label>
            </div>
        </div>
    </div>
    <hr>
    <div>
        <div class="row">
            <h4 class="col-xs-12 nobg">Quest Complete</h4>
        </div><div class="row">
            <div class="col-xs-4">
                <label><input id="questCompletePopupEditor"     type="checkbox">Popup</label>
            </div><div class="col-xs-4">
                <label><input id="questCompleteSoundEditor"     type="checkbox">Sound</label>
            </div><div class="col-xs-4">
                <label><input id="questCompleteLogEditor"       type="checkbox">Log</label>
            </div>
        </div>
    </div>
    <hr>
    <div>
        <div class="row">
            <h4 class="col-xs-12 nobg">Events</h4>
        </div><div class="row">
            <div class="col-xs-4">
                <label><input id="eventPopupEditor"             type="checkbox">Popup</label>
            </div><div class="col-xs-4">
                <label><input id="eventSoundEditor"             type="checkbox">Sound</label>
            </div><div class="col-xs-4">
                <label><input id="eventLogEditor"               type="checkbox">Log</label>
            </div>
        </div><div class="row">
            <div class="col-xs-3">
                <label>Event <a href="https://discordapp.com/developers/docs/resources/webhook#execute-webhook" target="_blank">Discord Webhook</a></label>
            </div><div class="col-xs-9">
                <input id="eventDiscordWebhookEditor"           type="text" style="width: 80%;">
            </div>
        </div><div class="row">
            <div class="col-xs-3">
                <label>Event Discord Message</label>
            </div><div class="col-xs-9">
                <input id="eventDiscordMessageEditor"           type="text" style="width: 80%;">
            </div>
        </div>
    </div>
    <hr>
    <div>
        <div class="row">
            <h4 class="col-xs-12 nobg">Chat Search</h4>
        </div><div class="row">
            <div class="col-xs-4">
                <label><input id="chatSearchPopupEditor"        type="checkbox">Popup</label>
            </div><div class="col-xs-4">
                <label><input id="chatSearchSoundEditor"        type="checkbox">Sound</label>
            </div><div class="col-xs-4">
                <label><input id="chatSearchLogEditor"          type="checkbox">Log</label>
            </div>
        </div><div class="row">
            <div class="col-xs-12">
                <label>Chat search text (<a href="https://github.com/davidmcclelland/notifications-of-avabur/wiki/Chat-search" target="_blank">Help</a>)</label>
            </div>
        </div><div class="row">
            <div class="col-xs-12">
                <textarea id="chatSearchTextEditor"></textarea>
            </div>
        </div>
    </div>
    <hr>
    <div>
        <div class="row">
            <h4 class="col-xs-12 nobg">Loot Search</h4>
        </div><div class="row">
            <div class="col-xs-4">
                <label><input id="lootSearchPopupEditor"        type="checkbox">Popup</label>
            </div><div class="col-xs-4">
                <label><input id="lootSearchSoundEditor"        type="checkbox">Sound</label>
            </div><div class="col-xs-4">
                <label><input id="lootSearchLogEditor"          type="checkbox">Log</label>
            </div>
        </div><div class="row">
            <div class="col-xs-12">
                <label>Loot search text (<a href="https://github.com/davidmcclelland/notifications-of-avabur/wiki/Loot-search" target="_blank">Help</a>)</label>
            </div>
        </div><div class="row">
            <div class="col-xs-12">
                <textarea id="lootSearchTextEditor"></textarea>
            </div>
        </div>
    </div>
    <hr>
    <div>
        <div class="row">
            <h4 class="col-xs-12 nobg">Crafting Search</h4>
        </div><div class="row">
            <div class="col-xs-4">
                <label><input id="craftingSearchPopupEditor"    type="checkbox">Popup</label>
            </div><div class="col-xs-4">
                <label><input id="craftingSearchSoundEditor"    type="checkbox">Sound</label>
            </div><div class="col-xs-4">
                <label><input id="craftingSearchLogEditor"      type="checkbox">Log</label>
            </div>
        </div><div class="row">
            <div class="col-xs-12">
                <label>Crafting search text (<a href="https://github.com/davidmcclelland/notifications-of-avabur/wiki/Crafting-search" target="_blank">Help</a>)</label>
            </div>
        </div><div class="row">
            <div class="col-xs-12">
                <textarea id="craftingSearchTextEditor"></textarea>
            </div>
        </div>
    </div>
    <div class="row">
        <strong class="col-xs-12" style="display: none;" id="noaSettingsSavedLabel">
            Settings have been saved
        </strong>
    </div>
</div>
        `;

        var SFX = null;
        var userSettings = null;

        var isEventCountdownActive = false;

        var counters = {
            lastConstructionNotification: 0,
            lastHarvestronNotification: 0,
            lastQuestNotification: 0,
        };


        var notificationLogEntries = [];

        /** Misc function container */
        const fn = {
            /**
             * Creates a floaty notification and plays a sound, based on preferences
             * @param {String} text Text to display
             * @param {object} settings Settings for this type of notification
             * @param {number} recurrenceCounter The number of seconds this event has recurred for. Optional, defaults to zero
             */
            notification: function(text, settings, recurrenceCounter) {
                recurrenceCounter = _.defaultTo(recurrenceCounter, 0);
                // It's a good recurrence if it is the first one, or if recurring notifications are on
                // and it's been long enough since the previous
                var isGoodRecurrence = (recurrenceCounter === 0) ||
                    (userSettings.recurringNotifications && (recurrenceCounter % userSettings.recurringNotificationsTimeout === 0));

                // Only ever log the first instance of a recurrence, even if it's a good recurrence
                const doLog = settings.log && (recurrenceCounter === 0);
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
                    SFX.msg_ding.play();
                }
            },
            displaySettingsSavedLabel: function() {
                const label = document.getElementById('noaSettingsSavedLabel');
                label && (label.style.display = 'block');
            },
            debouncedHideSettingsSavedLabel: _.debounce(function() {
                const label = document.getElementById('noaSettingsSavedLabel');
                label && (label.style.display = 'none');
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
            populateSettingsEditor: function() {
                $('#recurringNotificationsEditor')[0].checked = userSettings.recurringNotifications;
                $('#recurringNotificationsTimeoutEditor').val(userSettings.recurringNotificationsTimeout);
                $('#soundVolumeEditor').val(userSettings.soundVolume);
                $('#fatiguePopupEditor')[0].checked = userSettings.fatigue.popup;
                $('#fatigueSoundEditor')[0].checked = userSettings.fatigue.sound;
                $('#fatigueLogEditor')[0].checked = userSettings.fatigue.log;
                $('#eventPopupEditor')[0].checked = userSettings.event.popup;
                $('#eventSoundEditor')[0].checked = userSettings.event.sound;
                $('#eventLogEditor')[0].checked = userSettings.event.log;
                $('#eventDiscordWebhookEditor').val(userSettings.event.discordWebhook);
                $('#eventDiscordMessageEditor').val(userSettings.event.discordMessage);
                $('#harvestronPopupEditor')[0].checked = userSettings.harvestron.popup;
                $('#harvestronSoundEditor')[0].checked = userSettings.harvestron.sound;
                $('#harvestronLogEditor')[0].checked = userSettings.harvestron.log;
                $('#constructionPopupEditor')[0].checked = userSettings.construction.popup;
                $('#constructionSoundEditor')[0].checked = userSettings.construction.sound;
                $('#constructionLogEditor')[0].checked = userSettings.construction.log;
                $('#whisperPopupEditor')[0].checked = userSettings.whisper.popup;
                $('#whisperSoundEditor')[0].checked = userSettings.whisper.sound;
                $('#whisperLogEditor')[0].checked = userSettings.whisper.log;
                $('#questCompletePopupEditor')[0].checked = userSettings.questComplete.popup;
                $('#questCompleteSoundEditor')[0].checked = userSettings.questComplete.sound;
                $('#questCompleteLogEditor')[0].checked = userSettings.questComplete.log;
                $('#chatSearchPopupEditor')[0].checked = userSettings.chatSearch.popup;
                $('#chatSearchSoundEditor')[0].checked = userSettings.chatSearch.sound;
                $('#chatSearchLogEditor')[0].checked = userSettings.chatSearch.log;
                $('#chatSearchTextEditor').val(userSettings.chatSearch.searchText);
                $('#lootSearchPopupEditor')[0].checked = userSettings.lootSearch.popup;
                $('#lootSearchSoundEditor')[0].checked = userSettings.lootSearch.sound;
                $('#lootSearchLogEditor')[0].checked = userSettings.lootSearch.log;
                $('#lootSearchTextEditor').val(userSettings.lootSearch.searchText);
                $('#craftingSearchPopupEditor')[0].checked = userSettings.craftingSearch.popup;
                $('#craftingSearchSoundEditor')[0].checked = userSettings.craftingSearch.sound;
                $('#craftingSearchLogEditor')[0].checked = userSettings.craftingSearch.log;
                $('#craftingSearchTextEditor').val(userSettings.craftingSearch.searchText);
            },
            saveSettingsEditor: function() {
                userSettings.recurringNotifications = $('#recurringNotificationsEditor')[0].checked;
                userSettings.recurringNotificationsTimeout = parseInt($('#recurringNotificationsTimeoutEditor').val(), 10);
                userSettings.soundVolume = parseInt($('#soundVolumeEditor').val(), 10);
                userSettings.fatigue.popup = $('#fatiguePopupEditor')[0].checked;
                userSettings.fatigue.sound = $('#fatigueSoundEditor')[0].checked;
                userSettings.fatigue.log = $('#fatigueLogEditor')[0].checked;
                userSettings.event.popup = $('#eventPopupEditor')[0].checked;
                userSettings.event.sound = $('#eventSoundEditor')[0].checked;
                userSettings.event.log = $('#eventLogEditor')[0].checked;
                userSettings.event.discordWebhook = $('#eventDiscordWebhookEditor').val();
                userSettings.event.discordMessage = $('#eventDiscordMessageEditor').val();
                userSettings.harvestron.popup = $('#harvestronPopupEditor')[0].checked;
                userSettings.harvestron.sound = $('#harvestronSoundEditor')[0].checked;
                userSettings.harvestron.log = $('#harvestronLogEditor')[0].checked;
                userSettings.construction.popup = $('#constructionPopupEditor')[0].checked;
                userSettings.construction.sound = $('#constructionSoundEditor')[0].checked;
                userSettings.construction.log = $('#constructionLogEditor')[0].checked;
                userSettings.whisper.popup = $('#whisperPopupEditor')[0].checked;
                userSettings.whisper.sound = $('#whisperSoundEditor')[0].checked;
                userSettings.whisper.log = $('#whisperLogEditor')[0].checked;
                userSettings.questComplete.popup = $('#questCompletePopupEditor')[0].checked;
                userSettings.questComplete.sound = $('#questCompleteSoundEditor')[0].checked;
                userSettings.questComplete.log = $('#questCompleteLogEditor')[0].checked;
                userSettings.chatSearch.popup = $('#chatSearchPopupEditor')[0].checked;
                userSettings.chatSearch.sound = $('#chatSearchSoundEditor')[0].checked;
                userSettings.chatSearch.log = $('#chatSearchLogEditor')[0].checked;
                userSettings.chatSearch.searchText = $('#chatSearchTextEditor').val();
                userSettings.lootSearch.popup = $('#lootSearchPopupEditor')[0].checked;
                userSettings.lootSearch.sound = $('#lootSearchSoundEditor')[0].checked;
                userSettings.lootSearch.log = $('#lootSearchLogEditor')[0].checked;
                userSettings.lootSearch.searchText = $('#lootSearchTextEditor').val();
                userSettings.craftingSearch.popup = $('#craftingSearchPopupEditor')[0].checked;
                userSettings.craftingSearch.sound = $('#craftingSearchSoundEditor')[0].checked;
                userSettings.craftingSearch.log = $('#craftingSearchLogEditor')[0].checked;
                userSettings.craftingSearch.searchText = $('#craftingSearchTextEditor').val();

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
                var searchValues = searchValues.split(/\r?\n/);
                for (var k = 0; k < searchValues.length; k++) {
                    if (searchValues[k].length && text.match(new RegExp(searchValues[k], 'i'))) {
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
                    var minutesString = countdownBadgeText.slice(0, 2);
                    var secondsString = countdownBadgeText.slice(3, 5);
                    var secondsUntilEventStart = (parseInt(minutesString, 10) * 60) + parseInt(secondsString, 10);

                    if(userSettings.event.discordWebhook && userSettings.event.discordMessage) {
                        $.post(userSettings.event.discordWebhook, {content: userSettings.event.discordMessage});
                    }
                    fn.notification('An event is starting in five minutes!', userSettings.event);

                    // 30 second warning
                    setTimeout(function() {
                        fn.notification('An event is starting in thirty seconds!', userSettings.event);
                    }, (secondsUntilEventStart - 30) * 1000);

                    // 1 second warning
                    setTimeout(function() {
                        fn.notification('An event is starting!', userSettings.event);
                    }, (secondsUntilEventStart - 1) * 1000);

                    // 10 minutes remaining
                    setTimeout(function() {
                        if (!fn.checkEventParticipation()) {
                            fn.notification('Ten minutes remaining in the event!', userSettings.event);
                        }
                    }, (secondsUntilEventStart + (60 * 5)) * 1000);

                    // 5 minutes remaining
                    setTimeout(function() {
                        if (!fn.checkEventParticipation()) {
                            fn.notification('Five minutes remaining in the event!', userSettings.event);
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
            fatigue: new MutationObserver(
                function(records) {
                    for (var i = 0; i < records.length; i++) {
                        const addedNodes = records[i].addedNodes;
                        if (addedNodes.length) {
                            for (var j = 0; j < addedNodes.length; j++) {
                                const text = $(addedNodes[j]).text();
                                if (text === '5') {
                                    fn.notification('Your stamina is low!', userSettings.fatigue);
                                } else if (text === '0') {
                                    fn.notification('You are fatigued!', userSettings.fatigue);
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
                        fn.notification('You were eliminated from the gauntlet!', userSettings.event);
                    }
                }
            ),

        };

        (function() {
            const ON_LOAD = {
                "Initializing settings": function() {
                    GM_addStyle(NOA_STYLES);

                    fn.loadUserSettings();
                    SFX = {
                        msg_ding: new buzz.sound(URLS.sfx.message_ding, {
                            volume: userSettings.soundVolume
                        })
                    };
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
                    const autosRemainingSpans = document.getElementsByClassName('autosRemaining');

                    /* There is one of these spans in each of the main wrappers (battle, tradeskill, crafting, carving).
                    It seems like all of them are currently updated with the same "autosRemaining" value each action,
                    so there's no need to watch all of them. */
                    if (autosRemainingSpans && autosRemainingSpans.length) {
                        OBSERVERS.fatigue.observe(autosRemainingSpans[0], {
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
                    $('#NoASettings input').change(fn.saveSettingsEditor);
                    $('#NoASettings textarea').change(fn.saveSettingsEditor);
                    noaSettingsButton.click(function() {
                        // Remove teh active class from all of the buttons in the settings link wrapper, then set the settings button active
                        settingsLinksWrapper.children('.active').removeClass('active');
                        noaSettingsButton.addClass('active');

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
