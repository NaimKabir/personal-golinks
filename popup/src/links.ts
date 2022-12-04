import {PREFIX} from './constants';

// Utilities

function notEmpty(object) {
  return object && Object.keys(object).length > 0;
}

function sanitizeInput(text) {
  return text || "";
}

// Data storage

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

// Links

export function addLink(shortLink, longLink) {
  shortLink = sanitizeInput(shortLink);
  longLink = sanitizeInput(longLink);
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
                url: longLink,
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

export function removeLink(link) {
  removeShortLinkID(link.shortLink);
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [link.id],
  });
}