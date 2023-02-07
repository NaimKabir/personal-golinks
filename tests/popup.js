const puppeteer = require('puppeteer');

async function getPopup(options = {}) {

  const { devtools = false, slowMo = false, extensionId} = options;
  const browser = await puppeteer.launch({
    headless: false,
    devtools,
    args: [
      '--disable-extensions-except=./popup/dist',
      '--load-extension=./popup/dist',
    ],
    ...(slowMo && { slowMo }),
  });


  const extPage = await browser.newPage();
  const extensionUrl = `chrome-extension://${extensionId}/index.html`;
  await extPage.goto(extensionUrl, { waitUntil: 'load' });

  return {
    browser,
    extensionUrl,
    extPage,
  };
}

const extensionId =  process.env.CHROME_EXTENSION_ID;

if (!extensionId) {
  throw "Set CHROME_EXTENSION_ID environment variable. This ID should be visible if you loaded this extension unpacked, at chrome://extensions/"
}

getPopup({extensionId: extensionId}).then((result) => {
    console.log(result);
})