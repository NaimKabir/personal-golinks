import "./styles.scss";

import {GO_PREFIX, PREFIX} from './constants';
import {removeLink} from './links';

// extract "Link" tuples, which are (shortLink -> longLink) linkages
function extractLinksFromDynamicRules(dynamicRulesResult) {
  return dynamicRulesResult.map((rule) => {
    // get shortLink and remove prefix for readability
    let shortLink = rule.condition.urlFilter;
    shortLink = shortLink.slice(PREFIX.length);
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

function renderLink(link) {
  const linksElement = document.getElementById( "links" );
  const linkNode = document.createElement("li");
  linkNode.className =
    "list-group-item d-flex justify-content-between align-items-center list-group-item-action";
  const textNode = document.createTextNode(
    GO_PREFIX + link.shortLink + " " + link.id
  );
  const buttonNode = document.createElement("button");
  buttonNode.className = "btn btn-danger";
  buttonNode.appendChild(renderTrashCanIcon());
  buttonNode.addEventListener("click", () => {
    removeLink(link);
    linkNode.remove();
  });

  linkNode.appendChild(textNode);
  linkNode.appendChild(buttonNode);

  linksElement.appendChild(linkNode);
}

export function renderLinks(dynamicRulesResult) {
  const links = extractLinksFromDynamicRules(dynamicRulesResult);
  links.forEach(renderLink);
}