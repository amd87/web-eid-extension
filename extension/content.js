var legacy = false
var port = null

// 2. hwcrypto JS is probably included in the page
var scripts = document.getElementsByTagName('script')
for (var s in scripts) {
  if (scripts[s].src && scripts[s].src.indexOf('hwcrypto') !== -1) {
    legacy = true
  }
}
if (legacy) {
  console.log('Detected inclusion of hwcrypto.js')
}

// Promise wrapper for sendMessage
function sendMessage (msg) {
  if (typeof browser !== 'undefined') {
    // This is FF and returns a promise
    return browser.runtime.sendMessage(msg)
  } else {
    // This is Chrome/Opera
    return new Promise(function (resolve, reject) {
      chrome.runtime.sendMessage(msg, function (response) {
        if (!response) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve(response)
        }
      })
    })
  }
}

// Query extension, if legacy mode is enabled
sendMessage({legacy: legacy, origin: window.location.origin}).then(function (response) {
  // Yep, legacy mode IS enabled
  // Include legacy javascript, if page needs it
  if (response && response.legacy === true) {
    console.log('hwcrypto: legacy mode enabled, injecting script')
      // Inject the legacy JS in page
    var s = document.createElement('script')
    s.type = 'text/javascript'
    s.src = chrome.runtime.getURL('legacy.js');
    (document.head || document.documentElement).appendChild(s)
  }
})

// proxy a port to the app via extension
function fromPage (event) {
  // We only accept messages from ourselves (JS embedded in the page)
  if (event.source !== window) { return }
  // hwcrypto property needed to activate this extension
  // Background page adds extension property with version.
  if (event.data.hwcrypto) {
    if (!port) {
      console.log('OPEN')
      // connect the port
      port = chrome.runtime.connect()
      port.onMessage.addListener(function (message, sender) {
        console.log('RECV', message)
        window.postMessage(message, '*')
      })
      port.onDisconnect.addListener(function () {
        console.log('QUIT')
        port = null
      })
    }
    console.log('SEND', event.data)
    // Only used by extension
    delete event.data['hwcrypto']
    // Add origin information
    event.data['origin'] = window.location.origin
    // forward to backend
    port.postMessage(event.data)
  }
}

// Handle messages from page, towards background, towards app
// Responses are handled by port
window.addEventListener('message', fromPage, false)
