// Import our custom CSS
import "./styles.scss";

// Import all of Bootstrap's JS
// import * as bootstrap from 'bootstrap'

const domainPrefix = "*://";
const PREFIX = domainPrefix + "go/";
const CACHE = {};
const IDS = {
  links: "links",
};

function notEmpty(object) {
  return object && Object.keys(object).length > 0;
}

async function getShortLinkID(shortLink, dynamicRulesResult) {
  let id;
  const result = await chrome.storage.local.get(shortLink);
  if (notEmpty(result)) {
    id = result[shortLink];
  } else {
    id = setShortLinkID(shortLink, dynamicRulesResult);
  }
  return id;
}

function setShortLinkID(shortLink, dynamicRulesResult) {
  // Assume that the last rule was the last one added, and consider its ID
  // a cursor for autoincrementing the ID.
  const id =
    dynamicRulesResult.length >= 1
      ? dynamicRulesResult[dynamicRulesResult.length - 1].id + 1
      : 1;
  chrome.storage.local.set({ [shortLink]: id }, () => {});
  return id;
}

async function removeShortLinkID(shortLink) {
  await chrome.storage.local.remove(shortLink);
}

// extract "Link" tuples, which are (shortLink -> longLink) linkages
function extractLinksFromDynamicRules(dynamicRulesResult) {
  return dynamicRulesResult.map((rule) => {
    // get shortLink and remove prefix for readability
    let shortLink = rule.condition.urlFilter;
    shortLink = shortLink.slice(domainPrefix.length);
    return {
      shortLink: shortLink,
      longLink: rule.action.redirect.url,
      id: rule.id,
    };
  });
}

function renderLink(link) {
  const linksElement = document.getElementById(IDS.links);
  const linkNode = document.createElement("li");
  const textNode = document.createTextNode(link.shortLink + " " + link.id);
  const buttonNode = document.createElement("button");
  buttonNode.addEventListener("click", () => {
    removeLink(link);
    linkNode.remove();
  });

  linkNode.appendChild(textNode);
  linkNode.appendChild(buttonNode);

  linksElement.appendChild(linkNode);
}

function renderLinks(dynamicRulesResult) {
  const links = extractLinksFromDynamicRules(dynamicRulesResult);
  links.forEach(renderLink);
}

function sanitizeInput(text) {
  return text || "";
}

function addLink(shortLink, longDestination) {
  chrome.declarativeNetRequest.getDynamicRules((rules) => {
    getShortLinkID(sanitizeInput(shortLink), rules).then((id) => {
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [id],
        addRules: [
          {
            id: id,
            priority: 1,
            action: {
              type: "redirect",
              redirect: {
                url: longDestination,
              },
            },
            condition: {
              urlFilter: PREFIX + shortLink,
              resourceTypes: [
                "csp_report",
                "font",
                "image",
                "main_frame",
                "media",
                "object",
                "other",
                "ping",
                "script",
                "stylesheet",
                "sub_frame",
                "webbundle",
                "websocket",
                "webtransport",
                "xmlhttprequest",
              ],
            },
          },
        ],
      });
    });
  });
}

function removeLink(link) {
  removeShortLinkID(link.shortLink);
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [link.id],
  });
}

function prepopulateLongLinkForm(longLinkForm) {
  // Assume at least one window must be last focused to trigger the extension,
  // and that exactly one tab is highlighted in that window.
  chrome.windows.getLastFocused(null, (window) => {
    const queryInfo = {
      active: true,
      highlighted: true,
      windowId: window.id,
    };
    chrome.tabs.query(queryInfo, (tabs) => {
      // There should only be the one active tab!
      const tab = tabs[0];
      longLinkForm.value = tab.url || "";
    });
  });
}

function listenForShortLinkInputs(shortLinkForm) {
  shortLinkForm.addEventListener("keypress", () => {
    const shortLinkHelp = document.getElementById("shortLinkHelp");
    shortLinkHelp.innerHTML = "beep";
  });
}

// Display current Go-links—fetched directly from Chrome redirect-rules
// we've set.
chrome.declarativeNetRequest.getDynamicRules(renderLinks);

const shortLinkForm = document.getElementById("shortLinkForm");
listenForShortLinkInputs(shortLinkForm);

const longLinkForm = document.getElementById("longLinkForm");
prepopulateLongLinkForm(longLinkForm);

const addButton = document.getElementById("add");
addButton.addEventListener("click", () => {
  addLink(shortLinkForm.value, longLinkForm.value);
});

const errors = document.getElementById("errors");
//errors.innerHTML = document.getElementById( IDS.links );
