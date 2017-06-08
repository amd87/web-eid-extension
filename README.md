# Browser companion for the [Web eID app](https://web-eid.com/app/) · [![Build Status](https://travis-ci.org/web-eid/web-eid-extension.svg?branch=master)](https://travis-ci.org/web-eid/web-eid-extension)

## Available for
[![chrome.google.com](https://github.com/alrra/browser-logos/blob/master/src/chrome/chrome_64x64.png)](https://chrome.google.com/webstore/category/extensions)
[![chrome.google.com](https://github.com/alrra/browser-logos/blob/master/src/chromium/chromium_64x64.png)](https://chrome.google.com/webstore/category/extensions)
[![addons.mozilla.org](https://github.com/alrra/browser-logos/blob/master/src/firefox/firefox_64x64.png)](https://addons.mozilla.org/en-US/firefox/)
[![addons.opera.com](https://github.com/alrra/browser-logos/blob/master/src/opera/opera_64x64.png)](https://addons.opera.com/en/extensions/)
[![Chrome Web Store](https://github.com/alrra/browser-logos/blob/master/src/vivaldi/vivaldi_64x64.png)]()


### Why would you want the extension in addition to the app?
 - on-demand startup of the eID app uses less resources and saves battery time
 - available when your computer is not connected to the internet
 - makes websites use Web eID when signing online ([.ee legacy mode](https://github.com/web-eid/web-eid-extension/wiki/Legacy-Mode) only)
 - notifies you when updates are available for Web eID

## How to install?

Head to [web-eid.com/app](https://web-eid.com/app/) and click the "install extension" button.

## License
- LGPL2.1+
- Please refer to the [wiki](https://github.com/web-eid/web-eid-extension/wiki) for developer information.

This is _the_ reference implementation of a **modern desktop browser extension** that utilizes native messaging (available in [Chrome](https://developer.chrome.com/extensions/nativeMessaging), [Firefox](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Native_messaging), [Opera](https://dev.opera.com/extensions/message-passing/#native-messaging) and soon [Edge](https://docs.microsoft.com/en-us/microsoft-edge/extensions/guides/native-messaging)) to talk to on-host native components for interacting with eID hardware (e.g. smart cards or USB tokens).

This architecture allows to use pre-provisioned X509 PKI certificates for signing and authentication on websites, filling the gap left by browser API-s like [WebCryptoAPI](https://www.w3.org/TR/WebCryptoAPI/) and [WebAuthentication](https://www.w3.org/TR/webauthn/) in the process of phasing out legacy technologies such as Java applets and NPAPI plugins.
