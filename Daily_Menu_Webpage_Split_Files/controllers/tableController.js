(function () {
  const tracker = window.DailyMenuTracker;

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

  tracker.tableController = {
    updateDailyTotals,
    renderDailyTable
  };
})();
