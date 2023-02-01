// Import our custom CSS
import "./styles.scss";
import { Collapse } from "bootstrap";

import { COMPONENTS, GO_PREFIX } from "./constants";
import { linkAlreadyExists, addLink, initStorage, getLinkCount } from "./links";
import {
  renderAddLinkButton,
  renderLinks,
  setSearchFilter,
  renderLinkCounter,
} from "./render";

function addLinkAndRender(shortLink: string, longLink: string) {
  addLink(GO_PREFIX + shortLink, longLink);
  renderLinkCounter(getLinkCount());
}

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
  shortLinkPreview.innerHTML = GO_PREFIX + shortLinkForm.value;
}

function handleAddSubmit(
  shortLinkForm: HTMLInputElement,
  longLinkForm: HTMLInputElement,
  addButton: HTMLButtonElement,
  overwriteWarningHandle: Collapse,
  submitEvent: MouseEvent | KeyboardEvent
) {
  if (linkAlreadyExists(shortLinkForm.value)) {
    addButton.className = COMPONENTS.addButton.defaultClassName + " disabled";
    overwriteWarningHandle.show();
    submitEvent.preventDefault(); // prevent form-submission and page reload
  } else {
    addLinkAndRender(
      shortLinkForm.value,
      longLinkForm.value || longLinkForm.placeholder
    );
  }
}

var overwriteWarning = document.getElementById(COMPONENTS.overwriteWarning.id);
const overwriteWarningHandle = new Collapse(overwriteWarning, {
  toggle: false,
});

// Update preview go-link as you type
const shortLinkForm: HTMLInputElement = <HTMLInputElement>(
  document.getElementById(COMPONENTS.shortLinkForm.id)
);
const shortLinkPreview = document.getElementById(
  COMPONENTS.shortLinkPreview.id
);

// Fetch URL of open tab as an optimistic guess
// at the intended longLink
const longLinkForm: HTMLInputElement = <HTMLInputElement>(
  document.getElementById(COMPONENTS.longLinkForm.id)
);
prepopulateLongLinkForm(longLinkForm);

function returnToDefaultButtonState() {
  renderAddLinkButton();
  overwriteWarningHandle.hide();
}

// We expose a separate "overwrite" button in case the shortLink submitted already
// exists
const overwriteButton = document.getElementById(COMPONENTS.overwriteButton.id);
overwriteButton.addEventListener("click", (_) => {
  addLinkAndRender(
    shortLinkForm.value,
    longLinkForm.value || longLinkForm.placeholder
  );
});

const cancelButton = document.getElementById(COMPONENTS.cancelButton.id);
cancelButton.addEventListener("click", (submitEvent) => {
  returnToDefaultButtonState();
  submitEvent.preventDefault(); // prevent form-submission and page reload
});

const searchBar: HTMLInputElement = <HTMLInputElement>(
  document.getElementById(COMPONENTS.searchBar.id)
);
searchBar.addEventListener("keyup", (_) => {
  setSearchFilter(searchBar.value);
  renderLinks();
});

renderLinks();

// Listen for button clicks to submit the form.
// Button state is heavily reliant on whether we've
// loaded data into cache—so we explicitly wait before
// rendering it
initStorage().then(() => {
  const addButton = renderAddLinkButton();
  addButton.addEventListener("click", (submitEvent) => {
    handleAddSubmit(
      shortLinkForm,
      longLinkForm,
      addButton,
      overwriteWarningHandle,
      submitEvent
    );
    renderAddLinkButton();
  });

  shortLinkForm.addEventListener("keyup", (keyEvent) => {
    if (keyEvent.key == "Enter") {
      handleAddSubmit(
        shortLinkForm,
        longLinkForm,
        addButton,
        overwriteWarningHandle,
        keyEvent
      );
    } else {
      updateShortLinkPreview(shortLinkForm, shortLinkPreview);
      returnToDefaultButtonState();
    }
  });
});

