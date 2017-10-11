// ==UserScript==
// @name           Notifications of Avabur
// @namespace      https://github.com/davidmcclelland/
// @author         Dave McClelland <davidmcclelland@gmail.com>
// @homepage       https://github.com/davidmcclelland/notifications-of-avabur
// @supportURL     https://github.com/davidmcclelland/notifications-of-avabur/issues
// @description    Some welcome additions to Avabur's UI choices
// @include        https://avabur.com/game.php
// @include        http://avabur.com/game.php
// @include        https://www.avabur.com/game.php
// @include        http://www.avabur.com/game.php
// @include        https://beta.avabur.com/game
// @include        http://beta.avabur.com/game
// @include        https://www.beta.avabur.com/game
// @include        http://www.beta.avabur.com/game
// @version        0.0.5
// @icon           https://rawgit.com/davidmcclelland/notifications-of-avabur/master/res/img/logo-32.png
// @downloadURL    https://github.com/davidmcclelland/notifications-of-avabur/raw/master/notifications-of-avabur.user.js
// @updateURL      https://github.com/davidmcclelland/notifications-of-avabur/raw/master/notifications-of-avabur.user.js
// @run-at         document-end
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_notification
// @grant          GM_listValues
// @grant          GM_xmlhttpRequest
// @connect        githubusercontent.com
// @connect        github.com
// @connect        self
// @require        https://rawgit.com/davidmcclelland/notifications-of-avabur/master/lib/toastmessage/javascript/jquery.toastmessage.js
// @require        https://cdnjs.cloudflare.com/ajax/libs/buzz/1.2.0/buzz.min.js
// @require        https://openuserjs.org/src/libs/sizzle/GM_config.js
// @license        LGPL-2.1
// @noframes
// ==/UserScript==

