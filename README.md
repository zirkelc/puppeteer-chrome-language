# Puppeteer Language Experiment

This project tests how the browser language can be changed with [Puppeteer](https://github.com/puppeteer/puppeteer). It implements multiple options to set the language of Chrome and checks each option against [BrowserLeaks](https://browserleaks.com/) to see how it affected the JavaScript proeprties and HTTP headers available by the browser. For more information, see my article [The Puppeteer Language Experiment]() on DEV.to.

## Usage
Clone this repository to your locale machine and install the dependencies with npm. The `puppeteer` package automatically downloads Chrome to a temporary folder.

```sh
npm install
```

Then start the test:

```sh
npm test
```

The test will run each option and print its result:

```txt
System:   darwin/23.1.0, arm64
Language: en-US
Browser:  Chrome/125.0.6422.60

Using --lang=de-DE
        Internationalization Locale: en-GB
        Navigator Language: en-GB
        HTTP Accept-Language: en-GB,en-US;q=0.9,en;q=0.8

Using env.LANG=de-DE
        Internationalization Locale: en-GB
        Navigator Language: en-GB
        HTTP Accept-Language: en-GB,en-US;q=0.9,en;q=0.8

Sending HTTP header Accept-Language: de-DE
        Internationalization Locale: en-GB
        Navigator Language: en-GB
        HTTP Accept-Language: de-DE

Overriding navigator.language=de-DE
        Internationalization Locale: en-GB
        Navigator Language: de-DE
        HTTP Accept-Language: en-GB,en-US;q=0.9,en;q=0.8

Using CDP Network.setUserAgentOverride(acceptLanguage: de-DE)
        Internationalization Locale: en-GB
        Navigator Language: de-DE
        HTTP Accept-Language: de-DE
```

The current implementation uses the locale `de-DE`, but this can be changed by the `LANG_TEST` constant.

## Contribution
If there are other options, which this experiment doesn't cover yet, please feel free to submit a pull request. Furthermore, if you get different results on another operating system or browser version, please let me know and I will include your results in this repository.