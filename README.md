# ![icon32](https://user-images.githubusercontent.com/4506277/205959569-52bbb2ca-a204-4c8f-84d2-6c16b9948985.png) Personal Shortlinks

A personal link-shortener that works entirely within your browser, inspired by [Go-links](https://www.golinks.io/).

So this can work alongside Go-links, this uses the prefix `to/` for all short-links.

This extension is compliant with Google's new Manifest V3, so it should be able to stay on the webstore for a while 😅.

## Usage

### Add a short-link

If you're on a page you'd like a short-link to, simply click on the extension and it should pre-fill it as the destination.


https://user-images.githubusercontent.com/4506277/226170784-f17668dc-7153-4d05-8d9b-146093bd07bd.mov


If you'd like to link somewhere else entirely, feel free to edit this pre-filled value. This can even work for deep-links into applications. For example, I use Joplin, and I can open a Joplin page with a URI like `joplin://x-callback-url/openFolder?id=example`. Note: this won't work for file URIs because of Chrome permissioning.

Tap enter or click submit, and you'll see your new short-link!

_There is a limit of 4000 links._

### Use a short-link

Simply type a short-link into your browser, and you'll be redirected to the destination.

### Remove a short-link

To remove a short-link, click the trash can icon next to it.


https://user-images.githubusercontent.com/4506277/226171017-d1537cab-8286-412d-8ea9-680ab657da51.mov


### Search

You can search your short-links by typing into the search bar. The list of links will update automatically as you type.

### Overwrite a short-link

If you type in a short-link you've already used, you'll get a warning and the option to overwrite your link.

You can either cancel or go ahead and overwrite.


https://user-images.githubusercontent.com/4506277/226170877-60d976a2-42e9-4db2-bfe6-95d78239ad1f.mov



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
