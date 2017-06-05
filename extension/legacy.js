(function () {
  // Promises
  var promises = {}

  // Base64 is used instead of hex
  function base2hex (base) {
    var bin = window.atob(base)
    var hex = ''
    for (var i = 0; i < bin.length; i++) {
      var hexbyte = bin.charCodeAt(i).toString(16)
      hex += (hexbyte.length === 2 ? hexbyte : '0' + hexbyte)
    }
    return hex
  }

  // Convert hex to base64
  function hex2base (str) {
    return window.btoa(String.fromCharCode.apply(null, str.replace(/\r|\n/g, '').replace(/([\da-fA-F]{2}) ?/g, '0x$1 ').replace(/ +$/, '').split(' ')))
  }

  // Turn the incoming message from extension
  // content script into pending Promise resolving
  window.addEventListener('message', function (event) {
    if (event.source !== window) { return }
    var msg = event.data
    // Get the promise
    // XXX: on Firefox, the message sent in content script is for some reason
    // triggering this event as well. So ignore messages that have the origin field
    if (msg.id && msg.id in promises && !msg.hwcrypto && !msg.origin) {
      console.log('HWCRYPTO RECV', event.data)
      var p = promises[msg.id]
      if (msg.error) {
        p.reject(new Error(msg.error === 'CKR_FUNCTION_CANCELED' ? 'user_cancel' : msg.error))
      } else {
        p.resolve(msg)
      }
      delete promises[msg.id]
    } else {
      // console.log('No id in event msg')
    }
  }, false)

  function TokenSigning () {
    var ts = {}
    function nonce () {
      var val = ''
      var hex = 'abcdefghijklmnopqrstuvwxyz0123456789'
      for (var i = 0; i < 16; i++) val += hex.charAt(Math.floor(Math.random() * hex.length))
      return val
    }

    function messagePromise (msg) {
      return new Promise(function (resolve, reject) {
        // amend with necessary metadata
        msg.id = nonce()
        msg.hwcrypto = true
        // send message
        console.log('HWCRYPTO SEND', msg)
        window.postMessage(msg, '*')
        // and store promise callbacks
        promises[msg.id] = {
          resolve: resolve,
          reject: reject
        }
      })
    }
    ts.getCertificate = function (options) {
      var msg = {certificate: {}}
      console.log('getCertificate()')
      return messagePromise(msg).then(function (r) {
        return {hex: base2hex(r.certificate)}
      })
    }
    ts.sign = function (cert, hash, options) {
      console.log('sign()', cert, hash, options)
      var msg = {sign: {certificate: hex2base(cert.hex), hash: hex2base(hash.hex), hashtype: hash.type, lang: options.lang}}
      return messagePromise(msg).then(function (r) {
        return {hex: base2hex(r.signature)}
      })
    }
    ts.getVersion = function () {
      console.log('getVersion()')
      return messagePromise({version: {}}).then(function (r) {
        return r.version
      })
    }
    ts.debug = function () {
      return ts.getVersion().then(function (v) {
        console.log(v)
        return 'Web eID legacy mode/' + v
      })
    }
    ts.use = function () {
      return true
    }
    return ts
  }
  // Override globals
  window.hwcrypto = TokenSigning()
  window.TokenSigning = TokenSigning
}())
