document.addEventListener('DOMContentLoaded', function() {
   chrome.extension.getBackgroundPage().console.log("The current store is " + JSON.stringify(localStorage));
   document.getElementById('legacy').checked = localStorage["legacy"] === "true";
});

document.getElementById('legacy').addEventListener('change', function(event) {
   if (event.target.checked) {
      localStorage["legacy"] = "true";
   } else {
      localStorage.removeItem("legacy");
   }
   chrome.extension.getBackgroundPage().console.log("Changed option to: " + event.target.checked);
   chrome.extension.getBackgroundPage().console.log("The new store is " + JSON.stringify(localStorage));
});
