// Creates a custom DevTools panel where we manage and run snippets
chrome.devtools.panels.create(
  "Console Rules",
  "",
  "panel/panel.html",
  function () {}
);

