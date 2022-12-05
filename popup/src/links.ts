import {PREFIX} from './constants';

export interface Link {
  shortLink: string
  longLink: string
  id: number
}

// Utilities

function notEmpty(object: Object) {
  return object && Object.keys(object).length > 0;
}

function sanitizeInput(text: string) {
  return text || "";
}

// Data storage

async function getShortLinkID(shortLink: string, rules: Array<chrome.declarativeNetRequest.Rule>) : Promise<number> {
  let id: number;
  const result = await chrome.storage.local.get(shortLink);
  if (notEmpty(result)) {
    id = result[shortLink];
  } else {
    id = setShortLinkID(shortLink, rules);
  }
  return id;
}

function setShortLinkID(shortLink: string, rules: Array<chrome.declarativeNetRequest.Rule>): number {
  // Assume that the last rule was the last one added, and consider its ID
  // a cursor for autoincrementing the ID.
  const id =
    rules.length >= 1
      ? rules[rules.length - 1].id + 1
      : 1;
  chrome.storage.local.set({ [shortLink]: id }, () => {});
  return id;
}

async function removeShortLinkID(shortLink: string) {
  await chrome.storage.local.remove([shortLink]);
}

// Links

export function addLink(shortLink: string, longLink: string) {
  shortLink = sanitizeInput(shortLink);
  longLink = sanitizeInput(longLink);
  chrome.declarativeNetRequest.getDynamicRules((rules) => {
    getShortLinkID(sanitizeInput(shortLink), rules).then((id: number) => {
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [id],
        addRules: [
          {
            id: id,
            priority: 1,
            action: {
              type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
              redirect: {
                url: longLink,
              },
            },
            condition: {
              urlFilter: PREFIX + shortLink,
              resourceTypes: [
                chrome.declarativeNetRequest.ResourceType.MAIN_FRAME
              ],
            },
          },
        ],
      });
    });
  });
}

export async function removeLink(link: Link) {
  await removeShortLinkID(link.shortLink);
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [link.id],
  });
}