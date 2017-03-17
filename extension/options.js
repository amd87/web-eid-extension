document.addEventListener('DOMContentLoaded', function() {
   chrome.extension.getBackgroundPage().console.log("The current options are: " + JSON.stringify(localStorage));
   document.getElementById('legacy').checked = localStorage["legacy"] === "true";
   document.getElementById('updates').checked = localStorage["updates"] === "true";
});

function flip(name, event) {
   if (event.target.checked) {
      localStorage[name] = "true";
   } else {
      localStorage.removeItem(name);
   }
   chrome.extension.getBackgroundPage().console.log("Changed " + name + " to: " + event.target.checked);
}

document.getElementById('legacy').addEventListener('change', function(event) {flip("legacy", event);});
document.getElementById('legacy_toggle').addEventListener('change', function(event) {flip("legacy_toggle", event);});
document.getElementById('updates').addEventListener('change', function(event) {flip("updates", event);});
document.getElementById('showadvanced').addEventListener('click', function(event) {
   var d = document.getElementById('advanced');
   if (d.style.display == "none") {
      d.style.display = "block";
      event.target.innerText = "Hide advanced options"; // FIXME: i18n
   } else {
      d.style.display = "none";
      event.target.innerText = "Show advanced options"; // FIXME: i18n
   }
});

document.getElementById('checknow').addEventListener('click', function(event) {
   chrome.extension.getBackgroundPage().check_for_updates(true);
});
document.getElementById('save').addEventListener('click', function(event) {
   window.close();
});