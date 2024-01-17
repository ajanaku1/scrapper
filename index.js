//import puppeteer and needed plugins
const puppeteer = require("puppeteer-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth");
const adBlocker = require("puppeteer-extra-plugin-adblocker");
const puppeteerCaptchaSolver = require("puppeteer-captcha-solver");
const AnonymizeUAPlugin = require("puppeteer-extra-plugin-anonymize-ua");

//use plugings
puppeteer.use(stealthPlugin());
puppeteer.use(adBlocker());
puppeteer.use(AnonymizeUAPlugin());

//take user input
let search = process.argv[2];

if (!search) {
  console.error("Please provide a search item as a command line argument.");
  process.exit(1);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 600 });
  await page.goto("https://www.amazon.com/", {
    waitUntil: "domcontentloaded",
  });

  puppeteer.use(
    puppeteerCaptchaSolver.autoSolve({
      page: page,
      config: {
        turnstile: true,
      },
    })
  );

  await page.waitForSelector("#twotabsearchtextbox");
  await page.type("#twotabsearchtextbox", search, { delay: 100 });

  const searchResultSelector = ".s-suggestion-container";
  await page.waitForSelector(searchResultSelector);
  await page.click(searchResultSelector);
  await page.waitForSelector(
    ".a-section.a-spacing-small.puis-padding-left-small.puis-padding-right-small"
  );

  const shoeNames = await page.$$eval(
    ".a-section.a-spacing-small.puis-padding-left-small.puis-padding-right-small .a-size-base-plus.a-color-base.a-text-normal",
    (shoeNames) => {
      return shoeNames.map((name) => name.textContent);
    }
  );
  const shoePrices = await page.$$eval(
    ".a-section.a-spacing-small.puis-padding-left-small.puis-padding-right-small .a-price-whole",
    (shoePrices) => {
      return shoePrices.map((price) => price.textContent);
    }
  );

  const result = {};
  for (let i = 0; i < shoeNames.length; i++) {
    result[shoeNames[i]] = shoePrices[i];
  }

  console.log(result);

  await browser.close();
})();
