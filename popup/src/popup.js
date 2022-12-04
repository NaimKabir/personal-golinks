// Import our custom CSS
import "./styles.scss";

import { renderLinks } from "./render";
import {PREFIX} from "./constants";

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
  await chrome.storage.local.remove([shortLink]);
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
  chrome.windows.getCurrent(null, (window) => {
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

function updateShortLinkHelp(shortLinkForm) {
  const shortLinkHelp = document.getElementById("shortLinkHelp");
  shortLinkHelp.innerHTML = "go/" + shortLinkForm.value;
}
function listenForShortLinkInputs(shortLinkForm) {
  shortLinkForm.addEventListener("keyup", () => {
    updateShortLinkHelp(shortLinkForm);
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