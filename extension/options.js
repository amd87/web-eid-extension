document.addEventListener('DOMContentLoaded', function() {
   chrome.extension.getBackgroundPage().console.log("The current store is " + JSON.stringify(localStorage));
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
document.getElementById('updates').addEventListener('change', function(event) {flip("updates", event);});
document.getElementById('showadvanced').addEventListener('click', function(event) {
   var d = document.getElementById('advanced');
   d.style.display = (d.style.display == "none" ? "block" : "none");
});

document.getElementById('checknow').addEventListener('click', function(event) {
   chrome.extension.getBackgroundPage().check_for_updates(true);
});
