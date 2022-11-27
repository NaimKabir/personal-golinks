PREFIX = '*://go/'

rules = chrome.declarativeNetRequest.getDynamicRules()
console.log(rules)

function createID() {
	return self.crypto.randomUUID();
}

function addLink(shortlink, longDestination) {
	chrome.declarativeNetRequest.updateDynamicRules({    
		addRules: [{
	      		'id': 1001,
	      		'priority': 1,
	      		'action': {
	        	'type': 'redirect',
	        	'redirect': {
	          		url: longDestination
	        	}
		      	},
	      		'condition': {
	      		  'urlFilter': PREFIX + shortlink,
	      		  'resourceTypes': [
	      		    'csp_report', 'font', 'image', 'main_frame', 'media', 'object', 'other', 'ping', 'script',
	      		    'stylesheet', 'sub_frame', 'webbundle', 'websocket', 'webtransport', 'xmlhttprequest'
	      		  ]
	      		}
	    	}],
	   	removeRuleIds: [1001]
	})
}

url = 'https://thesfcommons.notion.site/The-Commons-Campus-68d7514847454184bbefe1b62efdf7f8'
addLink('sup', url)
