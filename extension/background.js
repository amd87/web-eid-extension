/*
 * Chrome token signing extension
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 */

console.log("Background page activated on " + new Date());

var HELLO_URL = "https://web-eid.com/";
var DEVELOPER_URL = "https://github.com/hwcrypto/hwcrypto-extension/wiki/DeveloperTips";
var UPDATES_URL = "https://updates.web-eid.com/latest.json";

var NATIVE_HOST = "org.hwcrypto.native";

var K_ORIGIN = "origin";
var K_RESULT = "result";
var K_EXTENSION = "extension";

// Stores the longrunning ports per tab
// Used to route all request from a tab to the same host instance
var ports = {};
// Tracks messages to tabs by id field
var id2tab = {};

// if set, native messaging has been detected.
var native_version = null;
var extension_version = chrome.runtime.getManifest().version;

// Firefox does not run onInstalled for extensions
// dropped into extensions folder. Thus do a small hack
function firefox_extension_fixup() {
  if (localStorage["firefox_installed"] != "true") {
    localStorage["updates"] = "true";
    localStorage["firefox_installed"] = "true";
  }
}
typeof browser !== 'undefined' && firefox_extension_fixup();


// Small helper to compare if b is newer than a
function newerVersion(a, b) {
  var current = a.split('.');
  var other = b.split('.');
  for (i = 0; i < Math.min(current.length, other.length); i++) {
    o = parseInt(other[i]);
    c = parseInt(current[i]);
    if (c == o)
      continue;
    return o > c;
  }
  if (other.length > current.length)
    return true;
  return false;
}

// FIXME: when native components are updated, the version
// is not changed and the update gets incorrectly triggered again
function check_for_updates(force = false) {
   if (force || localStorage["updates"] == "true") {
     // Check if the native version could be updated
     fetch(UPDATES_URL).then(function(r) {return r.json();}).then(function(j) {
       console.log("Latest versions: " + JSON.stringify(j));
       console.log("Current versions: extension=" + extension_version + " native=" + native_version);
       // Forward to updating URL if needed
       if ((j.extension && newerVersion(extension_version, j.extension))
           || (j.native && newerVersion(native_version, j.native))) {
         console.log("Update available!");
         // 1) Only to intrusive update notification once every X hours.
         var now = new Date();
         if (force || !localStorage["last_update_notification"] || parseInt(localStorage["last_update_notification"]) < now.getTime()-(3*60*60*1000)) {
           // Mark notification time
           localStorage["last_update_notification"] = now.getTime();
           // Direct to update url
           var url = HELLO_URL + '?update=true&native=' + native_version + '&extension=' + extension_version;
           chrome.tabs.create({ 'url': url});
         } else {
            var hours = Math.round((now.getTime() - parseInt(localStorage["last_update_notification"]))/(60*60*1000));
            console.log("... but not notifying, because last notification was " + hours + " hours ago");
         }
       }
     });
   } else {
     console.log("Update checking disabled. Please enable to be sure to have the latest software!");
   }
}

// Test for presence of native components on extension
// startup. And check for updates, if configured to
_testNativeComponent().then(function (result) {
   // probe was OK, not needed later.
   native_version = result;
   // Check for updates
   check_for_updates();
}).catch(function(r) {
  if (r == "missing") {
    // open landing page if no native components installed
    chrome.tabs.create({ 'url': HELLO_URL + '?lang=' + chrome.i18n.getUILanguage() + "&reason=missing"});
  }
});


