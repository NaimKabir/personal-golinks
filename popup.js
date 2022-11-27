const domainPrefix = '*://'
const PREFIX = domainPrefix + 'go/'
const IDS = {
	links: "links"
}

// extract "Link" tuples, which are (shortLink -> longLink) linkages
function extractLinksFromDynamicRules(dynamicRulesResult) {
	// TODO: Do we need to filter for only this extension's redirect rules?
	return dynamicRulesResult.map(rule => {
		// get shortLink and remove prefix for readability
		let shortLink = rule['condition']['urlFilter'];
		shortLink = shortLink.slice(domainPrefix.length);
		return {
			shortLink: shortLink, 
			longLink: rule['action']["redirect"]["url"]
		}
	})
}

function renderLink(link) {
	linksElement = document.getElementById(IDS.links);
	const linkNode = document.createElement("li");
	const textNode = document.createTextNode(link['shortLink']);
	linkNode.appendChild(textNode);
	linksElement.appendChild(linkNode);
}

// Display each link with a deletion button to clear the rule 
function renderLinks(dynamicRulesResult) {
	links = extractLinksFromDynamicRules(dynamicRulesResult);
	links.forEach(renderLink)
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

function prepopulateLongLinkForm(longLinkForm) {
	// Assume at least one window must be last focused to trigger the extension,
	// and that exactly one tab is highlighted in that window.
	chrome.windows.getLastFocused(
		null,
		(window) => {
			const queryInfo = {
				active: true, 
				highlighted: true,
				windowId: window.id
			}
			chrome.tabs.query(queryInfo, (tabs) => {
				// There should only be the one active tab!
				const tab = tabs[0];
				longLinkForm.value = tab.url || '';
			})
		}
	)
}

// Display current Go-links—fetched directly from Chrome redirect-rules
// we've set.
chrome.declarativeNetRequest.getDynamicRules(renderLinks);

const shortLinkForm = document.getElementById( 'shortLink' );

const longLinkForm = document.getElementById( 'longLink' );
prepopulateLongLinkForm(longLinkForm);

const addButton = document.getElementById( 'add' );
addButton.addEventListener( 'click', () => {
	addLink(shortLinkForm.value, longLinkForm.value);
} );

