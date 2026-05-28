class HighlightExportService {
  /**
   * Compiles custom highlight listings and styling coordinates payload representation
   */
  static formatHighlights(highlights: any[]): string {
    const formatted = highlights.map((h) => ({
      id: h.id,
      text: h.text || h.content || "",
      color: h.color || "rgba(250, 204, 21, 0.4)", // yellow default
      pageId: h.pageId || "",
      rangeSelector: h.rangeSelector || null,
      createdAt: h.createdAt || ""
    }));

    return JSON.stringify(formatted, null, 2);
  }
}


module.exports = {
  HighlightExportService
};
