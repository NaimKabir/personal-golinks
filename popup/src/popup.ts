// Import our custom CSS
import "./styles.scss";
import {Collapse} from "bootstrap";

import { COMPONENTS } from "./constants";
import { addLink } from "./links";
import { renderLinks } from "./render";

function prepopulateLongLinkForm(longLinkForm: HTMLInputElement) {
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
      longLinkForm.placeholder = tab.url || "";
    });
  });
}

function updateShortLinkPreview(
  shortLinkForm: HTMLInputElement,
  shortLinkPreview: HTMLElement
) {
  shortLinkPreview.innerHTML = "go/" + shortLinkForm.value;
}

// Display current Go-links—fetched directly from Chrome redirect-rules
// we've set.
chrome.declarativeNetRequest.getDynamicRules(renderLinks);

// Update preview go-link as you type
const shortLinkForm: HTMLInputElement = <HTMLInputElement>(
  document.getElementById(COMPONENTS.shortLinkForm.id)
);
const shortLinkPreview = document.getElementById(
  COMPONENTS.shortLinkPreview.id
);
shortLinkForm.addEventListener("keyup", () => {
  updateShortLinkPreview(shortLinkForm, shortLinkPreview);
});

// Fetch URL of open tab as an optimistic guess
// at the intended longLink
const longLinkForm: HTMLInputElement = <HTMLInputElement>(
  document.getElementById(COMPONENTS.longLinkForm.id)
);
prepopulateLongLinkForm(longLinkForm);

// Listen for button clicks to submit the form
const addButton = document.getElementById(COMPONENTS.addButton.id);
var overwriteWarning = document.getElementById(COMPONENTS.overwriteWarning.id);
const overwriteWarningHandle = new Collapse(overwriteWarning, {toggle: false})
addButton.addEventListener("click", (submitEvent) => {
  overwriteWarningHandle.toggle();
  // Form submission triggers a reload usually—we must prevent this.
  submitEvent.preventDefault() 
  // addLink(shortLinkForm.value, longLinkForm.value || longLinkForm.placeholder);
});
