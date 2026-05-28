class AnnotationExportService {
  /**
   * Compiles custom, user-eye clean annotation and comments structured payload representation
   */
  static formatAnnotations(annotations: any[]): string {
    const formatted = annotations.map((ann) => ({
      id: ann.id,
      pageId: ann.pageId || "",
      author: ann.author || ann.userEmail || "Anonymous",
      content: ann.content || ann.text || "",
      createdAt: ann.createdAt || ""
    }));

    return JSON.stringify(formatted, null, 2);
  }
}


module.exports = {
  AnnotationExportService
};
