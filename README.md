# ![icon32](https://user-images.githubusercontent.com/4506277/205959569-52bbb2ca-a204-4c8f-84d2-6c16b9948985.png) personal-golinks

Go-links completely managed in a browser extension.

There is a limit of 4000 links.

<details>

<summary>

### For developers

</summary>

This is a Chrome extension using Manifest V3. We take advantage of Chrome's [DeclarativeNetRequest API](https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/) to redirect requests to custom short-links.

### Development

Entrypoint is `./popup/src/popup.ts`. You can explore dependencies and logic best from there, but a gist:

- `./popup/src/constants.ts` contains globally useful prefixes, as well as a mapping from HTML components and their IDs to a Typescript-readable object.
- `./popup/src/render.ts` manages rendering dynamic elements like the shortlink list
- `./popup/src/links.ts` manages mutations: adding and removing links, and the internal memory management required to do that

### Bundling

This project is bundled with [Webpack](https://webpack.js.org/concepts/). To re-build as you edit, try:

`npx webpack`

This will trigger a job that will watch for changes and rebuild any time you save.

### Styling

This extension is styled using [Bootstrap](https://getbootstrap.com/docs/5.2/getting-started/introduction/) pre-sets.

### Conventions

To format code:
`npx prettier --write .`

</details>

## References

- [Ian Fisher's Personal Go-links blog post](https://iafisher.com/blog/2020/10/golinks) inspired this, but we have strayed far from this design and made it self-contained within the browser, rather than requiring a server.
- [Chrome DeclarativeNetRequest API](https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/)
- [Chrome Action API](https://developer.chrome.com/docs/extensions/reference/action/)
- [Webpack Documentation](https://webpack.js.org/concepts/)
- [Bootstrap Documentation](https://getbootstrap.com/docs/5.2/getting-started/introduction/)
- [favicon.io](https://favicon.io/) for favicon generation. Shout out to [@johnsorrentino](https://twitter.com/johnsorrentino) for this nice quick tool.
