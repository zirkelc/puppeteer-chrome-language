import puppeteer, { type Browser, type Page } from "puppeteer";
import os from "os";

type Runner = () => Promise<{ browser: Browser, page: Page }>;

// local system language
const LANG_SYSTEM = Intl.DateTimeFormat().resolvedOptions().locale;

// language to test
const LANG_TEST = 'de'; //! use a different language than your system language

// start a browser instance to read the installed version
const browserVersion = async () => {
  const browser = await puppeteer.launch();
  const version = await browser.version();
  await browser.close();

  return version;
}

// options to set the langauge 
const options: Record<string, Runner> = {
  "cli-args-lang": async () => {
    console.log(`Using --lang=${LANG_TEST}`);

    const args = [...puppeteer.defaultArgs(), `--lang=${LANG_TEST}`];
    const browser = await puppeteer.launch({
      args,
      headless: true,
    });
    const page = await browser.newPage();
    return { browser, page };
  },

  "env-var-lang": async () => {
    console.log(`Using env.LANG=${LANG_TEST}`);

    process.env.LANG = LANG_TEST;
    const browser = await puppeteer.launch({
      headless: true,
      env: {
        LANG: LANG_TEST,
      }
    });
    const page = await browser.newPage();
    return { browser, page };
  },

  "http-accept-language": async () => {
    console.log(`Sending HTTP header Accept-Language: ${LANG_TEST}`);

    const browser = await puppeteer.launch({
      headless: true,
    });

    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'Accept-Language': LANG_TEST,
    });
    return { browser, page };
  },

  "page-override-navigator": async () => {
    console.log(`Overriding navigator.language=${LANG_TEST}`);

    const browser = await puppeteer.launch({
      headless: true,
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
    }, LANG_TEST);
    return { browser, page };
  },

  "cdp-override-network": async () => {
    console.log(`Using CDP Network.setUserAgentOverride(acceptLanguage: ${LANG_TEST})`);

    const browser = await puppeteer.launch({
      headless: true,
    });

    const page = await browser.newPage();
    const cdpSession = await page.createCDPSession();
    cdpSession.send('Network.setUserAgentOverride', {
      userAgent: await browser.userAgent(),
      acceptLanguage: LANG_TEST,
    });

    return { browser, page };
  }
}

// print system and browser information
console.log(`System:   ${os.platform()}/${os.release()}, ${os.arch()}`);
console.log(`Language: ${LANG_SYSTEM}`)
console.log(`Browser:  ${await browserVersion()}`);
console.log();

if (LANG_SYSTEM === LANG_TEST) {
  console.error(`System language "${LANG_SYSTEM}" should be different from "${LANG_TEST}"`);
  process.exit(1);
}

// run each option against browserleaks.com to extract the langauge
for (const [option, run] of Object.entries(options)) {
  try {
    const { browser, page } = await run();

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