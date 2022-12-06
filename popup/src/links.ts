import { PREFIX } from "./constants";

const RESERVED_LINKS = 1000;
const MAX_LINKS = chrome.declarativeNetRequest.MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES - RESERVED_LINKS;

// Globals used to manage fetches from chrome storage.
// Initialized upon import of this module
var INITIALIZED = false;
var USED_IDS: {[key: string]: any} = {}; 
var SHORTLINK_IDS: {[key: string]: any} = {};

export interface Link {
  shortLink: string;
  longLink: string;
  id: number;
}

// Utilities

export function getLinkCount(): number {
  return Object.keys(SHORTLINK_IDS).length;
}

export function getMaxLinkCount(): number {
  return MAX_LINKS;
}

export function updateLinkCounter() {
  const linkCounter = document.getElementById("maxLinkWarning");
  const text = `${getLinkCount()}/${getMaxLinkCount()} links created`
  linkCounter.innerHTML = text;
}

function notEmpty(object: Object) {
  return object && Object.keys(object).length > 0;
}

function sanitizeInput(text: string) {
  return text || "";
}

// Data storage

enum StorageType {
  SHORTLINK = 1,
  ID_RESERVED = 2,
}

function storageKey(type: StorageType) {
  switch (type) {
    case StorageType.SHORTLINK:
      return "SHORTLINK_IDS";
    case StorageType.ID_RESERVED:
      return "USED_IDS";
  }
}

export async function initStorage() {
  // We do big fetches and then deal entirely with caches so we don't hit API rate limits
  const usedIdKey = storageKey(StorageType.ID_RESERVED);
  const shortLinksIdKey = storageKey(StorageType.SHORTLINK);
  let storage = await chrome.storage.local.get([usedIdKey, shortLinksIdKey]);
  USED_IDS = storage[usedIdKey] || {};
  SHORTLINK_IDS = storage[shortLinksIdKey] || {};
  updateLinkCounter();

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

function saveBlock(){
  chrome.storage.local.set({
    [storageKey(StorageType.ID_RESERVED)]: USED_IDS,
    [storageKey(StorageType.SHORTLINK)]: SHORTLINK_IDS,
  }, () => {});
}

function setStorage(
  key: string,
  value: number | boolean,
  type: StorageType
) {
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

async function getShortLinkID(shortLink: string): Promise<number | undefined> {
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
  for (let i =1; i <= MAX_LINKS; i++) {
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

export function addLink(shortLink: string, longLink: string) {
  shortLink = sanitizeInput(shortLink);
  longLink = sanitizeInput(longLink);
  getShortLinkID(shortLink).then((id: number | undefined) => {
    if (!id) {
      // TODO: We're likely at the ID limit, and shouldn't do 
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
    updateLinkCounter();
  });
}

export async function removeLink(link: Link) {
  await removeShortLinkID(link.shortLink);
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [link.id],
  });
  updateLinkCounter();
}

initStorage();