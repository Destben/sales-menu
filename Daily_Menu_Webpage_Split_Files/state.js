(function () {
  const tracker = window.DailyMenuTracker = window.DailyMenuTracker || {};

  tracker.CATEGORIES = [
    "XM", "Watches Tablets", "XMC", "Net", "Vid", "CDV",
    "Smart Home", "TP", "QP", "Accessory", "Mobile Quote Sheets"
  ];

  tracker.state = {
    days: {},
    current: {}
  };

  tracker.firebaseDb = null;
  tracker.FIREBASE_CONFIG = null;

  tracker.today = function today() {
    return new Date().toISOString().slice(0, 10);
  };

  tracker.blankPerson = function blankPerson() {
    const person = { name: "" };
    tracker.CATEGORIES.forEach(category => person[category] = 0);
    return person;
  };

  tracker.makeBlankDay = function makeBlankDay(date = tracker.today()) {
    return {
      date,
      salesReport: null,
      salesStore: "",
      estimatedTraffic: "",
      nps: "",
      rank: "",
      mobileClose: "",
      fiscalClose: "",
      xmGoal: "",
      rguGoal: "",
      gpGoal: "",
      accGoal: "",
      special: "",
      specialGoal: "",
      notes: "",
      people: [tracker.blankPerson()]
    };
  };

  tracker.ensurePeople = function ensurePeople() {
    if (!Array.isArray(tracker.state.current.people) || tracker.state.current.people.length === 0) {
      tracker.state.current.people = [tracker.blankPerson()];
    }
  };

  tracker.saveLocal = function saveLocal() {
    localStorage.setItem("dailyMenuTracker", JSON.stringify(tracker.state));
  };

  tracker.loadLocal = function loadLocal() {
    try {
      const saved = JSON.parse(localStorage.getItem("dailyMenuTracker"));
      if (saved) tracker.state = saved;
    } catch (error) {
      console.error("Could not load local data:", error);
    }

    if (!tracker.state.current || !tracker.state.current.date) {
      tracker.state.current = tracker.makeBlankDay();
    }

    tracker.ensurePeople();
  };

  tracker.deepCopy = function deepCopy(value) {
    return JSON.parse(JSON.stringify(value));
  };

  tracker.slug = function slug(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  };

  tracker.escapeHtml = function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  };

  tracker.escapeAttr = function escapeAttr(value) {
    return tracker.escapeHtml(value).replaceAll("'", "&#39;");
  };

  tracker.setStatus = function setStatus(message) {
    const statusNode = document.getElementById("status");
    if (statusNode) statusNode.textContent = message;
  };
})();
