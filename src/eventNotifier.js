(function($) {
	$(document).ready(function() {
		$.fn.getAttributes = function() {
			var attributes = {}; 

			if( this.length ) {
				$.each( this[0].attributes, function( index, attr ) {
					attributes[ attr.name ] = attr.value;
				} ); 
			}

			return attributes;
		};
		
		var observer, config;
		var staminaNotificationShown = false;
		var eventCountdownNotificationShown = false;
		var eventStartedNotificationShown = false;
		var harvestronNotificationShown = false;
		var constructionNotificationShown = false;
		
		MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
		
		observer = new MutationObserver(handlerFn);
		config = {attributes: true, childList: true, characterData: true, subtree: true};
		var htmlBody = $("body")[0]
		observer.observe(htmlBody, config);
		
		function handlerFn(mutations) {
			checkStamina();
			checkEvent();
			checkHarvestron();
			checkConstruction();
		}
		
		function checkStamina() {			
			var fatigueWrappers = $('span.fatigueWrapper');
			var isFatigued = false;
			$.each(fatigueWrappers, function(index, wrapper) {
				if($(wrapper).is(':visible')) {
					isFatigued = true;
				}
			});
			if (isFatigued && !staminaNotificationShown) {
				console.log('chrome runtime', chrome.runtime);
				chrome.runtime.sendMessage({type: "notify_fatigue"}, function() {staminaNotificationShown = true});
			} else if(!isFatigued) {
				staminaNotificationShown = false;
			}
		}
		
		function checkEvent() {
			var eventCountdown = $('#eventCountdown')[0];
			eventCountdown = $(eventCountdown)
			if (eventCountdown && !eventCountdown.is(':visible')) {
				eventCountdownNotificationShown = false;
				eventStartedNotificationShown = false;
			}
			if (eventCountdown && eventCountdown.is(':visible')) {
				if(eventCountdown.text() !== "!") {
					if(!eventCountdownNotificationShown) {
						chrome.runtime.sendMessage({type: "notify_event_countdown"}, function() {eventCountdownNotificationShown = true});
					}
				} else {
					if(!eventStartedNotificationShown) {
						chrome.runtime.sendMessage({type: "notify_event_started"}, function() {eventStartedNotificationShown = true});
					}
				}
			}
		}
		
		function checkHarvestron() {
			var harvestronNotifier = $('#harvestronNotifier')[0];
			harvestronNotifier = $(harvestronNotifier);
			if(harvestronNotifier && harvestronNotifier.is(':visible')) {
				if (!harvestronNotificationShown) {
					chrome.runtime.sendMessage({type: "notify_harvestron_available"}, function() {harvestronNotificationShown = true});
				}
			} else {
				harvestronNotificationShown = false;
			}
		}
		
		function checkConstruction() {
			var constructionNotifier = $('#constructionNotifier')[0];
			constructionNotifier = $(constructionNotifier);
			if(constructionNotifier && constructionNotifier.is(':visible')) {
				if (!constructionNotificationShown) {
					chrome.runtime.sendMessage({type: "notify_construction_available"}, function() {consturctioNotificationShown = true});
				}
			} else {
				constructionNotificationShown = false;
			}
		}
	});
})(jQuery);