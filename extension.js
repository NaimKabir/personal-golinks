url = 'https://thesfcommons.notion.site/The-Commons-Campus-68d7514847454184bbefe1b62efdf7f8'
console.log("updating rules")
chrome.declarativeNetRequest.updateDynamicRules({    
	addRules: [{
      		'id': 1001,
      		'priority': 1,
      		'action': {
        	'type': 'redirect',
        	'redirect': {
          		url: url
        	}
	      	},
      		'condition': {
      		  'urlFilter': '*://go/*',
      		  'resourceTypes': [
      		    'csp_report', 'font', 'image', 'main_frame', 'media', 'object', 'other', 'ping', 'script',
      		    'stylesheet', 'sub_frame', 'webbundle', 'websocket', 'webtransport', 'xmlhttprequest'
      		  ]
      		}
    	}],
   	removeRuleIds: [1001]
 })
