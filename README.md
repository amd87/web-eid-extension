# Available soon\* for
[![chrome.google.com](https://github.com/alrra/browser-logos/blob/master/src/chrome/chrome_64x64.png)](https://chrome.google.com/webstore/category/extensions)
[![chrome.google.com](https://github.com/alrra/browser-logos/blob/master/src/chromium/chromium_64x64.png)](https://chrome.google.com/webstore/category/extensions)
[![addons.mozilla.org](https://github.com/alrra/browser-logos/blob/master/src/firefox/firefox_64x64.png)](https://addons.mozilla.org/en-US/firefox/)
[![addons.opera.com](https://github.com/alrra/browser-logos/blob/master/src/opera/opera_64x64.png)](https://addons.opera.com/en/extensions/)
[![Windows store](https://github.com/alrra/browser-logos/blob/master/src/edge/edge_64x64.png)](https://www.microsoft.com/en-us/store/collections/EdgeExtensions/pc/)
[![Chrome Web Store](https://github.com/alrra/browser-logos/blob/master/src/vivaldi/vivaldi_64x64.png)](https://help.vivaldi.com/article/extensions/)

<sub>\*ETA [06 March 2017](https://github.com/hwcrypto/hwcrypto-extension/milestone/1). Edge support depends on a [future release by Microsoft](https://www.microsoft.com/en-us/windows/upcoming-features) ([more info](http://www.theverge.com/2017/1/2/14146182/microsoft-windows-10-creators-update-april-release-date)). Safari works with a different technology (in works). Similar legacy plugins for legacy browsers (IE) available elsewhere.</sub>

----

# Browser extension for eID · [![Build Status](https://travis-ci.org/hwcrypto/hwcrypto-extension.svg?branch=master)](https://travis-ci.org/hwcrypto/hwcrypto-extension)

This is _the_ reference implementation of a **modern desktop browser extension** that utilizes native messaging (available in [Chrome](https://developer.chrome.com/extensions/nativeMessaging), [Firefox](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Native_messaging), [Opera](https://dev.opera.com/extensions/message-passing/#native-messaging) and soon [Edge](https://docs.microsoft.com/en-us/microsoft-edge/extensions/guides/native-messaging)) to talk to on-host native components for interacting with eID hardware (e.g. smart cards or USB tokens).

[This architecture](https://hwcrypto.github.io/#architecture-overview) allows to use pre-provisioned X509 PKI certificates for signing and authentication on websites, filling the gap left by browser API-s like [WebCryptoAPI](https://www.w3.org/TR/WebCryptoAPI/) and [WebAuthentication](https://www.w3.org/TR/webauthn/) in the process of phasing out legacy technologies such as Java applets and NPAPI plugins.

For now, please refer to the [wiki](https://github.com/hwcrypto/hwcrypto-extension/wiki) for developer information.

## Architecture
Components of the extension

![hwcrypto-extension](http://i.imgur.com/VIBQ1XU.png)
