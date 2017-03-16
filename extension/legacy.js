// Promises
var _eid_promises = {};

// Base64 is used instead of hex now.
function base2hex(base) {
   var bin = atob(base);
   var hex = '';
   for (var i = 0; i < bin.length; i++ ) {
     var hexbyte = bin.charCodeAt(i).toString(16)
     hex += (hexbyte.length == 2 ? hexbyte : '0' + hexbyte);
   }
   return hex;
}

// Convert hex to base64
function hex2base(str) {
  return btoa(String.fromCharCode.apply(null,
    str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" "))
  );
}

// Turn the incoming message from extension
// into pending Promise resolving
window.addEventListener("message", function(event) {
    if(event.source !== window)
        return;
    if(event.data.extension) {
        console.log("Page received: ");
        console.log(event.data);
        // Get the promise
        if(event.data.id) {
            var p = _eid_promises[event.data.id];
            // resolve
            if(event.data.result === "ok") {
                if(event.data.signature !== undefined) {
                    p.resolve({hex: base2hex(event.data.signature)});
                } else if(event.data.version !== undefined) {
                    p.resolve(event.data.extension + "/" + event.data.version);
                } else if(event.data.cert !== undefined) {
                    p.resolve({hex: base2hex(event.data.cert)});
                } else {
                    console.log("No idea how to handle message");
                    console.log(event.data);
                }
            } else {
                // reject
                p.reject(new Error(event.data.result));
            }
            delete _eid_promises[event.data.id];
        } else {
            console.log("No id in event msg");
        }
    }
}, false);


function TokenSigning() {


    function nonce() {
        var val = "";
        var hex = "abcdefghijklmnopqrstuvwxyz0123456789";
        for(var i = 0; i < 16; i++) val += hex.charAt(Math.floor(Math.random() * hex.length));
        return val;
    }

    function messagePromise(msg) {
        return new Promise(function(resolve, reject) {
            // amend with necessary metadata
            msg["id"] = nonce();
            msg["hwcrypto"] = true;

            // send message
            window.postMessage(msg, "*");
            // and store promise callbacks
            _eid_promises[msg.id] = {
                resolve: resolve,
                reject: reject
            };
        });
    }
    this.getCertificate = function(options) {
        var msg = {type: "CERT", lang: options.lang};
        console.log("getCertificate()");
        return messagePromise(msg);
    };
    this.sign = function(cert, hash, options) {
        var msg = {type: "SIGN", cert: hex2base(cert.hex), hash: hex2base(hash.hex), hashtype: hash.type, lang: options.lang};
        console.log("sign()");
        return messagePromise(msg);
    };
    this.getVersion = function() {
        console.log("getVersion()");
        return messagePromise({
            type: "VERSION"
        });
    };
}
