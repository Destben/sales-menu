(function () {
  const tracker = window.DailyMenuTracker;

  function addPeople(count = 1) {
    for (let i = 0; i < count; i++) {
      tracker.state.current.people.push(tracker.blankPerson());
    }
    tracker.saveLocal();
    tracker.ui.render();
  }

  function removeLastPerson() {
    if (tracker.state.current.people.length <= 1) {
      alert("Keep at least one person on the day.");
      return;
    }

    tracker.state.current.people.pop();
    tracker.saveLocal();
    tracker.ui.render();
  }

  function resetTallies() {
    if (!confirm("Reset every tally for today? Names will remain.")) return;

    tracker.state.current.people.forEach(person => {
      tracker.CATEGORIES.forEach(category => person[category] = 0);
    });

    tracker.saveLocal();
    tracker.ui.render();
  }

  function saveFieldsFromPage() {
    const ids = [
      "nps", "rank", "mobileClose", "fiscalClose",
      "xmGoal", "rguGoal", "gpGoal", "accGoal",
      "special", "specialGoal", "notes"
    ];

    tracker.state.current.date = document.getElementById("date").value || tracker.today();

    ids.forEach(id => {
      tracker.state.current[id] = document.getElementById(id).value;
    });
  }

  async function saveDay() {
    saveFieldsFromPage();
    tracker.ensurePeople();

    tracker.state.days[tracker.state.current.date] = tracker.deepCopy(tracker.state.current);
    tracker.saveLocal();

    if (tracker.firebaseDb) {
      await tracker.firebaseDb.ref(`tracker/days/${tracker.state.current.date}`).set(tracker.state.current);
      tracker.setStatus("LIVE — saved and shared with everyone");
    } else {
      tracker.setStatus("Saved locally — connect Firebase for shared live data");
    }

    tracker.ui.renderOverall();
  }

  function newDay() {
    saveFieldsFromPage();

    tracker.state.current = tracker.makeBlankDay();
    tracker.saveLocal();
    tracker.ui.render();

    tracker.setStatus(tracker.firebaseDb ? "LIVE — new day ready" : "New day ready");
  }

  tracker.dayController = {
    addPeople,
    removeLastPerson,
    resetTallies,
    saveFieldsFromPage,
    saveDay,
    newDay
  };
})();
