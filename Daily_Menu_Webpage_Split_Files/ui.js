(function () {
  const tracker = window.DailyMenuTracker;

  function render() {
    tracker.ensurePeople();

    const fields = [
      "date", "nps", "rank", "mobileClose", "fiscalClose",
      "xmGoal", "rguGoal", "gpGoal", "accGoal",
      "special", "specialGoal", "notes"
    ];

    fields.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.value = tracker.state.current[id] ?? "";
    });

    const peopleCount = document.getElementById("peopleCount");
    if (peopleCount) peopleCount.textContent = tracker.state.current.people.length;

    tracker.tableController.renderDailyTable();
    tracker.reportController.renderSalesReport();
    tracker.reportController.renderXmProjection();
    tracker.overallController.renderOverall();
  }

  function bindEvents() {
    document.getElementById("addPersonBtn").addEventListener("click", () => tracker.dayController.addPeople(1));
    document.getElementById("addFiveBtn").addEventListener("click", () => tracker.dayController.addPeople(5));
    document.getElementById("removePersonBtn").addEventListener("click", tracker.dayController.removeLastPerson);
    document.getElementById("resetBtn").addEventListener("click", tracker.dayController.resetTallies);
    document.getElementById("saveDayBtn").addEventListener("click", tracker.dayController.saveDay);
    document.getElementById("newDayBtn").addEventListener("click", tracker.dayController.newDay);
    document.getElementById("exportBtn").addEventListener("click", tracker.overallController.exportCSV);

    document.getElementById("salesReportFile").addEventListener("change", event => {
      const [file] = event.target.files;
      if (file) tracker.reportController.importSalesReport(file);
      event.target.value = "";
    });

    document.getElementById("date").addEventListener("change", () => {
      tracker.dayController.saveFieldsFromPage();

      const selectedDate = document.getElementById("date").value;

      if (tracker.state.days[selectedDate]) {
        tracker.state.current = tracker.deepCopy(tracker.state.days[selectedDate]);
      } else {
        tracker.state.current = tracker.makeBlankDay(selectedDate);
      }

      tracker.saveLocal();
      render();
    });

    [
      "nps", "rank", "mobileClose", "fiscalClose",
      "xmGoal", "rguGoal", "gpGoal", "accGoal",
      "special", "specialGoal", "notes"
    ].forEach(id => {
      document.getElementById(id).addEventListener("input", () => {
        tracker.state.current[id] = document.getElementById(id).value;
        tracker.saveLocal();
        tracker.overallController.renderOverall();
      });
    });
  }

  tracker.ui = {
    render,
    bindEvents,
    renderOverall: tracker.overallController.renderOverall,
    renderDailyTable: tracker.tableController.renderDailyTable,
    renderSalesReport: tracker.reportController.renderSalesReport,
    renderXmProjection: tracker.reportController.renderXmProjection,
    importSalesReport: tracker.reportController.importSalesReport
  };
})();
