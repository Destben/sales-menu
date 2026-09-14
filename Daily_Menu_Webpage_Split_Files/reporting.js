(function () {
  const tracker = window.DailyMenuTracker;

  function normalizeLabel(value) {
    return String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function parsePercent(value) {
    const rawText = String(value ?? "").trim();
    if (!rawText) return null;
    const text = rawText.replace("%", "");
    const number = Number(text);
    if (!Number.isFinite(number)) return null;
    return rawText.includes("%") || number > 1 ? number / 100 : number;
  }

  function numericValue(value) {
    const text = String(value ?? "").replace(/[$,%\s,]/g, "");
    if (!text) return null;
    const number = Number(text);
    return Number.isFinite(number) ? number : null;
  }

  function findReportMetric(rows, aliases, parser = value => value) {
    const normalizedAliases = aliases.map(normalizeLabel);

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex].map(normalizeLabel);
      for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
        const matchesAlias = normalizedAliases.some(alias =>
          row[columnIndex] === alias || row[columnIndex].includes(alias)
        );
        if (!matchesAlias) continue;

        const sameRowValue = rows[rowIndex][columnIndex + 1];
        const parsedSameRowValue = parser(sameRowValue);
        if (parsedSameRowValue !== null && parsedSameRowValue !== "") {
          return parsedSameRowValue;
        }

        const nextRowValue = rows[rowIndex + 1]?.[columnIndex];
        const parsedNextRowValue = parser(nextRowValue);
        if (parsedNextRowValue !== null && parsedNextRowValue !== "") {
          return parsedNextRowValue;
        }
      }
    }

    return null;
  }

  function extractReportMetrics(rows) {
    return {
      nps: findReportMetric(rows, ["nps", "current nps"], numericValue),
      rank: findReportMetric(rows, [
        "sales ranker position", "ranker position", "sales rank position",
        "sales ranker", "sales rank", "ranker", "rank"
      ], numericValue),
      mobileClose: findReportMetric(rows, [
        "mobile close rate", "mobile close rate percentage", "mobile close %",
        "mobile close"
      ], parsePercent),
      fiscalClose: findReportMetric(rows, [
        "fiscal close rate", "fiscal close rate percentage", "fiscal close %"
      ], parsePercent),
      estimatedTraffic: findReportMetric(rows, [
        "estimated traffic value", "estimated traffic", "traffic value"
      ], numericValue)
    };
  }

  function formatPercent(value) {
    return Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "—";
  }

  tracker.reporting = {
    normalizeLabel,
    parsePercent,
    numericValue,
    findReportMetric,
    extractReportMetrics,
    formatPercent
  };
})();
