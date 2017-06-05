console.log('Background page activated on ' + new Date())

var DOWNLOAD_URL = 'https://web-eid.com/app/'
var UPDATES_URL = 'https://updates.web-eid.com/latest.json'
var NATIVE_HOST = 'com.web_eid.app'

// current extension version
var extensionVersion = chrome.runtime.getManifest().version

// Running in Firefox TODO: same in Edge
var isFirefox = typeof browser !== 'undefined'

// Small helper to compare if b is newer than a
function newerVersion (a, b) {
  var current = a.split('.')
  var other = b.split('.')
  for (let i = 0; i < Math.min(current.length, other.length); i++) {
    let o = parseInt(other[i])
    let c = parseInt(current[i])
    if (c === o) { continue }
    return o > c
  }
  if (other.length > current.length) { return true }
  return false
}

// Convert a dictionary to a query string
function d2q (d) {
  let r = []
  for (let v in d) {
    r.push(encodeURIComponent(v) + '=' + encodeURIComponent(d[v]))
  }
  return r.join('&')
}

// Check for updates. If force is true, open the url even if notification
// was done in last X hours
function checkForUpdates (force = false) {
  checkForApp().then(function (appVersion) {
    window.fetch(UPDATES_URL).then(function (r) { return r.json() }).then(function (j) {
      console.log('Latest versions: ' + JSON.stringify(j))
      console.log('Current versions: extension=' + extensionVersion + ' app=' + appVersion)
      // Only check for app updates. Extensions are handled by browser
      if (j.app && newerVersion(appVersion, j.app)) {
        chrome.storage.local.get({lastNotification: -1}, function (values) {
          var now = new Date()
          if (force || values.lastNotification < (now.getTime() - (3 * 60 * 60 * 1000))) { // 3 hours
             // Save notification time
            chrome.storage.local.set({lastNotification: now.getTime()})
            var d = {update: true, app: appVersion, extension: extensionVersion}
            var url = DOWNLOAD_URL + '?' + d2q(d)
            chrome.tabs.create({'url': url})
          }
        })
      }
    })
  })
}

// Promise wrapper for sendNativeMessage
function sendNativeMessage (host, msg) {
  if (isFirefox) {
    // This is FF and returns a promise
    return browser.runtime.sendNativeMessage(host, msg)
  } else {
    // This is Chrome/Opera
    return new Promise(function (resolve, reject) {
      chrome.runtime.sendNativeMessage(host, msg, function (response) {
        if (!response) {
          // error occured
          console.log('sendNativeMessage failed: ' + chrome.runtime.lastError.message)
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve(response)
        }
      })
    })
  }
}

// When extension is installed, check for app or direct to helping page if missing
// Firefox adds this event v52 and also calls with a reason "browser_updated"
typeof chrome.runtime.onInstalled !== 'undefined' && chrome.runtime.onInstalled.addListener(function (details) {
  console.log('onInstalled: ' + JSON.stringify(details))
  if (details.reason === 'install') {
     // Set default options
    chrome.storage.sync.set({legacy: true, updates: true, toggle: true})
  }
})

// internal messages
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // Firefox has sender.etensionId, chrome has sender.id
  if (sender.id !== chrome.runtime.id && sender.extensionId !== chrome.runtime.id) {
    console.log('WARNING: Ignoring message not from our extension')
    // Not our extension, do nothing
    return
  }
  var origin = new window.URL(sender.url || sender.tab.url).origin // XXX FF has sender.url, Chrome has sender.tab.url

  console.log('INTERNAL', sender.tab.id, JSON.stringify(request), sender)
  // Page asks if legacy script should be injected for the origin
  var v = {}
  v[request.origin] = true
  v.legacy = false
  chrome.storage.sync.get(v, function (values) {
    console.log('legacy conf', values)
    // If page should get legacy, we enable it unless explicitly disabled
    if (values.legacy && (request.legacy && values[request.origin])) {
      console.log('Enabling legacy mode for ', origin)
      // Set the browser action badge to signal legacy mode
      chrome.browserAction.setBadgeText({text: 'XXX', tabId: sender.tab.id})
      chrome.browserAction.setBadgeBackgroundColor({color: [255, 0, 0, 128], tabId: sender.tab.id})
      chrome.browserAction.setTitle({title: 'Disable legacy mode', tabId: sender.tab.id}) // FIXME: i18n
      sendResponse({legacy: true})
    }
  })
  return true
})