// Promise wrapper for sendNativeMessage
function sendNativeMessage(host, msg) {
  if (typeof browser !==  'undefined') {
    // This is FF and returns a promise
    return browser.runtime.sendNativeMessage(host, msg);
  } else {
    // This is Chrome/Opera
    return new Promise(function (resolve, reject) {
      chrome.runtime.sendNativeMessage(host, msg, function (response) {
        if (!response) {
          // error occured
          console.log("sendNativeMessage failed: " + JSON.stringify(chrome.runtime.lastError));
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Check if native implementation is OK resolves with "version" or rejects with "forbidden" (Chrome and Opera only), "missing" or "failing"
function _testNativeComponent() {
  return new Promise(function (resolve, reject) {
    // FF has only host and message and returns a Promise
    sendNativeMessage(NATIVE_HOST, {}).then(function (response) {
      console.log("Connect successful: " + JSON.stringify(response));
      if (response.version) {
        resolve(response.version);
      } else {
        reject("failing");
      }
    }).catch(function (reason) {
      console.log("Connect failed: " + JSON.stringify(reason));
      // Try to be smart and do some string matching on Chrome/Chromium/Opera
      if (reason) {
        const permissions = "Access to the specified native messaging host is forbidden.";
        if (reason.message === permissions) {
          reject("forbidden");
        } else {
          reject("missing");
        }
      } else {
        // Firefox does not give additional information (only on console) why sending failed.
        reject("missing");
      }
    });
  });
}

// When extension is installed, check for native component or direct to helping page
// Firefox adds this event v52 and also calls with a reason "browser_updated"
typeof chrome.runtime.onInstalled !== 'undefined' && chrome.runtime.onInstalled.addListener(function (details) {
  console.log("onInstalled: " + JSON.stringify(details));
  if (details.reason == "install") {
     // Set default options
     // TODO: consider: localStorage["legacy"] = "false";
     localStorage["updates"] = "true";
     localStorage["firefox_installed"] = "true";
  }

  if (details.reason === "install" || details.reason === "update") {
    _testNativeComponent().then(function (result) {
      if (details.reason === "install") {
        // Scenatio: native was installed, extension installed
        // after being forwarded to installer page
        if (typeof browser !== 'undefined') {
           url = HELLO_URL + "?installer=firefox-extension";
           chrome.tabs.create({ 'url': url });
           return;
        }
      }
      // Scenario: extension is auto-updated.
      // Check that native components are the latest as well
      check_for_updates();
    }).catch(function(r) {
      if (result === "forbidden") {
        url = DEVELOPER_URL + "?reason=" + details.reason;
        chrome.tabs.create({ 'url': url });
      }
    });
  }
});

// When message is received from page send it to native
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // Firefox has sender.etensionId, chrome has sender.id
  if (sender.id !== chrome.runtime.id && sender.extensionId !== chrome.runtime.id) {
    console.log('WARNING: Ignoring message not from our extension');
    // Not our extension, do nothing
    return;
  }
  console.log("MSG R: " + JSON.stringify(request));
  if (sender.tab) {
    // Handle internal messages
    if (request.internal) {
      console.log("Processing internal message");
      if (request.legacy_enabled) {
        // Set the browser action badge to signal legacy mode
        chrome.browserAction.setBadgeText({text: "VAN", tabId: sender.tab.id}); // FIXME: i18n
        chrome.browserAction.setBadgeBackgroundColor({color: [255, 0, 0, 128], tabId: sender.tab.id});
        chrome.browserAction.setTitle({title: "Disable legacy mode", tabId: sender.tab.id}); // FIXME: i18n
        return;
      } else if (request.done) {
        console.log("DONE " + sender.tab.id);
        if (sender.tab.id in ports)
          ports[sender.tab.id].disconnect();
          delete ports[sender.tab.id];
        return;
      }
    } else {
      // Normal message, to be passed to native
      id2tab[request.id] = sender.tab.id;
      // Check that we have more than the message id and origin
      if (Object.keys(request).length < 3) {
        // Empty message is used for "PING". Reply with extension version
        return _fail_with(request, "ok");
      }
      if (!native_version) {
        // Extension was installed before native components
        // So test again.
        _testNativeComponent().then(function (result) {
          native_version = result;
          _forward(request);
        }).catch(function(r) {
           return _fail_with(request, "no_implementation");
        });
      } else {
        // Forward to native.
        _forward(request);
      }
    }
  } else {
    console.log("ERROR: Not tab for message " + JSON.stringify(request));
  }
});

// Send the message back to the originating tab
// and delete id2tab mapping
function _reply(msg) {
  msg[K_EXTENSION] = extension_version;
  console.log("MSG S: " + JSON.stringify(msg));
  chrome.tabs.sendMessage(id2tab[msg.id], msg);
  delete id2tab[msg.id];
}

// Fail an incoming message if the underlying implementation is not
// present
function _fail_with(msg, result) {
  var resp = {};
  resp["id"] = msg["id"];
  resp[K_RESULT] = result;
  _reply(resp);
}

// Forward a message to the native component
function _forward(message) {
  var tabid = id2tab[message.id];
  console.log("SEND " + tabid + ": " + JSON.stringify(message));
  // Open a port if necessary
  if (!ports[tabid]) {
    // For some reason there does not seem to be a way to detect missing components from longrunning ports
    // So we probe before opening a new port.
    console.log("OPEN " + tabid + ": " + NATIVE_HOST);
    // create a new port
    const port = chrome.runtime.connectNative(NATIVE_HOST);
    // XXX: does not indicate anything for some reason.
    if (!port) {
      console.log("OPEN ERROR: " + JSON.stringify(chrome.runtime.lastError));
    }
    port.onMessage.addListener(function (response) {
      if (response) {
        console.log("RECV " + tabid + ": " + JSON.stringify(response));
        _reply(response);
      } else {
        console.log("ERROR " + tabid + ": " + JSON.stringify(chrome.runtime.lastError));
        _fail_with(message, "technical_error");
      }
    });
    port.onDisconnect.addListener(function () {
      console.log("QUIT " + tabid);
      delete ports[tabid];
      // TODO: reject all pending promises for tab, if any
    });
    ports[tabid] = port;
    ports[tabid].postMessage(message);
  } else {
    // Port already open
    ports[tabid].postMessage(message);
  }
}


function browser_action(tab) {
  // Check the status of legacy mode in tab
  chrome.browserAction.getBadgeText({tabId: tab.id}, function(label) {
    console.log("Current label in tab " + tab.id + ": " + label);
    if (label == "VAN") { // FIXME: i18n
      // enabled. disabling is always possible
      chrome.tabs.sendMessage(tab.id, {"internal": "true", "disable_legacy":"true"});
      // Next load will not have the legacy flag enabled. Remove badge, but do not reload page
      chrome.browserAction.setBadgeText({text: "", tabId: tab.id});
      chrome.browserAction.setTitle({title: "Enable legacy mode", tabId: tab.id}); // FIXME: i18n
    } else {
      // No lable. Enable, if enabling allowed by config
      if (localStorage["legacy"] === "true") { // FIXME: consider storage.managed as well
        chrome.tabs.sendMessage(tab.id, {"internal": "true", "enable_legacy":"true"});
        chrome.tabs.reload(tab.id);
      } else {
        console.log("Legacy toggle disabled.");
        chrome.runtime.openOptionsPage();
      }
    }
  });
}


// Register page action for Chrome/Chromium/Opera
chrome.browserAction.onClicked.addListener(browser_action);

// Register page action for Firefox
typeof browser !== 'undefined' && browser.browserAction.onClicked.addListener(browser_action);
