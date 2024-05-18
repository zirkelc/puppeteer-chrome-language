import puppeteer, { type Browser, type Page } from "puppeteer";

type BrowserAndPage = {
  browser: Browser,
  page: Page,
}

const LANG = 'de-DE';

const options: Record<string, (() => Promise<BrowserAndPage>)> = {
  "cli-args-lang": async () => {
    console.log(`Using --lang=${LANG}`);

    const args = [...puppeteer.defaultArgs(), `--lang=${LANG}`];
    const browser = await puppeteer.launch({
      args,
      headless: false,
    });
    const page = await browser.newPage();
    return { browser, page };
  },

  "env-var-lang": async () => {
    console.log(`Using env.LANG=${LANG}`);

    process.env.LANG = LANG;
    const browser = await puppeteer.launch({
      headless: false,
      env: {
        LANG,
      }
    });
    const page = await browser.newPage();
    return { browser, page };
  },

  "http-accept-language": async () => {
    console.log(`Sending HTTP header Accept-Language: ${LANG}`);

    const browser = await puppeteer.launch({
      headless: false,
    });

    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'Accept-Language': LANG,
    });
    return { browser, page };
  },

  "page-override-navigator": async () => {
    console.log(`Overriding navigator.language=${LANG}`);

    const browser = await puppeteer.launch({
      headless: false,
    });

    const page = await browser.newPage();
    await page.evaluateOnNewDocument((lang) => {
      Object.defineProperty(navigator, 'language', {
        get() {
          return lang;
        },
      });
      Object.defineProperty(navigator, 'languages', {
        get() {
          return [lang];
        },
      });
    }, LANG);
    return { browser, page };
  },

  "cdp-override-network": async () => {
    console.log(`Using CDP Network.setUserAgentOverride(acceptLanguage: ${LANG})`);

    const browser = await puppeteer.launch({
      headless: false,
    });

    const page = await browser.newPage();
    const cdpSession = await page.createCDPSession();
    cdpSession.send('Network.setUserAgentOverride', {
      userAgent: await browser.userAgent(),
      acceptLanguage: LANG,
    });

    return { browser, page };
  }
}

for (const [option, startBrowser] of Object.entries(options)) {
  try {
    const { browser, page } = await startBrowser();

    await page.goto('https://browserleaks.com/javascript');

    // same as Intl.DateTimeFormat().resolvedOptions().locale
    const locale = await page.waitForSelector('#js-locale');
    const localeText = await page.evaluate((el) => el?.textContent, locale);

    // same as navigator.language
    const language = await page.waitForSelector('#js-language');
    const languageText = await page.evaluate((el) => el?.textContent, language);

    await page.goto('https://browserleaks.com/ip');

    // same as HTTP Accept-Language header
    const headers = await page.waitForSelector(`#headers`);
    const acceptLanguageText = await page.evaluate((headers) => {
      for (let row of headers?.querySelectorAll('tr') ?? []) {
        const header = row.firstChild?.textContent?.trim();
        if (header === 'Accept-Language')
          return row.lastChild?.textContent?.trim();
      }
      return null;
    }, headers);

    console.log(`\tInternationalization Locale: ${localeText}`);
    console.log(`\tNavigator Language: ${languageText}`);
    console.log(`\tHTTP Accept-Language: ${acceptLanguageText}`);
    console.log();

    await browser.close();
  } catch (error) {
    console.error(`Error during ${option}`, error);
  }
}