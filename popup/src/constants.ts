export const DOMAIN_PREFIX = "*://";
export const GO_PREFIX = "to/";

interface Component {
  id: string;
  defaultClassName: string;
}

export const COMPONENTS: { [key: string]: Component } = {
  addButton: {
    id: "add",
    defaultClassName: "btn btn-primary",
  },
  overwriteButton: {
    id: "overwrite",
    defaultClassName: "btn btn-danger",
  },
  cancelButton: {
    id: "cancel",
    defaultClassName: "btn btn-secondary",
  },
  overwriteWarning: {
    id: "overwriteWarning",
    defaultClassName: "collapse",
  },
  searchBar: {
    id: "search",
    defaultClassName: "form-control",
  },
  linkCounter: {
    id: "maxLinkWarning",
    defaultClassName: "text-end",
  },
  shortLinkForm: {
    id: "shortLinkForm",
    defaultClassName: "form-control",
  },
  longLinkForm: {
    id: "longLinkForm",
    defaultClassName: "form-control",
  },
  shortLinkPreview: {
    id: "shortLinkHelp",
    defaultClassName: "form-control",
  },
  links: {
    id: "links",
    defaultClassName:
      "list-group-item d-flex justify-content-between align-items-center list-group-item-action",
  },
};
