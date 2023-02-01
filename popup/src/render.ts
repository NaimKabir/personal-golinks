import "./styles.scss";

import { COMPONENTS, GO_PREFIX, DOMAIN_PREFIX } from "./constants";
import {
  getLinkCount,
  getMaxLinks,
  linkCountIsAtThreshold,
  linkCountIsAtWarningThreshold,
  removeLink,
} from "./links";

import type { Link } from "./links";

const LONG_LINK_CHARACTER_MAX = 32;

// Global state

var SEARCHFILTER = "";

export const setSearchFilter = (filter: string) => {
  SEARCHFILTER = filter;
};

// Rendering

export function renderAddLinkButton(): HTMLButtonElement {
  const addButton = <HTMLButtonElement>(
    document.getElementById(COMPONENTS.addButton.id)
  );
  if (linkCountIsAtThreshold()) {
    // Make button unclickable if we're at threshold
    addButton.className = COMPONENTS.addButton.defaultClassName + " disabled";
  } else {
    addButton.className = COMPONENTS.addButton.defaultClassName;
  }
  return addButton;
}

/**
 * Update the link counter and warn if user is nearing threshold.
 */
export function renderLinkCounter(linkCount: number) {
  const linkCounter = document.getElementById(COMPONENTS.linkCounter.id);
  linkCounter.innerHTML = `${linkCount}/${getMaxLinks()} links created`;
  // Check to see how close we are to the max limit and warn or alert if so
  if (linkCountIsAtThreshold()) {
    linkCounter.className =
      COMPONENTS.linkCounter.defaultClassName + " text-danger";
    return;
  }
  if (linkCountIsAtWarningThreshold()) {
    linkCounter.className =
      COMPONENTS.linkCounter.defaultClassName + " text-warning";
    return;
  }
  linkCounter.className =
    COMPONENTS.linkCounter.defaultClassName + " text-muted";
}

function extractLinksFromDynamicRules(
  rules: Array<chrome.declarativeNetRequest.Rule>
): Array<Link> {
  return rules.map((rule) => {
    // get shortLink and remove prefix for readability
    let shortLink = rule.condition.urlFilter;
    shortLink = shortLink.slice(DOMAIN_PREFIX.length);
    return {
      shortLink: shortLink,
      longLink: rule.action.redirect.url,
      id: rule.id,
    };
  });
}

function renderTrashCanIcon() {
  const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const iconPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );

  // Paths stolen shamelessly from Bootstrap: https://icons.getbootstrap.com/icons/trash/
  iconSvg.setAttribute("height", "16");
  iconSvg.setAttribute("width", "16");
  iconSvg.setAttribute("fill", "currentColor");
  iconSvg.setAttribute("viewBox", "0 0 16 16");
  iconSvg.classList.add("bi");
  iconSvg.classList.add("bi-trash");

  iconPath.setAttribute(
    "d",
    "M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"
  );

  iconSvg.appendChild(iconPath);

  const iconPath2 = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  iconPath2.setAttribute("fill-rule", "evenodd");
  iconPath2.setAttribute(
    "d",
    "M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
  );
  iconSvg.appendChild(iconPath2);

  return iconSvg;
}

function removeLinkAndRender(link: Link, linkNode: HTMLElement) {
  removeLink(link).then(() => {
    renderLinkCounter(getLinkCount());
    renderAddLinkButton();
    linkNode.remove();
  });
}

function renderLink(link: Link) {
  const linksElement = document.getElementById(COMPONENTS.links.id);
  const linkNode = document.createElement("li");
  linkNode.className = COMPONENTS.links.defaultClassName;

  // Text area: with short link and long link displayed

  const textNode = document.createElement("div");
  textNode.className = "justify-content-start";
  const shortLinkNode = document.createElement("a");
  shortLinkNode.href = link.longLink;
  shortLinkNode.target = "_blank"; // to open in a new tab instead of in-extension
  shortLinkNode.innerHTML = link.shortLink + " ";
  textNode.appendChild(shortLinkNode);

  const longLinkPreview = document.createElement("footer");
  longLinkPreview.className = "text-muted";
  let longLinkText = link.longLink.slice(0, LONG_LINK_CHARACTER_MAX);
  if (longLinkText.length < link.longLink.length) {
    longLinkText = longLinkText + "...";
  }
  longLinkPreview.innerHTML = longLinkText;
  textNode.appendChild(longLinkPreview);

  // Button

  const buttonNode = document.createElement("button");
  buttonNode.className = "btn btn-danger";
  buttonNode.appendChild(renderTrashCanIcon());
  buttonNode.addEventListener("click", () => {
    removeLinkAndRender(link, linkNode);
  });

  linkNode.appendChild(textNode);
  linkNode.appendChild(buttonNode);

  linksElement.appendChild(linkNode);
}

function clearLinks() {
  const linksElement = document.getElementById(COMPONENTS.links.id);
  for (let i = linksElement.children.length - 1; i >= 0; i--) {
    console.log(linksElement.children.item(i));
    linksElement.children.item(i).remove();
  }
}

/**
 * Fetches dynamic linking rules from Chrome and renders them.
 * If a search filter has been set, it is applied.
 */
export function renderLinks(): void {
  function renderDynamicRulesResults(
    dynamicRulesResult: Array<chrome.declarativeNetRequest.Rule>
  ) {
    clearLinks();
    let links = extractLinksFromDynamicRules(dynamicRulesResult);
    renderLinkCounter(links.length);
    if (SEARCHFILTER && SEARCHFILTER.length > 0) {
      // Only search the part of the shortLink that doesn't have the GO_PREFIX.
      // Else any keyword including the prefix will return all items.
      links = links.filter((link) =>
        link.shortLink.slice(GO_PREFIX.length).includes(SEARCHFILTER)
      );
    }
    links.forEach(renderLink);
  }
  chrome.declarativeNetRequest.getDynamicRules(renderDynamicRulesResults);
}
