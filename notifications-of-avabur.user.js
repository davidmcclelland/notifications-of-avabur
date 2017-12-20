// ==UserScript==
// @name           Notifications of Avabur
// @namespace      https://github.com/davidmcclelland/
// @author         Dave McClelland <davidmcclelland@gmail.com>
// @homepage       https://github.com/davidmcclelland/notifications-of-avabur
// @supportURL     https://github.com/davidmcclelland/notifications-of-avabur/issues
// @description    Never miss another gauntlet again!
// @include        https://avabur.com/game.php
// @include        http://avabur.com/game.php
// @include        https://www.avabur.com/game.php
// @include        http://www.avabur.com/game.php
// @include        https://beta.avabur.com/game
// @include        http://beta.avabur.com/game
// @include        https://www.beta.avabur.com/game
// @include        http://www.beta.avabur.com/game
// @version        1.3.0
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
            soundVolume: 80,
            fatigue: {popup: true, sound: true},
            event: {popup: true, sound: true, discordWebhook: ''},
            harvestron: {popup: true, sound: true},
            construction: {popup: true, sound: true},
            whisper: {popup: true, sound: true},
            questComplete: {popup: true, sound: true},
            chatSearch: {popup: true, sound: true, searchText: ''},
            lootSearch: {popup: true, sound: true, searchText: ''},
            craftingSearch: {popup: true, sound: true, searchText: ''}
        }

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

#notificationLogItems {
    margin-top: 10px;
}
        `

        const SETTINGS_DIALOG_HTML = `
<div id="NoASettings" style="display: none; margin-top: 10px;">
    <div class="row">
        <div class="col-xs-12 text-center">
            <h4 class="nobg">Notifications of Avabur Settings</h4>
        </div><div class="col-xs-6">
            <label><input id="recurringNotificationsEditor" type="checkbox">Recurring Notifications</label>
        </div><div class="col-xs-6">
            <label>Sound Volume</label>
            <input id="soundVolumeEditor"                   type="number" min="1" max="100">
        </div><div class="col-xs-6">
            <label><input id="fatiguePopupEditor"           type="checkbox">Fatigue Popup</label>
        </div><div class="col-xs-6">
            <label><input id="fatigueSoundEditor"           type="checkbox">Fatigue Sound</label>
        </div><div class="col-xs-6">
            <label><input id="eventPopupEditor"             type="checkbox">Event Popup</label>
        </div><div class="col-xs-6">
            <label><input id="eventSoundEditor"             type="checkbox">Event Sound</label>
        </div><div class="col-xs-12">
            <label>Event <a href="https://discordapp.com/developers/docs/resources/webhook#execute-webhook">Discord Webhook</a></label>
            <input id="eventDiscordWebhookEditor"           type="text" style="width: 80%;">
        </div><div class="col-xs-6">
            <label><input id="harvestronPopupEditor"        type="checkbox">Harvestron Popup</label>
        </div><div class="col-xs-6">
            <label><input id="harvestronSoundEditor"        type="checkbox">Harvestron Sound</label>
        </div><div class="col-xs-6">
            <label><input id="constructionPopupEditor"      type="checkbox">Construction Popup</label>
        </div><div class="col-xs-6">
            <label><input id="constructionSoundEditor"      type="checkbox">Construction Sound</label>
        </div><div class="col-xs-6">
            <label><input id="whisperPopupEditor"           type="checkbox">Whisper Popup</label>
        </div><div class="col-xs-6">
            <label><input id="whisperSoundEditor"           type="checkbox">Whisper Sound</label>
        </div><div class="col-xs-6">
            <label><input id="questCompletePopupEditor"     type="checkbox">Quest Complete Popup</label>
        </div><div class="col-xs-6">
            <label><input id="questCompleteSoundEditor"     type="checkbox">Quest Complete Sound</label>
        </div>
    </div><hr><div class="row">
        <div class="col-xs-6">
            <label><input id="chatSearchPopupEditor"        type="checkbox">Chat Search Popup</label>
        </div><div class="col-xs-6">
            <label><input id="chatSearchSoundEditor"        type="checkbox">Chat Search Sound</label>
        </div><div class="col-xs-12">
            <label>Chat search text</label>
        </div><div class="col-xs-12">
            <textarea id="chatSearchTextEditor"></textarea>
        </div>
    </div><hr><div class="row">
        <div class="col-xs-6">
            <label><input id="lootSearchPopupEditor"        type="checkbox">Loot Search Popup</label>
        </div><div class="col-xs-6">
            <label><input id="lootSearchSoundEditor"        type="checkbox">Loot Search Sound</label>
        </div><div class="col-xs-12">
            <label>Loot search text</label>
        </div><div class="col-xs-12">
            <textarea id="lootSearchTextEditor"></textarea>
        </div>
    </div><hr><div class="row">
        <div class="col-xs-6">
            <label><input id="craftingSearchPopupEditor"    type="checkbox">Crafting Search Popup</label>
        </div><div class="col-xs-6">
            <label><input id="craftingSearchSoundEditor"    type="checkbox">Crafting Search Sound</label>
        </div><div class="col-xs-12">
            <label>Crafting search text search text</label>
        </div><div class="col-xs-12">
            <textarea id="craftingSearchTextEditor"></textarea>
        </div><div class="col-xs-12">
            <button id="saveNoASettingsButton" class="btn btn-primary">Save Changes</button>
        </div>
    </div>
