const puppeteer = require("puppeteer");

async function getPopupPage(options = {}) {
  const { devtools = false, slowMo = false, extensionId } = options;
  const browser = await puppeteer.launch({
    headless: false,
    devtools,
    args: [
      "--disable-extensions-except=./popup/dist",
      "--load-extension=./popup/dist",
    ],
    ...(slowMo && { slowMo }),
  });

  const extPage = await browser.newPage();
  const extensionUrl = `chrome-extension://${extensionId}/index.html`
  await extPage.goto(extensionUrl, { waitUntil: "load" });

  return extPage;
}

describe('Google', () => {
    let extPage;
    beforeAll(async () => {
        const extensionId = process.env.CHROME_EXTENSION_ID;
        await expect(extensionId).toBeDefined();
        const popupContext = await getPopup({extensionId: extensionId});

        extPage = popupContext.extPage;
    });
  
    it('should be titled "Google"', async () => {
      await expect(extPage.title()).resolves.toMatch('Google');
    });
});


// getPopup({ extensionId: extensionId }).then((result) => {
//   console.log(result);
// });
