(function() {
	console.log('Reached background.js');
	var notificationOptions = {type: 'basic', title: 'Stamina notification', message: 'Some Message', iconUrl: 'icon.png'};
	var cachedTabId = null;
	
	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			cachedTabId = sender.tab.id;
			if (request.type === 'notify_fatigue') {
				chrome.notifications.create("Fatigue notification", {type: 'basic', title: 'Stamina notification', message: 'You need to replenish your stamina!', iconUrl: 'icon.png'});
				// setTimeout(function(){chrome.notifications.clear('Fatigue notification', function(){});}, 5000);
			} else if (request.type === 'notify_event_countdown') {
				chrome.notifications.create("Event countdown notification", {type: 'basic', title: 'Event countdown begun', message: 'An event is starting soon!', iconUrl: 'icon.png'});
				// setTimeout(function(){chrome.notifications.clear('Event countdown begun', function(){});}, 5000);
			} else if (request.type === 'notify_event_started') {
				chrome.notifications.create("Event started notification", {type: 'basic', title: 'Event started', message: 'An event is currently underway!', iconUrl: 'icon.png'});
				// setTimeout(function(){chrome.notifications.clear('Event started', function(){});}, 5000);
			} else if (request.type === 'notify_harvestron_available') {
				chrome.notifications.create("Harvestron available", {type: 'basic', title: 'Harvestron available', message: 'Harvestron is now available!', iconUrl: 'icon.png'});
				// setTimeout(function(){chrome.notifications.clear('Harvestron available', function(){});}, 5000);
			} else if (request.type === 'notify_construction_available') {
				chrome.notifications.create("Construction available", {type: 'basic', title: 'Construction available', message: 'Your workers are free!', iconUrl: 'icon.png'});
				// setTimeout(function(){chrome.notifications.clear('Construction available', function(){});}, 5000);
			}
		}
	);
	
	chrome.notifications.onClicked.addListener(function() {
		var updateProperties = {"active": true};
		chrome.tabs.update(cachedTabId, updateProperties, function(){});
	});
})();