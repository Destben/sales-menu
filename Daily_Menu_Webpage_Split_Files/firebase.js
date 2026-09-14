(function () {
  const tracker = window.DailyMenuTracker;

  function connectFirebase() {
    if (!tracker.FIREBASE_CONFIG) {
      tracker.setStatus("LOCAL MODE — each browser has its own data");
      return;
    }

    const appScript = document.createElement("script");
    appScript.src = "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js";

    const dbScript = document.createElement("script");
    dbScript.src = "https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js";

    appScript.onload = () => {
      document.head.appendChild(dbScript);
    };

    dbScript.onload = () => {
      firebase.initializeApp(tracker.FIREBASE_CONFIG);
      tracker.firebaseDb = firebase.database();

      tracker.firebaseDb.ref("tracker/days").on("value", snapshot => {
        tracker.state.days = snapshot.val() || {};

        const date = document.getElementById("date").value || tracker.today();

        if (tracker.state.days[date]) {
          tracker.state.current = tracker.deepCopy(tracker.state.days[date]);
        } else {
          tracker.state.current = tracker.makeBlankDay(date);
        }

        tracker.ui.render();
        tracker.setStatus("LIVE — shared with everyone using this page");
      });
    };

    document.head.appendChild(appScript);
  }

  tracker.firebase = {
    connect: connectFirebase
  };
})();
