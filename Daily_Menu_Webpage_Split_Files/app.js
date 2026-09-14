(function () {
  /*
    SHARED ONLINE MODE:
    Replace null with your Firebase Web App configuration.

    Example:
    const FIREBASE_CONFIG = {
      apiKey: "...",
      authDomain: "...",
      databaseURL: "https://YOUR-PROJECT-default-rtdb.firebaseio.com",
      projectId: "...",
      storageBucket: "...",
      messagingSenderId: "...",
      appId: "..."
    };
  */
  const FIREBASE_CONFIG = null;

  window.DailyMenuTracker = window.DailyMenuTracker || {};
  window.DailyMenuTracker.FIREBASE_CONFIG = FIREBASE_CONFIG;

  function init() {
    if (!window.DailyMenuTracker.state) {
      console.warn("Tracker state module has not loaded yet.");
      return;
    }

    window.DailyMenuTracker.loadLocal();
    window.DailyMenuTracker.ui.bindEvents();
    window.DailyMenuTracker.ui.render();
    window.DailyMenuTracker.firebase.connect();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
