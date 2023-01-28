import { COMPONENTS, PREFIX } from "./constants";

const RESERVED_LINKS = 1000;
const MAX_LINKS =
  chrome.declarativeNetRequest.MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES -
  RESERVED_LINKS;
const WARN_THRESHOLD = 5; // warn if we get within 5 of the limit

// Globals used to manage fetches from chrome storage.
// Initialized upon import of this module
var INITIALIZED = false;
var USED_IDS: { [key: string]: any } = {};
var SHORTLINK_IDS: { [key: string]: any } = {};

export interface Link {
  shortLink: string;
  longLink: string;
  id: number;
}

// Utilities

export async function linkCountIsAtThreshold(): Promise<boolean> {
  const count = await getLinkCount();
  return count >= MAX_LINKS;
}

export async function linkCountIsAtWarningThreshold(): Promise<boolean> {
  const count = await getLinkCount();
  return count >= MAX_LINKS - WARN_THRESHOLD && count < MAX_LINKS;
}

export async function getLinkCount(): Promise<number> {
  if (!INITIALIZED) {
    await initStorage();
  }
  return Object.keys(SHORTLINK_IDS).length;
}

export function getMaxLinks(): number {
  return MAX_LINKS;
}

function sanitizeInput(text: string) {
  return text || "";
}

// Data storage

enum StorageType {
  SHORTLINK = 1, // Shortlink -> ID map
  ID_RESERVED = 2, // ID -> is-used? map
}

function storageKey(type: StorageType) {
  switch (type) {
    case StorageType.SHORTLINK:
      return "SHORTLINK_IDS";
    case StorageType.ID_RESERVED:
      return "USED_IDS";
  }
}

/**
 * Chrome storage APIs have implicit limits so we work with in-memory data stores.
 * Storage is primarily used to keep track of what Link IDs have been used already when talking
 * with the Chrome Dynamic Rules API, and for mapping particular Short-Link text to a Link ID.
 */
export async function initStorage() {
  // We do big fetches and then deal entirely with caches so we don't hit API rate limits
  const usedIdKey = storageKey(StorageType.ID_RESERVED);
  const shortLinksIdKey = storageKey(StorageType.SHORTLINK);
  let storage = await chrome.storage.local.get([usedIdKey, shortLinksIdKey]);
  USED_IDS = storage[usedIdKey] || {};
  SHORTLINK_IDS = storage[shortLinksIdKey] || {};

  INITIALIZED = true;
}

async function getStorage(key: string, type: StorageType): Promise<any> {
  if (!INITIALIZED) {
    await initStorage();
  }
  switch (type) {
    case StorageType.SHORTLINK:
      return SHORTLINK_IDS[key];
    case StorageType.ID_RESERVED:
      return USED_IDS[key];
  }
}

/**
 * We don't write individual items to Chrome storage. Rather, we save our entire local caches to it,
 * infrequently.
 */
function saveBlock() {
  chrome.storage.local.set(
    {
      [storageKey(StorageType.ID_RESERVED)]: USED_IDS,
      [storageKey(StorageType.SHORTLINK)]: SHORTLINK_IDS,
    },
    () => {}
  );
}

function setStorage(key: string, value: number | boolean, type: StorageType) {
  // write locally
  switch (type) {
    case StorageType.SHORTLINK:
      SHORTLINK_IDS[key] = value;
      break;
    case StorageType.ID_RESERVED:
      USED_IDS[key] = value;
      break;
  }
}

function removeStorage(key: string, type: StorageType) {
  // write locally
  switch (type) {
    case StorageType.SHORTLINK:
      delete SHORTLINK_IDS[key];
      break;
    case StorageType.ID_RESERVED:
      delete USED_IDS[key];
      break;
  }
}

function reserveID(id: number) {
  setStorage(id.toString(), true, StorageType.ID_RESERVED);
}

function freeID(id: number) {
  setStorage(id.toString(), false, StorageType.ID_RESERVED);
}

async function idIsFree(id: number): Promise<boolean> {
  const isReserved = await getStorage(id.toString(), StorageType.ID_RESERVED);
  return !isReserved; // nil and false ID reservation status show up as free
}

async function getOrCreateShortLinkID(
  shortLink: string
): Promise<number | undefined> {
  let id = await getStorage(shortLink, StorageType.SHORTLINK);
  if (!id) {
    id = await setShortLinkID(shortLink);
  }
  return id;
}

async function getFreeID(): Promise<number | undefined> {
  // We only allow up to a max-cap of shortlink IDs—
  // so we'll naively iterate up to the cap until we find a free ID.
  // The iteration is capped so it shouldn't be a huge hit to speed.
  let id;
  // ID numbers must start at 1 to abide by chrome API rules
  for (let i = 1; i <= MAX_LINKS; i++) {
    const isFree = await idIsFree(i);
    if (isFree) {
      id = i;
      break;
    }
  }
  return id;
}

async function setShortLinkID(shortLink: string): Promise<number | undefined> {
  const id = await getFreeID();
  if (!id) {
    return;
  }
  reserveID(id);
  setStorage(shortLink, id, StorageType.SHORTLINK);
  saveBlock();
  return id;
}

async function removeShortLinkID(shortLink: string) {
  const id = await getStorage(shortLink, StorageType.SHORTLINK);
  freeID(id);
  removeStorage(shortLink, StorageType.SHORTLINK);
  saveBlock();
}

// Links

export function linkAlreadyExists(shortLink: string): boolean {
  return !!SHORTLINK_IDS[shortLink];
}

export function addLink(shortLink: string, longLink: string) {
  shortLink = sanitizeInput(shortLink);
  longLink = sanitizeInput(longLink);
  getOrCreateShortLinkID(shortLink).then((id: number | undefined) => {
    if (!id) {
      // We're likely at the ID limit, and shouldn't do
      // anything here.
      return;
    }
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
              chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
            ],
          },
        },
      ],
    });
  });
}

export async function removeLink(link: Link) {
  await removeShortLinkID(link.shortLink);
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [link.id],
  });
}

initStorage();