const Toast = { //Tampermonkey's scoping won't let this constant be globally visible
    error: function (msg) {
        console.error(msg);
        $().toastmessage('showErrorToast', msg);
    },
    notice: function (msg) {
        $().toastmessage('showNoticeToast', msg);
    },
    success: function (msg) {
        $().toastmessage('showSuccessToast', msg);
    },
    warn: function (msg) {
        console.warn(msg);
        $().toastmessage('showWarningToast', msg);
    },
    incompatibility: function (what) {
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
if (typeof(window.sessionStorage) === "undefined") {
    Toast.incompatibility("Session storage");
} else if (typeof(MutationObserver) === "undefined") {
    Toast.incompatibility("MutationObserver");
} else {
    (function ($, CACHE_STORAGE, MutationObserver, buzz) {
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
                message_ding: gh_url("res/sfx/message_ding.wav")
            },
            css: {
                toast: gh_url("lib/toastmessage/resources/css/jquery.toastmessage.css"),
                // TODO: use gh_url after this is merged to master
                settings: "https://github.com/davidmcclelland/notifications-of-avabur/raw/settings-css-extraction/res/css/settings.css"
            },
        };

        /**
         * The URL where we check for updates. This is different from @updateURL because we want it to come through
         * as a regular page load, not a request to the raw file
         */
        const UPDATE_URL = "https://github.com/davidmcclelland/notifications-of-avabur/blob/master/notifications-of-avabur.user.js";

        /////////////////////////////////////////////////////
        // This is the script code. Don't change it unless //
        // you know what you're doing ;)                   //
        /////////////////////////////////////////////////////

        var NOA_SETTINGS = {
            id: 'NoAConfig',
            title: 'NoA Settings',
            fields: {
                popupsStealFocus: {
                    label: 'Popups steal focus',
                    type: 'checkbox',
                    default: true
                },
                fatiguePopup: {
                    label: 'Fatigue popup',
                    type: 'checkbox',
                    default: true
                },
                fatigueSound: {
                    label: 'Fatigue sound',
                    type: 'checkbox',
                    default: true
                },
                eventPopup: {
                    label: 'Event popup',
                    type: 'checkbox',
                    default: true
                },
                eventSound: {
                    label: 'Event sound',
                    type: 'checkbox',
                    default: true
                },
                harvestronPopup: {
                    label: 'Harvestron popup',
                    type: 'checkbox',
                    default: true
                },
                harvestronSound: {
                    label: 'Harvestron sound',
                    type: 'checkbox',
                    default: true
                },
                constructionPopup: {
                    label: 'Construction popup',
                    type: 'checkbox',
                    default: true
                },
                constructionSound: {
                    label: 'Construction sound',
                    type: 'checkbox',
                    default: true
                },
                whisperPopup: {
                    label: 'Whisper popup',
                    type: 'checkbox',
                    default: true
                },
                whisperSound: {
                    label: 'Whisper sound',
                    type: 'checkbox',
                    default: true
                },
                questCompletePopup: {
                    label: 'Quest complete popup',
                    type: 'checkbox',
                    default: true
                },
                questCompleteSound: {
                    label: 'Quest complete sound',
                    type: 'checkbox',
                    default: true
                },
                chatSearchPopup: {
                    label: 'Chat search popup',
                    type: 'checkbox',
                    default: true
                },
                chatSearchSound: {
                    label: 'Chat search sound',
                    type: 'checkbox',
                    default: true
                },
                chatSearchValues: {
                    label: 'Chat search values',
                    type: 'textarea',
                    default: ''
                }
            },
        };

        /** Our persistent DOM stuff */
        const $DOM = {
            /** Game modals */
            modal: {
                /** The outer wrapper */
                modal_wrapper: $("#modalWrapper"),
                /** The faded background for modals */
                modal_background: $("#modalBackground"),
                /** The title for modal windows */
                modal_title: $("#modalTitle"),
            },
            /** Navigation items */
            nav: {
                market: $("#viewMarket")
            },
        };

        const SFX = {
            circ_saw: new buzz.sound(URLS.sfx.circ_saw),
            msg_ding: new buzz.sound(URLS.sfx.message_ding)
        };

        /**
         * Interval manager
         * @param {String} name Interval name/ID
         * @constructor
         */
        const Interval = function (name) {
            this.name = name;
        };

        Interval.prototype = {
            _intervals: {},
            isRunning: function () {
                return typeof(this._intervals[this.name]) !== "undefined";
            },
            clear: function () {
                if (this.isRunning()) {
                    clearInterval(this._intervals[this.name]);
                    delete this._intervals[this.name];
                    return true;
                }

                return false;
            },
            set: function (callback, frequency) {
                this.clear();
                this._intervals[this.name] = setInterval(callback, frequency);
                return this._intervals[this.name];
            }
        };

        /** Misc function container */
        const fn = {
            check_github_for_updates: function () {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: UPDATE_URL,
                    onload: function (r) {
                        const theirVersion = r.responseText.match(/\/\/\s+@version\s+([^\n<>]+)/)[1];
                        if (fn.versionCompare(GM_info.script.version, theirVersion) < 0) {
                            $().toastmessage('showToast', {
                                text: 'A new version of ' + GM_info.script.name + ' is available! Click your ' +
                                'Greasemonkey/Tampermonkey icon, select "Check for updates" and reload the page in a few seconds.',
                                sticky: true,
                                position: 'top-center',
                                type: 'notice'
                            });
                        }
                    }
                });
            },
            /**
             * Creates a floaty notification
             * @param {String} text Text to display
             * @param {Object} [options] Overrides as shown here: https://tampermonkey.net/documentation.php#GM_notification
             */
            notification: function (text, options) {
                GM_notification($.extend({
                    text: text,
                    title: GM_info.script.name,
                    highlight: GM_config.get('popupsStealFocus'),
                    timeout: 5
                }, options || {}));
            },
            /**
             * @return
             * 0 if the versions are equal
             * a negative integer iff v1 &lt; v2
             * a positive integer iff v1 &gt; v2
             * NaN if either version string is in the wrong format
             */
            versionCompare: function (v1, v2, options) {
                var lexicographical = options && options.lexicographical,
                    zeroExtend = options && options.zeroExtend,
                    v1parts = v1.split('.'),
                    v2parts = v2.split('.');

                function isValidPart(x) {
                    return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
                }

                if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
                    return NaN;
                }

                if (zeroExtend) {
                    while (v1parts.length < v2parts.length) v1parts.push("0");
                    while (v2parts.length < v1parts.length) v2parts.push("0");
                }

                if (!lexicographical) {
                    v1parts = v1parts.map(Number);
                    v2parts = v2parts.map(Number);
                }

                for (var i = 0; i < v1parts.length; ++i) {
                    if (v2parts.length == i) {
                        return 1;
                    }

                    if (v1parts[i] == v2parts[i]) {

                    }
                    else if (v1parts[i] > v2parts[i]) {
                        return 1;
                    }
                    else {
                        return -1;
                    }
                }

                if (v1parts.length != v2parts.length) {
                    return -1;
                }

                return 0;
            }
        };

        function checkRecordsVisible(records) {
            for (var i = 0; i < records.length; i++) {
                const target = $(records[i].target);
                var style = window.getComputedStyle(target.context);
                if (style.display !== 'none') {
                    return true;
                }
            }
            return false;
        }

        /** Collection of mutation observers the script uses */
        const OBSERVERS = {
            chat_search: new MutationObserver(
                /** @param {MutationRecord[]} records */
                function (records) {
                    for (var i = 0; i < records.length; i++) {
                        const addedNodes = records[i].addedNodes;
                        if (addedNodes.length) {
                            for (var j = 0; j < addedNodes.length; j++) {
                                const text = $(addedNodes[j]).text();
                                if (text.match(/^\[[0-9]+:[0-9]+:[0-9]+]\s*Whisper from/)) {
                                    if (GM_config.get('whisperPopup')) {
                                        fn.notification(text);
                                    }
                                    if (GM_config.get('whisperSound')) {
                                        SFX.msg_ding.play();
                                    }
                                } else {
                                    // Look for any values listed under chat_search
                                    var chatSearchValues = GM_config.get('chatSearchValues').split(/\r?\n/)
                                    for (var k = 0; k < chatSearchValues.length; k++) {
                                        if (chatSearchValues.length && text.match(chatSearchValues[k])) {
                                           if (GM_config.get('chatSearchPopup')) {
                                                fn.notification(text);
                                            }
                                            if (GM_config.get('chatSearchSound')) {
                                                SFX.msg_ding.play();
                                            }
                                        }
                                    }
                                }
                            }
                        }
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
                                if (text === '0') {
                                    if (GM_config.get('fatiguePopup')) {
                                        fn.notification('You are fatigued!');
                                    }
                                    if (GM_config.get('fatigueSound')) {
                                        SFX.msg_ding.play();
                                    }
                                }
                            }
                        }
                    }
                }
            ),
            harvestron: new MutationObserver(
                function(records) {
                    if (checkRecordsVisible(records)) {
                        if (GM_config.get('harvestronPopup')) {
                            fn.notification("Harvestron available!");
                        }
                        if (GM_config.get('harvestronSound')) {
                            SFX.msg_ding.play();
                        }
                    }
                }
            ),
            construction: new MutationObserver(
                function(records) {
                    if (checkRecordsVisible(records)) {
                        if (GM_config.get('constructionPopup')) {
                            fn.notification("Construction available!");
                        }
                        if (GM_config.get('constructionSound')) {
                            SFX.msg_ding.play();
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
                                    if (GM_config.get('eventPopup')) {
                                        fn.notification('An event is starting in five minutes!');
                                    }
                                    if (GM_config.get('eventSound')) {
                                        SFX.msg_ding.play();
                                    }
                                } else if(text === '30s') {
                                    if (GM_config.get('eventPopup')) {
                                        fn.notification('An event is starting in thirty seconds!');
                                    }
                                    if (GM_config.get('eventSound')) {
                                        SFX.msg_ding.play();
                                    }
                                } else if(text === '01s') {
                                    if (GM_config.get('eventPopup')) {
                                        fn.notification('An event is starting!');
                                    }
                                    if (GM_config.get('eventSound')) {
                                        SFX.msg_ding.play();
                                    }
                                }
                            }
                        }
                    }
                }
            ),
            questComplete: new MutationObserver(
                function(records) {
                    for (var i = 0; i < records.length; i++) {
                        const addedNodes = records[i].addedNodes;
                        if (addedNodes.length) {
                            for (var j = 0; j < addedNodes.length; j++) {
                                const text = $(addedNodes[j]).text();
                                if (text.startsWith('You have completed your quest!')) {
                                    if (GM_config.get('questCompletePopup')) {
                                        fn.notification('Quest complete!');
                                    }
                                    if (GM_config.get('questCompleteSound')) {
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
                    if (checkRecordsVisible(records)) {
                        if (GM_config.get('eventPopup')) {
                            fn.notification('You were eliminated from the gauntlet!');
                        }
                        if (GM_config.get('eventSound')) {
                            SFX.msg_ding.play();
                        }
                    }
                }
            ),
            // TODO: This is all kind of the same thing as 
            chatSearch: new MutationObserver(
                function(records) {

                }
            )

        };

        (function() {
            const ON_LOAD = {
                "Loading script CSS": function () {
                    const $head = $("head"),
                        keys = Object.keys(URLS.css);

                    for (var i = 0; i < keys.length; i++) {
                        $head.append("<link type='text/css' rel='stylesheet' href='" + URLS.css[keys[i]] + "'/>");
                        // $head.append("<style>iframe#NoAConfig {width: 320px!important;height: 450px!important;border:0px!important;border-radius: 40px ;background: transparent linear-gradient(to bottom, rgba(01, 115, 109, 0.9) 0%, rgba(0, 0, 0, 0.5) 100%) ;}</style>"); 
                    }
                },
                "Starting chat monitor": function () {
                    OBSERVERS.chat_search.observe(document.querySelector("#chatMessageList"), {
                        childList: true
                    });
                },
                "Starting fatigue monitor": function () {
                    const autosRemainingSpans = document.getElementsByClassName('autosRemaining');

                    /* There is one of these spans in each of the main wrappers (battle, tradeskill, crafting, carving).
                    It seems like all of them are currently updated with the same "autosRemaining" value each action,
                    so there's no need to watch all of them. */
                    if (autosRemainingSpans && autosRemainingSpans.length) {
                        OBSERVERS.fatigue.observe(autosRemainingSpans[i], {
                            childList: true
                        });
                    }
                },
                "Starting harvestron monitor": function() {
                    OBSERVERS.harvestron.observe(document.querySelector("#harvestronNotifier"), {attributes: true});
                },
                "Starting construction monitor": function() {
                    OBSERVERS.construction.observe(document.querySelector("#constructionNotifier"), {attributes: true});
                },
                "Starting event monitor": function() {
                    OBSERVERS.event.observe(document.querySelector("#eventCountdown"), {childList: true});
                },
                "Starting quest monitor": function() {
                    // Observe battle quests
                    OBSERVERS.questComplete.observe(document.querySelector("#bq_info"), {childList: true});

                    // Observe tradeskill quests
                    OBSERVERS.questComplete.observe(document.querySelector("#tq_info"), {childList: true});

                    // Observe profession quests
                    OBSERVERS.questComplete.observe(document.querySelector("#pq_info"), {childList: true});
                },
                "Starting boss failure monitor": function() {
                    const bossFailureNotifications = document.getElementsByClassName('boss_failure_notification');

                    // There should be only one of these
                    if (bossFailureNotifications && bossFailureNotifications.length) {
                        OBSERVERS.bossFailure.observe(bossFailureNotifications[0], {attributes: true});
                    }
                },
                "Initializing settings": function() {
                    $.when($.get(URLS.css.settings)).done(function(response) {
                        NOA_SETTINGS.css = response;
                        GM_config.init(NOA_SETTINGS);
                        console.log("Settings CSS is", NOA_SETTINGS.css);
                    });
                },
                "Adding settings button": function() {
                    var settingsWrapper = $('#settingsLinksWrapper');
                    settingsWrapper.append('<a id="noaPreferences"><button class="btn btn-primary">NoA Settings</button></a>');
                    $('#noaPreferences').click(function() {
                        GM_config.open();
                    });
                }
            };

            const keys = Object.keys(ON_LOAD);
            for (var i = 0; i < keys.length; i++) {
                console.log('[' + GM_info.script.name + '] ' + keys[i]);
                ON_LOAD[keys[i]]();
            }
            // fn.check_github_for_updates();
            // (new Interval("gh_update")).set(fn.check_github_for_updates, 60000);
        })();

    })(jQuery, window.sessionStorage, MutationObserver, buzz);
}
