const PREFIX = '*://go/'
const IDS = {links: "links"}

// extract "Link" tuples, which are (shortLink -> longLink) linkages
function extractLinksFromDynamicRules(dynamicRulesResult) {
	// get shortLink and remove prefix for readability
	return dynamicRulesResult.map(rule => {
		return {
			shortLink: rule['condition']['urlFilter'], 
			longLink: rule['action']["redirect"]["url"]
		}
	})
}

function displayLink(link) {
	linksElement = document.getElementById(IDS.links);
	const linkNode = document.createElement("li");
	const textNode = document.createTextNode(link['shortLink']);
	linkNode.appendChild(textNode);
	linksElement.appendChild(linkNode);
}

// Display each link with a deletion button to clear the rule 
function displayLinks(dynamicRulesResult) {
	links = extractLinksFromDynamicRules(dynamicRulesResult);
	links.forEach(displayLink)
}


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

chrome.declarativeNetRequest.getDynamicRules(displayLinks);

const shortLinkForm = document.getElementById( 'shortLink' );
const longLinkForm = document.getElementById( 'longLink' );
const addButton = document.getElementById( 'add' );
addButton.addEventListener( 'click', () => {
	addLink(shortLinkForm.value, longLinkForm.value);
} );

