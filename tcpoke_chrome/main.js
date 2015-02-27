chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create(
      "control-panel.html",
      {
        innerBounds: { width: 1024, height: 768 }
      });
});

