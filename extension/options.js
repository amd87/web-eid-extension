var ext = chrome.extension.getBackgroundPage()

document.addEventListener('DOMContentLoaded', function () {
  chrome.storage.sync.get({legacy: false, updates: false, toggle: false}, function (values) {
    ext.console.log('The current options are: ', values)
    document.getElementById('updates').checked = values.updates
    document.getElementById('legacy').checked = values.legacy
    document.getElementById('toggle').checked = values.toggle
  })
  ext.console.log('Options loaded')
})

function flip (event) {
  console.log(event)
  var name = event.target.id
  if (event.target.checked) {
    ext.console.log('Saving')
    var v = {}
    v[name] = true
    chrome.storage.sync.set(v, function () {
      if (chrome.runtime.lastError) {
        ext.console.log('Could not save: ', chrome.runtime.lastError)
      }
    })
  } else {
    ext.console.log('Deleting', name)
    chrome.storage.sync.remove(name)
  }
  ext.console.log('Changed ' + name + ' to: ' + event.target.checked)
}

document.getElementById('legacy').addEventListener('change', flip)
document.getElementById('toggle').addEventListener('change', flip)
document.getElementById('updates').addEventListener('change', flip)

document.getElementById('showadvanced').addEventListener('click', function (event) {
  var d = document.getElementById('advanced')
  if (d.style.display === 'none') {
    d.style.display = 'block'
    event.target.innerText = 'Hide advanced options' // FIXME: i18n
  } else {
    d.style.display = 'none'
    event.target.innerText = 'Show advanced options' // FIXME: i18n
  }
})

document.getElementById('checknow').addEventListener('click', function (event) {
  ext.checkForUpdates(true)
})
