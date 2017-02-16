# Browser extension for eID

This is _the_ reference implementation of a **modern desktop browser extension** that utilizes native messaging (available in [Chrome](https://developer.chrome.com/extensions/nativeMessaging), [Firefox](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Native_messaging), [Opera](https://dev.opera.com/extensions/message-passing/#native-messaging) and soon [Edge](https://docs.microsoft.com/en-us/microsoft-edge/extensions/guides/native-messaging)) to talk to on-host native components for interacting with eID hardware (e.g. smart cards or USB tokens).

This allows to use pre-provisioned X509 PKI certificates for signing and authentication, filling the gap left by browser API-s like [WebCryptoAPI](https://www.w3.org/TR/WebCryptoAPI/) and [WebAuthentication](https://www.w3.org/TR/webauthn/) in the process of phasing out legacy technologies such as Java applets and NPAPI plugins.

It is based on the excellent work by [@open-eid/chrome-token-signing](https://github.com/open-eid/chrome-token-signing)

For now, please refer to the [wiki](https://github.com/hwcrypto/hwcrypto-extension/wiki) for developer information.

----

## Available soon

<img src="https://developer.chrome.com/webstore/images/ChromeWebStore_BadgeWBorder_v2_206x58.png"/> <img src="https://dev.opera.com/extensions/branding-guidelines/addons_206x58_en@2x.png" width="206">
