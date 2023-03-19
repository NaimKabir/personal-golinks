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
  const extensionUrl = `chrome-extension://${extensionId}/index.html`;
  await extPage.goto(extensionUrl, { waitUntil: "load" });

  return extPage;
}

describe("End-to-end tests", () => {
  let extPage;
  beforeAll(async () => {
    const extensionId = process.env.CHROME_EXTENSION_ID;
    await expect(extensionId).toBeDefined();
    extPage = await getPopupPage({ extensionId: extensionId });

  });

  it('should have more than one link added', async () => {
    // To get this to link threshold, quickly add the max number of links to test behavior at this condition
    await extPage.$eval('#shortLinkForm', el => el.value = '1');
    await extPage.$eval('#add', button  =>  {
      button.click()
    });
    await extPage.$eval('#shortLinkForm', el => el.value = '2');
  });
});

// getPopup({ extensionId: extensionId }).then((result) => {
//   console.log(result);
// });
