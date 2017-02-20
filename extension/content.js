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

// Forward the message from hwcrypto.js to background.js
window.addEventListener("message", function(event) {
    // We only accept messages from ourselves (JS embedded in the page)
    if (event.source !== window)
        return;

    // Background page adds extension with version.
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
                chrome.runtime.sendMessage({type: 'DONE'});
            }, false);
            inuse = true;
        }
    }
}, false);

// post messages from extension (background.js) to page
// TODO: remove
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    window.postMessage(request, "*");
});
