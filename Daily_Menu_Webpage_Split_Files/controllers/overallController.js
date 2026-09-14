(function () {
  const tracker = window.DailyMenuTracker;

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

  tracker.overallController = {
    renderOverall,
    exportCSV
  };
})();