</div>
        `;

        var SFX = null;;
        var userSettings = null;

        var counters = {
            lastConstructionNotification: 0,
            lastHarvestronNotification: 0,
            lastQuestNotification: 0,
        };


        var notificationLogEntries = [];

        /** Misc function container */
        const fn = {
            /**
             * Creates a floaty notification
             * @param {String} text Text to display
             */
            notification: function(text, addToLog) {
                if (addToLog !== false) {
                    notificationLogEntries.push({
                        timestamp: new Date(),
                        text: text
                    });
                }
                if (notificationLogEntries.length > 100) {
                    notificationLogEntries.shift();
                }

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
            },
            loadUserSettings: function() {
                var loadedSettings;

                var loadedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY));
                console.log('loaded settings', loadedSettings);
                userSettings = _.defaultsDeep(loadedSettings, DEFAULT_USER_SETTINGS);

                // Save settings to store any defaulted settings
                fn.storeUserSettings();
            },
            storeUserSettings: function() {
                console.log('storing user settings', userSettings);
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(userSettings));
            },
            populateSettingsEditor: function() {
                $('#recurringNotificationsEditor')[0].checked = userSettings.recurringNotifications;
                $('#soundVolumeEditor').val(userSettings.soundVolume);
                $('#fatiguePopupEditor')[0].checked = userSettings.fatigue.popup;
                $('#fatigueSoundEditor')[0].checked = userSettings.fatigue.sound;
                $('#eventPopupEditor')[0].checked = userSettings.event.popup;
                $('#eventSoundEditor')[0].checked = userSettings.event.sound;
                $('#eventDiscordWebhookEditor').val(userSettings.event.discordWebhook);
                $('#harvestronPopupEditor')[0].checked = userSettings.harvestron.popup;
                $('#harvestronSoundEditor')[0].checked = userSettings.harvestron.sound;
                $('#constructionPopupEditor')[0].checked = userSettings.construction.popup;
                $('#constructionSoundEditor')[0].checked = userSettings.construction.sound;
                $('#whisperPopupEditor')[0].checked = userSettings.whisper.popup;
                $('#whisperSoundEditor')[0].checked = userSettings.whisper.sound;
                $('#questCompletePopupEditor')[0].checked = userSettings.questComplete.popup;
                $('#questCompleteSoundEditor')[0].checked = userSettings.questComplete.sound;
                $('#chatSearchPopupEditor')[0].checked = userSettings.chatSearch.popup;
                $('#chatSearchSoundEditor')[0].checked = userSettings.chatSearch.sound;
                $('#chatSearchTextEditor').val(userSettings.chatSearch.searchText);
                $('#lootSearchPopupEditor')[0].checked = userSettings.lootSearch.popup;
                $('#lootSearchSoundEditor')[0].checked = userSettings.lootSearch.sound;
                $('#lootSearchTextEditor').val(userSettings.lootSearch.searchText);
                $('#craftingSearchPopupEditor')[0].checked = userSettings.craftingSearch.popup;
                $('#craftingSearchSoundEditor')[0].checked = userSettings.craftingSearch.sound;
                $('#craftingSearchTextEditor').val(userSettings.craftingSearch.searchText);
            },
            saveSettingsEditor: function() {
                userSettings.recurringNotifications = $('#recurringNotificationsEditor')[0].checked;
                userSettings.soundVolume = parseInt($('#soundVolumeEditor').val(), 10);
                userSettings.fatigue.popup = $('#fatiguePopupEditor')[0].checked;
                userSettings.fatigue.sound = $('#fatigueSoundEditor')[0].checked;
                userSettings.event.popup = $('#eventPopupEditor')[0].checked;
                userSettings.event.sound = $('#eventSoundEditor')[0].checked;
                userSettings.event.discordWebhook = $('#eventDiscordWebhookEditor').val();
                userSettings.harvestron.popup = $('#harvestronPopupEditor')[0].checked;
                userSettings.harvestron.sound = $('#harvestronSoundEditor')[0].checked;
                userSettings.construction.popup = $('#constructionPopupEditor')[0].checked;
                userSettings.construction.sound = $('#constructionSoundEditor')[0].checked;
                userSettings.whisper.popup = $('#whisperPopupEditor')[0].checked;
                userSettings.whisper.sound = $('#whisperSoundEditor')[0].checked;
                userSettings.questComplete.popup = $('#questCompletePopupEditor')[0].checked;
                userSettings.questComplete.sound = $('#questCompleteSoundEditor')[0].checked;
                userSettings.chatSearch.popup = $('#chatSearchPopupEditor')[0].checked;
                userSettings.chatSearch.sound = $('#chatSearchSoundEditor')[0].checked;
                userSettings.chatSearch.searchText = $('#chatSearchTextEditor').val();
                userSettings.lootSearch.popup = $('#lootSearchPopupEditor')[0].checked;
                userSettings.lootSearch.sound = $('#lootSearchSoundEditor')[0].checked;
                userSettings.lootSearch.searchText = $('#lootSearchTextEditor').val();
                userSettings.craftingSearch.popup = $('#craftingSearchPopupEditor')[0].checked;
                userSettings.craftingSearch.sound = $('#craftingSearchSoundEditor')[0].checked;
                userSettings.craftingSearch.searchText = $('#craftingSearchTextEditor').val();

                fn.storeUserSettings();
            },
            checkConstructionVisible: function() {
                var div = document.getElementById('constructionNotifier');
                if (div && (div.style.display !== 'none')) {
                    /* If lastNotification is 0, then it just became visible so notify regardless of recurring settings.
                     * Otherwise, if recurring is set up and it's been 20 seconds, notify again */
                    if (counters.lastConstructionNotification === 0 || (userSettings.recurringNotifications && counters.lastConstructionNotification % 20 === 0)) {
                        if (userSettings.construction.popup) {
                            fn.notification('Construction available!', counters.lastConstructionNotification === 0);
                        }
                        if (userSettings.construction.sound) {
                            SFX.msg_ding.play();
                        }
                    }
                    counters.lastConstructionNotification++;
                } else {
                    counters.lastConstructionNotification = 0;
                }
            },
            checkHarvestronVisible: function() {
                var div = document.getElementById('harvestronNotifier');
                if (div && (div.style.display !== 'none')) {
                    /* If lastNotification is 0, then it just became visible so notify regardless of recurring settings.
                     * Otherwise, if recurring is set up and it's been 20 seconds, notify again */
                    if (counters.lastHarvestronNotification === 0 || (userSettings.recurringNotifications && counters.lastHarvestronNotification % 20 === 0)) {
                        if (userSettings.harvestron.popup) {
                            fn.notification('Harvestron available!', counters.lastHarvestronNotification === 0);
                        }
                        if (userSettings.harvestron.sound) {
                            SFX.msg_ding.play();
                        }
                    }
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
                    if (counters.lastQuestNotification === 0 || (userSettings.recurringNotifications && counters.lastQuestNotification % 20 === 0)) {
                        if (userSettings.questComplete.popup) {
                            fn.notification('Quest complete!', counters.lastQuestNotification === 0);
                        }
                        if (userSettings.questComplete.sound) {
                            SFX.msg_ding.play();
                        }
                    }
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
        };

        /** Collection of mutation observers the script uses */
        const OBSERVERS = {
            chat_search: new MutationObserver(
                /** @param {MutationRecord[]} records */
                function(records) {
                    var text = fn.findSearchValuesInRecords(records, userSettings.chatSearch.searchText);
                    if (text) {
                        if (userSettings.chatSearch.popup) {
                            fn.notification(text);
                        }
                        if (userSettings.chatSearch.sound) {
                            SFX.msg_ding.play();
                        }
                        return;
                    }

                    for (var i = 0; i < records.length; i++) {
                        const addedNodes = records[i].addedNodes;
                        if (addedNodes.length) {
                            for (var j = 0; j < addedNodes.length; j++) {
                                const text = $(addedNodes[j]).text();
                                if (text.match(/^\[[0-9]+:[0-9]+:[0-9]+]\s*Whisper from/)) {
                                    if (userSettings.whisper.popup) {
                                        fn.notification(text);
                                    }
                                    if (userSettings.whisper.sound) {
                                        SFX.msg_ding.play();
                                    }
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
                        if (userSettings.lootSearch.popup) {
                            fn.notification(text);
                        }
                        if (userSettings.lootSearch.sound) {
                            SFX.msg_ding.play();
                        }
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
                        if (userSettings.craftingSearch.popup) {
                            fn.notification(text);
                        }
                        if (userSettings.craftingSearch.sound) {
                            SFX.msg_ding.play();
                        }
                        return;
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
                                    if (userSettings.fatigue.popup) {
                                        fn.notification('Your stamina is low!');
                                    }
                                    if (userSettings.fatigue.sound) {
                                        SFX.msg_ding.play();
                                    }
                                } else if (text === '0') {
                                    if (userSettings.fatigue.popup) {
                                        fn.notification('You are fatigued!');
                                    }
                                    if (userSettings.fatigue.sound) {
                                        SFX.msg_ding.play();
                                    }
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
                                const text = $(addedNodes[j]).text();
                                if (text === '04m55s') {
                                    if(userSettings.event.discordWebhook) {
                                        $.post(userSettings.event.discordWebhook, {content: '@everyone An event is starting in five minutes!'});
                                    }

                                    if (userSettings.event.popup) {
                                        fn.notification('An event is starting in five minutes!');
                                    }
                                    if (userSettings.event.sound) {
                                        SFX.msg_ding.play();
                                    }
                                } else if (text === '30s') {
                                    if (userSettings.event.popup) {
                                        fn.notification('An event is starting in thirty seconds!');
                                    }
                                    if (userSettings.event.sound) {
                                        SFX.msg_ding.play();
                                    }
                                } else if (text === '01s') {
                                    if (userSettings.event.popup) {
                                        fn.notification('An event is starting!');
                                    }
                                    if (userSettings.event.sound) {
                                        SFX.msg_ding.play();
                                    }
                                }
                            }
                        }
                    }
                }
            ),
            bossFailure: new MutationObserver(
                function(records) {
                    if (fn.checkRecordsVisible(records)) {
                        if (userSettings.event.popup) {
                            fn.notification('You were eliminated from the gauntlet!');
                        }
                        if (userSettings.event.sound) {
                            SFX.msg_ding.play();
                        }
                    }
                }
            ),

        };

        (function() {
            const ON_LOAD = {
                "Initializing settings": function() {
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
                    var saveNoaSettingsButton = $('#saveNoASettingsButton');
                    saveNoaSettingsButton.click(fn.saveSettingsEditor);
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
