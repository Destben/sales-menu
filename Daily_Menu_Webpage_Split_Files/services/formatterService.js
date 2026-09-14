(function () {
  const tracker = window.DailyMenuTracker;

  tracker.format = {
    slug(value) {
      return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    },

    escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    },

    escapeAttr(value) {
      return tracker.format.escapeHtml(value).replaceAll("'", "&#39;");
    }
  };
})();