function browserButtonAction (tab) {
  var origin = new window.URL(tab.url).origin
  // Check the status of legacy mode in tab
  chrome.browserAction.getBadgeText({tabId: tab.id}, function (label) {
    console.log('Current label in tab ' + tab.id + ': ' + label)
    if (label === 'XXX') {
      // Currently enabled, disable explicitly
      var v = {}
      v[origin] = false
      chrome.storage.sync.set(v, function () {
        // Next load will not have the legacy flag enabled. Remove badge, but do not reload page
        chrome.browserAction.setBadgeText({text: '', tabId: tab.id})
        // TODO: only if toggle is enabled.
        chrome.browserAction.setTitle({title: 'Enable legacy mode', tabId: tab.id}) // FIXME: i18n
        console.log('Disabled legacy mode for ', origin)
      })
    } else {
      // No label. Enable, if enabling allowed by config
      chrome.storage.sync.get({legacy: true, toggle: false}, function (values) {
        if (values.legacy && values.toggle) {
          var v = {}
          v[origin] = true
          chrome.storage.sync.set(v, function () {
            console.log('enabled legacy mode for ', origin)
            chrome.tabs.reload(tab.id)
          })
        } else {
          console.log('Legacy or legacy toggle disabled.')
          chrome.runtime.openOptionsPage()
        }
      })
    }
  })
}

// Proxy a new port to the app
function newConnection (port) {
  console.log('PAGE NEW', port.sender.tab.id)
  port.native = chrome.runtime.connectNative(NATIVE_HOST)
  port.native.onDisconnect.addListener(function () {
    console.log('NATIVE QUIT', port.sender.tab.id)
    port.native = null
    port.disconnect()
  })
  port.native.onMessage.addListener(function (message) {
    console.log('NATIVE RECV', port.sender.tab.id, message)
    console.log('PAGE SEND', port.sender.tab.id, message)
    port.postMessage(message)
  })

  port.onMessage.addListener(function (message) {
    console.log('PAGE RECV', port.sender.tab.id, message)
    if (!port.native) {
      port.postMessage({id: message.id, error: 'missing'})
    } else {
      // Activate icon on tab
      chrome.browserAction.setIcon({tabId: port.sender.tab.id, path: {32: 'icon32.png', 128: 'icon128.png'}})
      // Add user agent
      message['user-agent'] = window.navigator.userAgent
      console.log('NATIVE SEND', port.sender.tab.id, message)
      port.native.postMessage(message)
    }
  })
  port.onDisconnect.addListener(function () {
    console.log('PAGE QUIT', port.sender.tab.id)
    // TODO: promise in Firefox, callback in chrome
    chrome.browserAction.setIcon({tabId: port.sender.tab.id, path: {32: 'inactive-icon32.png', 128: 'inactive-icon128.png'}}, function () {
      // Ignore errors when tab is closed
      console.log('Icon set')
    })
    if (port.native) {
      port.native.disconnect()
    }
  })
}

// load options

// register content script connections
chrome.runtime.onConnect.addListener(newConnection)

// Register page action for Chrome/Chromium/Opera
chrome.browserAction.onClicked.addListener(browserButtonAction)

// Register page action for Firefox
isFirefox && browser.browserAction.onClicked.addListener(browserButtonAction)

// Set the default inactive icon
chrome.browserAction.setIcon({path: {32: 'inactive-icon32.png', 128: 'inactive-icon128.png'}})

function checkForApp () {
  return sendNativeMessage(NATIVE_HOST, {id: '1', origin: chrome.runtime.getURL('/'), version: {}}).then(function (v) {
    console.log('Web eID app version:', v.version)
    return v.version
  }).catch(function (reason) {
    console.error('Failed to detect app', reason)
    // Failed. Direct to missing
    var url = DOWNLOAD_URL + '?' + d2q({missing: true})
    chrome.tabs.create({'url': url})
  })
}

// Check for updates on startup
checkForUpdates()
