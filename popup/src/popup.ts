// Import our custom CSS
import "./styles.scss";

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
  document.getElementById("shortLinkForm")
);
const shortLinkPreview = document.getElementById("shortLinkHelp");
shortLinkForm.addEventListener("keyup", () => {
  updateShortLinkPreview(shortLinkForm, shortLinkPreview);
});

// Fetch URL of open tab as an optimistic guess
// at the intended longLink
const longLinkForm: HTMLInputElement = <HTMLInputElement>(
  document.getElementById("longLinkForm")
);
prepopulateLongLinkForm(longLinkForm);

// Listen for button clicks to submit the form
const addButton = document.getElementById("add");
addButton.addEventListener("click", () => {
  addLink(shortLinkForm.value, longLinkForm.placeholder || longLinkForm.value);
});
