(function () {
  const tracker = window.DailyMenuTracker = window.DailyMenuTracker || {};

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

  function renderXmProjection() {
    const element = document.getElementById("xmProjection");
    if (!element) return;

    const traffic = tracker.reporting.numericValue(tracker.state.current.estimatedTraffic);
    const closeRate = tracker.reporting.parsePercent(tracker.state.current.mobileClose);
    const currentXm = tracker.state.current.people.reduce(
      (sum, person) => sum + (Number(person.XM) || 0),
      0
    );
    const projectedXm = traffic !== null && closeRate !== null
      ? traffic * closeRate
      : null;
    const goal = tracker.reporting.numericValue(tracker.state.current.xmGoal);
    const needed = goal !== null && projectedXm !== null
      ? Math.max(0, Math.ceil(goal - currentXm - projectedXm))
      : null;

    element.innerHTML = `
      <div><b>Estimated traffic</b><span>${traffic === null ? "—" : traffic}</span></div>
      <div><b>Mobile close rate</b><span>${tracker.reporting.formatPercent(closeRate)}</span></div>
      <div><b>Projected XM</b><span>${projectedXm === null ? "—" : projectedXm.toFixed(1)}</span></div>
      <div><b>XM needed to reach goal</b><span>${needed === null ? "Set an XM goal" : needed}</span></div>
    `;
  }

  function reportMetricMessage() {
    const missing = [];
    if (!tracker.state.current.rank) missing.push("Sales Ranker Position");
    if (!tracker.state.current.mobileClose) missing.push("Mobile Close Rate");
    return missing.length ? ` — not found: ${missing.join(", ")}` : "";
  }

  function renderSalesReport() {
    const report = tracker.state.current.salesReport;
    const status = document.getElementById("salesReportStatus");
    const table = document.getElementById("salesReportTable");

    if (!table) return;
    table.innerHTML = "";

    if (!report || !Array.isArray(report.rows) || report.rows.length === 0) {
      if (status) status.textContent = "No report attached.";
      return;
    }

    const storeLabel = tracker.state.current.salesStore ? ` — ${tracker.state.current.salesStore}` : "";
    if (status) {
      status.textContent = `${report.fileName}${storeLabel} — ${report.rows.length - 1} data rows${reportMetricMessage()}`;
    }

    report.rows.slice(0, 101).forEach((row, rowIndex) => {
      const tableRow = document.createElement("tr");
      row.forEach(value => {
        const cell = document.createElement(rowIndex === 0 ? "th" : "td");
        cell.textContent = value ?? "";
        tableRow.appendChild(cell);
      });
      table.appendChild(tableRow);
    });

    if (report.rows.length > 101 && status) {
      status.textContent += " — showing the first 100 data rows";
    }
  }

  function importSalesReport(file) {
    if (!window.XLSX) {
      tracker.setStatus("Could not load the Excel reader");
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const store = window.prompt("What store is this sales report for?");
        if (store === null || !store.trim()) {
          tracker.setStatus("Sales report import cancelled — enter a store name to continue");
          return;
        }

        const workbook = XLSX.read(event.target.result, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
          defval: ""
        });

        if (!rows.length) {
          throw new Error("The first worksheet is empty.");
        }

        tracker.state.current.salesReport = {
          fileName: file.name,
          sheetName: workbook.SheetNames[0],
          rows
        };

        const storeColumnIndex = findStoreColumn(rows);
        const storeRows = storeColumnIndex === -1
          ? rows
          : filterRowsForStore(rows, storeColumnIndex, store);

        if (storeColumnIndex !== -1 && storeRows.length <= 1) {
          throw new Error(`No rows found for store "${store.trim()}".`);
        }

        const metrics = tracker.reporting.extractReportMetrics(storeRows);
        if (metrics.nps !== null) tracker.state.current.nps = metrics.nps;
        if (metrics.rank !== null) tracker.state.current.rank = metrics.rank;
        if (metrics.mobileClose !== null) {
          tracker.state.current.mobileClose = tracker.reporting.formatPercent(metrics.mobileClose);
        }
        if (metrics.fiscalClose !== null) {
          tracker.state.current.fiscalClose = tracker.reporting.formatPercent(metrics.fiscalClose);
        }
        if (metrics.estimatedTraffic !== null) {
          tracker.state.current.estimatedTraffic = metrics.estimatedTraffic;
        }

        tracker.state.current.salesStore = store.trim();
        tracker.state.current.salesReport.rows = storeRows;
        tracker.state.current.salesReport.storeColumn = storeColumnIndex;

        tracker.saveLocal();
        tracker.ui.render();
        tracker.setStatus("Sales report attached locally — save the day to include it in shared data");
      } catch (error) {
        console.error("Could not import sales report:", error);
        tracker.setStatus(`Could not import sales report: ${error.message}`);
      }
    };

    reader.onerror = () => tracker.setStatus("Could not read the selected file");
    reader.readAsArrayBuffer(file);
  }

  function findStoreColumn(rows) {
    const aliases = ["store", "store name", "location", "retail store", "site"];
    const headerIndex = rows.findIndex(row =>
      row.some(cell => aliases.includes(tracker.reporting.normalizeLabel(cell)))
    );

    if (headerIndex === -1) return -1;
    return rows[headerIndex].findIndex(cell => aliases.includes(tracker.reporting.normalizeLabel(cell)));
  }

  function filterRowsForStore(rows, storeColumnIndex, store) {
    const target = tracker.reporting.normalizeLabel(store);
    const headerIndex = rows.findIndex(row =>
      row.some(cell => ["store", "store name", "location", "retail store", "site"].includes(tracker.reporting.normalizeLabel(cell)))
    );
    const header = rows[headerIndex];
    const matchingRows = rows.slice(headerIndex + 1).filter(row =>
      tracker.reporting.normalizeLabel(row[storeColumnIndex]) === target
    );

    return [header, ...matchingRows];
  }

  function updateDailyTotals() {
    tracker.CATEGORIES.forEach(category => {
      const total = tracker.state.current.people.reduce(
        (sum, person) => sum + (Number(person[category]) || 0),
        0
      );

      const cell = document.getElementById(`daily-total-${tracker.format.slug(category)}`);
      if (cell) cell.textContent = total;
    });
  }

  function renderDailyTable() {
    const table = document.getElementById("dailyTable");
    if (!table) return;
    table.innerHTML = "";

    const header = document.createElement("tr");
    header.innerHTML =
      "<th>Person / Sous Chef</th>" +
      tracker.CATEGORIES.map(category => `<th>${tracker.format.escapeHtml(category)}</th>`).join("");
    table.appendChild(header);

    tracker.state.current.people.forEach((person, personIndex) => {
      const row = document.createElement("tr");

      const nameCell = document.createElement("td");
      nameCell.className = "name";
      nameCell.innerHTML = `
        <div class="name-cell">
          <input
            placeholder="Enter name"
            value="${tracker.format.escapeHtml(person.name)}"
            data-name-index="${personIndex}">
          <button class="remove-row" title="Remove this person" data-remove-index="${personIndex}">×</button>
        </div>
      `;
      row.appendChild(nameCell);

      tracker.CATEGORIES.forEach(category => {
        const cell = document.createElement("td");
        const value = Number(person[category]) || 0;

        cell.innerHTML = `
          <div class="tally">
            <button data-action="change" data-person="${personIndex}" data-category="${tracker.format.escapeAttr(category)}" data-delta="-1">−</button>
            <input
              type="number"
              min="0"
              value="${value}"
              data-tally-person="${personIndex}"
              data-tally-category="${tracker.format.escapeAttr(category)}">
            <button data-action="change" data-person="${personIndex}" data-category="${tracker.format.escapeAttr(category)}" data-delta="1">+</button>
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
      tracker.CATEGORIES.map(category => `<td id="daily-total-${tracker.format.slug(category)}">0</td>`).join("");
    footer.appendChild(footerRow);
    table.appendChild(footer);

    updateDailyTotals();

    table.querySelectorAll("[data-name-index]").forEach(input => {
      input.addEventListener("input", event => {
        const index = Number(event.target.dataset.nameIndex);
        tracker.state.current.people[index].name = event.target.value;
        tracker.saveLocal();
        tracker.ui.renderOverall();
      });
    });

    table.querySelectorAll("[data-remove-index]").forEach(button => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.removeIndex);
        if (tracker.state.current.people.length <= 1) {
          alert("Keep at least one person on the day.");
          return;
        }
        tracker.state.current.people.splice(index, 1);
        tracker.saveLocal();
        tracker.ui.render();
      });
    });

    table.querySelectorAll("[data-action='change']").forEach(button => {
      button.addEventListener("click", () => {
        const personIndex = Number(button.dataset.person);
        const category = button.dataset.category;
        const delta = Number(button.dataset.delta);

        tracker.state.current.people[personIndex][category] =
          Math.max(0, (Number(tracker.state.current.people[personIndex][category]) || 0) + delta);

        tracker.saveLocal();
        tracker.ui.render();
      });
    });

    table.querySelectorAll("[data-tally-person]").forEach(input => {
      input.addEventListener("change", () => {
        const personIndex = Number(input.dataset.tallyPerson);
        const category = input.dataset.tallyCategory;

        tracker.state.current.people[personIndex][category] =
          Math.max(0, parseInt(input.value, 10) || 0);

        tracker.saveLocal();
        tracker.ui.render();
      });
    });
  }

  function renderOverall() {
    const totals = {};
    tracker.CATEGORIES.forEach(category => totals[category] = 0);

    Object.values(tracker.state.days).forEach(day => {
      (day.people || day.chefs || []).forEach(person => {
        tracker.CATEGORIES.forEach(category => {
          totals[category] += Number(person[category]) || 0;
        });
      });
    });

    (tracker.state.current.people || []).forEach(person => {
      tracker.CATEGORIES.forEach(category => {
        totals[category] += Number(person[category]) || 0;
      });
    });

    const tbody = document.querySelector("#overallTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    tracker.CATEGORIES.forEach(category => {
      let goal = "";

      if (category === "XM") goal = Number(tracker.state.current.xmGoal) || 0;
      if (category === "Accessory") goal = Number(tracker.state.current.accGoal) || 0;

      const percentage = goal ? `${((totals[category] / goal) * 100).toFixed(0)}%` : "—";

      tbody.innerHTML += `
        <tr>
          <td style="text-align:left">${tracker.format.escapeHtml(category)}</td>
          <td>${totals[category]}</td>
          <td>${goal || "—"}</td>
          <td class="pct">${percentage}</td>
        </tr>
      `;
    });

    const history = document.querySelector("#historyTable tbody");
    if (!history) return;
    history.innerHTML = "";

    const days = Object.values(tracker.state.days)
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

    days.forEach(day => {
      const people = day.people || day.chefs || [];

      people.forEach(person => {
        tracker.CATEGORIES.forEach(category => {
          const tally = Number(person[category]) || 0;
          if (tally > 0) {
            history.innerHTML += `
              <tr>
                <td>${tracker.format.escapeHtml(day.date || "")}</td>
                <td>${tracker.format.escapeHtml(person.name || "")}</td>
                <td>${tracker.format.escapeHtml(category)}</td>
                <td>${tally}</td>
              </tr>
            `;
          }
        });
      });
    });

    if (!history.innerHTML) {
      history.innerHTML = '<tr><td colspan="4" class="empty">No saved history yet.</td></tr>';
    }
  }

  function exportCSV() {
    const rows = [["Date", "Person", ...tracker.CATEGORIES]];

    Object.values(tracker.state.days).forEach(day => {
      const people = day.people || day.chefs || [];

      people.forEach(person => {
        rows.push([
          day.date || "",
          person.name || "",
          ...tracker.CATEGORIES.map(category => person[category] || 0)
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

  tracker.dayController = {
    addPeople,
    removeLastPerson,
    resetTallies,
    saveFieldsFromPage,
    saveDay,
    newDay
  };

  tracker.reportController = {
    findStoreColumn,
    filterRowsForStore,
    renderXmProjection,
    renderSalesReport,
    importSalesReport
  };

  tracker.tableController = {
    updateDailyTotals,
    renderDailyTable
  };

  tracker.overallController = {
    renderOverall,
    exportCSV
  };
})();
