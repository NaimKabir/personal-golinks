import { PREFIX } from "./constants";

const MAX_LINKS = 5 // chrome.declarativeNetRequest.MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES; 

export interface Link {
  shortLink: string;
  longLink: string;
  id: number;
}

// Utilities

function notEmpty(object: Object) {
  return object && Object.keys(object).length > 0;
}

function sanitizeInput(text: string) {
  return text || "";
}

// Data storage

enum StorageType {
  SHORTLINK = 1,
  ID_RESERVED = 2
}

function storageKey(key: string, type: StorageType): string {
  // We namespace bits of storage by prefixing access keys
  let keyPrefix;
  switch (type) {
    case StorageType.SHORTLINK:
      keyPrefix = 'SL-';
      break;
    case StorageType.ID_RESERVED:
      keyPrefix = 'RS-';
      break;
    default:
      keyPrefix = '';
  }
  return keyPrefix + key;
}

async function getStorage(key: string, type: StorageType): Promise<any> {
  const _key = storageKey(key, type);
  const result = await chrome.storage.local.get(_key);
  return result[_key];
}

async function setStorage(key: string, value: number|boolean, type: StorageType) {
  chrome.storage.local.set({[storageKey(key, type)]: value},  () => {});
}

async function removeStorage(key: string, type: StorageType) {
  chrome.storage.local.remove([storageKey(key, type)])
}

async function reserveID(id: number) {
  setStorage(id.toString(), true, StorageType.ID_RESERVED)
}

async function freeID(id: number) {
  setStorage(id.toString(), false, StorageType.ID_RESERVED)
}

async function idIsFree(id: number): Promise<boolean> {
  const isReserved = await getStorage(id.toString(), StorageType.ID_RESERVED);
  return !isReserved; // nil and false ID reservation status show up as free
}

async function getShortLinkID(
  shortLink: string,
): Promise<number | undefined> {
  let id: number;
  const result = await getStorage(shortLink, StorageType.SHORTLINK);
  if (result) {
    // To be safe, make sure this ID is reserved just in case
    // ID reservation failed before
    await reserveID(id);
    id = result[shortLink];
  } else {
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
  for (let i=1; i <= MAX_LINKS; i++) {
    const isFree = await idIsFree(i);
    if (isFree) {
      id = i;
      break;
    }
  }
  return id;
}

async function setShortLinkID(
  shortLink: string,
): Promise<number | undefined> {
  const id = await getFreeID();
  if (!id) {
    return;
  }
  reserveID(id);
  setStorage(shortLink, id, StorageType.SHORTLINK);
  return id;
}

async function removeShortLinkID(shortLink: string) {
  const id = await getStorage(shortLink, StorageType.SHORTLINK);
  await freeID(id);
  await removeStorage(shortLink, StorageType.SHORTLINK);
}

// Links

export function addLink(shortLink: string, longLink: string) {
  shortLink = sanitizeInput(shortLink);
  longLink = sanitizeInput(longLink);
  getShortLinkID(shortLink).then((id: number) => {
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
