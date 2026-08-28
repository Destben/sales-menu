const CATEGORIES = [
  "XM", "Watches Tablets", "XMC", "Net", "Vid", "CDV",
  "Smart Home", "TP", "QP", "Accessory", "Mobile Quote Sheets"
];

let state = {
  days: {},
  current: {}
};

let firebaseDb = null;

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

function today() {
  return new Date().toISOString().slice(0, 10);
}

function blankPerson() {
  const person = { name: "" };
  CATEGORIES.forEach(category => person[category] = 0);
  return person;
}

function makeBlankDay(date = today()) {
  return {
    date,
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
    people: [blankPerson()]
  };
}

function ensurePeople() {
  if (!Array.isArray(state.current.people) || state.current.people.length === 0) {
    state.current.people = [blankPerson()];
  }
}

function saveLocal() {
  localStorage.setItem("dailyMenuTracker", JSON.stringify(state));
}

function loadLocal() {
  try {
    const saved = JSON.parse(localStorage.getItem("dailyMenuTracker"));
    if (saved) state = saved;
  } catch (error) {
    console.error("Could not load local data:", error);
  }

  if (!state.current || !state.current.date) {
    state.current = makeBlankDay();
  }

  ensurePeople();
}

function setStatus(message) {
  document.getElementById("status").textContent = message;
}

function render() {
  ensurePeople();

  const fields = [
    "date", "nps", "rank", "mobileClose", "fiscalClose",
    "xmGoal", "rguGoal", "gpGoal", "accGoal",
    "special", "specialGoal", "notes"
  ];

  fields.forEach(id => {
    const element = document.getElementById(id);
    element.value = state.current[id] ?? "";
  });

  document.getElementById("peopleCount").textContent = state.current.people.length;

  renderDailyTable();
  renderOverall();
}

function renderDailyTable() {
  const table = document.getElementById("dailyTable");
  table.innerHTML = "";

  const header = document.createElement("tr");
  header.innerHTML =
    "<th>Person / Sous Chef</th>" +
    CATEGORIES.map(category => `<th>${escapeHtml(category)}</th>`).join("");
  table.appendChild(header);

  state.current.people.forEach((person, personIndex) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.className = "name";
    nameCell.innerHTML = `
      <div class="name-cell">
        <input
          placeholder="Enter name"
          value="${escapeHtml(person.name)}"
          data-name-index="${personIndex}">
        <button class="remove-row" title="Remove this person" data-remove-index="${personIndex}">×</button>
      </div>
    `;
    row.appendChild(nameCell);

    CATEGORIES.forEach(category => {
      const cell = document.createElement("td");
      const value = Number(person[category]) || 0;

      cell.innerHTML = `
        <div class="tally">
          <button data-action="change" data-person="${personIndex}" data-category="${escapeAttr(category)}" data-delta="-1">−</button>
          <input
            type="number"
            min="0"
            value="${value}"
            data-tally-person="${personIndex}"
            data-tally-category="${escapeAttr(category)}">
          <button data-action="change" data-person="${personIndex}" data-category="${escapeAttr(category)}" data-delta="1">+</button>
        </div>
      `;

      row.appendChild(cell);
    });

    table.appendChild(row);
  });

  const footer = document.createElement("tfoot");
  const footerRow = document.createElement("tr");
  footerRow.innerHTML =
    "<td>DAILY TOTAL</td>" +
    CATEGORIES.map(category => `<td id="daily-total-${slug(category)}">0</td>`).join("");
  footer.appendChild(footerRow);
  table.appendChild(footer);

  updateDailyTotals();

  table.querySelectorAll("[data-name-index]").forEach(input => {
    input.addEventListener("input", event => {
      const index = Number(event.target.dataset.nameIndex);
      state.current.people[index].name = event.target.value;
      saveLocal();
      renderOverall();
    });
  });

  table.querySelectorAll("[data-remove-index]").forEach(button => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.removeIndex);
      if (state.current.people.length <= 1) {
        alert("Keep at least one person on the day.");
        return;
      }
      state.current.people.splice(index, 1);
      saveLocal();
      render();
    });
  });

  table.querySelectorAll("[data-action='change']").forEach(button => {
    button.addEventListener("click", () => {
      const personIndex = Number(button.dataset.person);
      const category = button.dataset.category;
      const delta = Number(button.dataset.delta);

      state.current.people[personIndex][category] =
        Math.max(0, (Number(state.current.people[personIndex][category]) || 0) + delta);

      saveLocal();
      render();
    });
  });

  table.querySelectorAll("[data-tally-person]").forEach(input => {
    input.addEventListener("change", () => {
      const personIndex = Number(input.dataset.tallyPerson);
      const category = input.dataset.tallyCategory;

      state.current.people[personIndex][category] =
        Math.max(0, parseInt(input.value, 10) || 0);

      saveLocal();
      render();
    });
  });
}

function updateDailyTotals() {
  CATEGORIES.forEach(category => {
    const total = state.current.people.reduce(
      (sum, person) => sum + (Number(person[category]) || 0),
      0
    );

    const cell = document.getElementById(`daily-total-${slug(category)}`);
    if (cell) cell.textContent = total;
  });
}

function addPeople(count = 1) {
  for (let i = 0; i < count; i++) {
    state.current.people.push(blankPerson());
  }
  saveLocal();
  render();
}

function removeLastPerson() {
  if (state.current.people.length <= 1) {
    alert("Keep at least one person on the day.");
    return;
  }

  state.current.people.pop();
  saveLocal();
  render();
}

