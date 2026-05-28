class BookmarkExportService {
  /**
   * Compiles custom bookmark list elements payload representation
   */
  static formatBookmarks(bookmarks: any[]): string {
    const formatted = bookmarks.map((b) => ({
      id: b.id,
      projectId: b.projectId || b.listingId || "",
      pageId: b.pageId || "",
      bookmarkTitle: b.title || "Bookmarked Referencing Segment",
      createdAt: b.createdAt || ""
    }));

    return JSON.stringify(formatted, null, 2);
  }
}


module.exports = {
  BookmarkExportService
};
