class PageExportService {
  /**
   * Formats a sequential array of raw pages into custom HTML elements with readable filenames
   */
  static exportPages(pages: any[]): Array<{ filename: string; content: string }> {
    // Sort pages sequentially if order or pageNumber properties exist
    const sorted = [...pages].sort((a, b) => {
      const numA = a.pageNumber !== undefined ? a.pageNumber : (a.order !== undefined ? a.order : 0);
      const numB = b.pageNumber !== undefined ? b.pageNumber : (b.order !== undefined ? b.order : 0);
      return numA - numB;
    });

    return sorted.map((page, index) => {
      const pageIndex = index + 1;
      const title = page.title || `Page ${pageIndex}`;
      const filename = `page-${pageIndex}.html`;

      // Render content as simple clean, fully responsive HTML documentation page
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
    }
    h1 {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
      color: #0f172a;
    }
    .meta {
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 24px;
    }
    .content {
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">Page Number: ${page.pageNumber !== undefined ? page.pageNumber : pageIndex}</div>
  <div class="content">${page.content || "(No page content)"}</div>
</body>
</html>`;

      return {
        filename,
        content: htmlContent
      };
    });
  }
}


module.exports = {
  PageExportService
};
