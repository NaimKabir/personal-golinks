const domainPrefix = "*://";

export const GO_PREFIX = "go/";
export const PREFIX = domainPrefix + GO_PREFIX;

interface Component {
  id: string;
  defaultClassName: string;
}

export const COMPONENTS: { [key: string]: Component } = {
  addButton: {
    id: "add",
    defaultClassName: "btn btn-primary",
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
