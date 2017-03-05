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

var inuse = false;

// Check if legacy mode is enabled for this site
if (localStorage["hwcrypto.legacy"] == "true") {
    console.log("hwcrypto: legacy mode enabled, injecting scripts");
    // Signal background page to enable the badge for this site
    chrome.runtime.sendMessage({"internal": true, "legacy_enabled": "true"});
    // Inject the legacy JS in page
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.src = chrome.runtime.getURL("legacy.js");
    (document.head || document.documentElement).appendChild(s);
}


function message_from_page(event) {
    // We only accept messages from ourselves (JS embedded in the page)
    if (event.source !== window)
        return;

    // hwcrypto property needed to activate this extension
    // Background page adds extension property with version.
    if (!event.data.extension && event.data.hwcrypto) {
        // add origin information and forward to background.js
        event.data["origin"] = location.origin;
        // FF returns a promise, filled with response (or null)
        // TODO: use the possibility to process the response
        chrome.runtime.sendMessage(event.data, function(response) {});

        // Only add unload handler if extension has been used
        if (!inuse) {
            // close the native component if page unloads
            window.addEventListener("beforeunload", function(event) {
                chrome.runtime.sendMessage({"internal": true, "done": true});
            }, false);
            inuse = true;
        }
    }
}

function message_from_backend(request, sender, sendResponse) {
    if (request.internal) {
        // Process extension-internal message
        if (request.enable_legacy) {
            console.log("hwcrypto: enabling legacy mode");
            localStorage["hwcrypto.legacy"] = "true";
        } else if (request.disable_legacy) {
            console.log("hwcrypto: disabling legacy mode");
            localStorage.removeItem("hwcrypto.legacy");
        }
    } else {
        // Message is intended to page
        window.postMessage(request, "*");
    }
}

// Register message handlers

// Handle messages from page, towards background
window.addEventListener("message", message_from_page , false);

// Handle messages from extension background
chrome.runtime.onMessage.addListener(message_from_backend);