function resetTallies() {
  if (!confirm("Reset every tally for today? Names will remain.")) return;

  state.current.people.forEach(person => {
    CATEGORIES.forEach(category => person[category] = 0);
  });

  saveLocal();
  render();
}

function saveFieldsFromPage() {
  const ids = [
    "nps", "rank", "mobileClose", "fiscalClose",
    "xmGoal", "rguGoal", "gpGoal", "accGoal",
    "special", "specialGoal", "notes"
  ];

  state.current.date = document.getElementById("date").value || today();

  ids.forEach(id => {
    state.current[id] = document.getElementById(id).value;
  });
}

async function saveDay() {
  saveFieldsFromPage();
  ensurePeople();

  state.days[state.current.date] = deepCopy(state.current);
  saveLocal();

  if (firebaseDb) {
    await firebaseDb.ref(`tracker/days/${state.current.date}`).set(state.current);
    setStatus("LIVE — saved and shared with everyone");
  } else {
    setStatus("Saved locally — connect Firebase for shared live data");
  }

  renderOverall();
}

function newDay() {
  saveFieldsFromPage();

  state.current = makeBlankDay();
  saveLocal();
  render();

  setStatus(firebaseDb ? "LIVE — new day ready" : "New day ready");
}

function renderOverall() {
  const totals = {};
  CATEGORIES.forEach(category => totals[category] = 0);

  Object.values(state.days).forEach(day => {
    (day.people || day.chefs || []).forEach(person => {
      CATEGORIES.forEach(category => {
        totals[category] += Number(person[category]) || 0;
      });
    });
  });

  // Show today's unsaved/current values too.
  (state.current.people || []).forEach(person => {
    CATEGORIES.forEach(category => {
      totals[category] += Number(person[category]) || 0;
    });
  });

  const tbody = document.querySelector("#overallTable tbody");
  tbody.innerHTML = "";

  CATEGORIES.forEach(category => {
    let goal = "";

    if (category === "XM") goal = Number(state.current.xmGoal) || 0;
    if (category === "Accessory") goal = Number(state.current.accGoal) || 0;

    const percentage = goal ? `${((totals[category] / goal) * 100).toFixed(0)}%` : "—";

    tbody.innerHTML += `
      <tr>
        <td style="text-align:left">${escapeHtml(category)}</td>
        <td>${totals[category]}</td>
        <td>${goal || "—"}</td>
        <td class="pct">${percentage}</td>
      </tr>
    `;
  });

  const history = document.querySelector("#historyTable tbody");
  history.innerHTML = "";

  const days = Object.values(state.days)
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  days.forEach(day => {
    const people = day.people || day.chefs || [];

    people.forEach(person => {
      CATEGORIES.forEach(category => {
        const tally = Number(person[category]) || 0;
        if (tally > 0) {
          history.innerHTML += `
            <tr>
              <td>${escapeHtml(day.date || "")}</td>
              <td>${escapeHtml(person.name || "")}</td>
              <td>${escapeHtml(category)}</td>
              <td>${tally}</td>
            </tr>
          `;
        }
      });
    });
  });

  if (!history.innerHTML) {
    history.innerHTML = `<tr><td colspan="4" class="empty">No saved history yet.</td></tr>`;
  }
}

function exportCSV() {
  const rows = [["Date", "Person", ...CATEGORIES]];

  Object.values(state.days).forEach(day => {
    const people = day.people || day.chefs || [];

    people.forEach(person => {
      rows.push([
        day.date || "",
        person.name || "",
        ...CATEGORIES.map(category => person[category] || 0)
      ]);
    });
  });

  const csv = rows
    .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = "daily-menu-sales.csv";
  link.click();
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function deepCopy(value) {
  return JSON.parse(JSON.stringify(value));
}

function connectFirebase() {
  if (!FIREBASE_CONFIG) {
    setStatus("LOCAL MODE — each browser has its own data");
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
    firebase.initializeApp(FIREBASE_CONFIG);
    firebaseDb = firebase.database();

    firebaseDb.ref("tracker/days").on("value", snapshot => {
      state.days = snapshot.val() || {};

      const date = document.getElementById("date").value || today();

      if (state.days[date]) {
        state.current = deepCopy(state.days[date]);
      } else {
        state.current = makeBlankDay(date);
      }

      render();
      setStatus("LIVE — shared with everyone using this page");
    });
  };

  document.head.appendChild(appScript);
}

function init() {
  loadLocal();
  render();

  document.getElementById("addPersonBtn").addEventListener("click", () => addPeople(1));
  document.getElementById("addFiveBtn").addEventListener("click", () => addPeople(5));
  document.getElementById("removePersonBtn").addEventListener("click", removeLastPerson);
  document.getElementById("resetBtn").addEventListener("click", resetTallies);
  document.getElementById("saveDayBtn").addEventListener("click", saveDay);
  document.getElementById("newDayBtn").addEventListener("click", newDay);
  document.getElementById("exportBtn").addEventListener("click", exportCSV);

  document.getElementById("date").addEventListener("change", () => {
    saveFieldsFromPage();

    const selectedDate = document.getElementById("date").value;

    if (state.days[selectedDate]) {
      state.current = deepCopy(state.days[selectedDate]);
    } else {
      state.current = makeBlankDay(selectedDate);
    }

    saveLocal();
    render();
  });

  [
    "nps", "rank", "mobileClose", "fiscalClose",
    "xmGoal", "rguGoal", "gpGoal", "accGoal",
    "special", "specialGoal", "notes"
  ].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      state.current[id] = document.getElementById(id).value;
      saveLocal();
      renderOverall();
    });
  });

  connectFirebase();
}

init();
