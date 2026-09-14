(function () {
  const tracker = window.DailyMenuTracker;

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

  tracker.reportController = {
    findStoreColumn,
    filterRowsForStore,
    renderXmProjection,
    renderSalesReport,
    importSalesReport
  };
})();
