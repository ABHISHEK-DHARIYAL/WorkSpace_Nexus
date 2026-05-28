class IndexExportService {
  /**
   * Generates a structural, fully responsive Table of Contents index html page
   */
  static formatIndexToHtml(indices: any[], pages: any[], pageFilenameMap: Map<string, string>): string {
    if (!indices || indices.length === 0) {
      // Fallback: list all pages with links
      const fallbackListMarkup = pages.map((p, i) => {
        const filename = pageFilenameMap.get(p.id) || `page-${i + 1}.html`;
        return `
        <li>
          <a href="../pages/${filename}">Page ${i + 1}: ${p.title || `Untitled Page`}</a>
        </li>`;
      }).join('');

      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Table of Contents</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; color: #0f172a; }
    ul { list-style-type: none; padding-left: 0; }
    li { padding: 8px 0; border-bottom: 1px dashed #e2e8f0; }
    a { color: #2563eb; text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Table of Contents</h1>
  <p>No custom indexes or structures have been created for this project yet. Accessible pages are listed below:</p>
  <ul>
    ${fallbackListMarkup}
  </ul>
</body>
</html>`;
    }

    // Sort indices sequentially by position
    const sortedIndices = [...indices].sort((a, b) => (a.position || 0) - (b.position || 0));

    const indexRowsHtml = sortedIndices.map((idxItem) => {
      let linkedPagesLinks = "";
      
      if (idxItem.linkedPage) {
        const linkedIds = Array.isArray(idxItem.linkedPage)
          ? idxItem.linkedPage
          : (typeof idxItem.linkedPage === 'string' ? idxItem.linkedPage.split(',').filter(Boolean) : [idxItem.linkedPage].filter(Boolean));
        
        const validLinks = linkedIds
          .map(id => id.trim())
          .filter(id => pageFilenameMap.has(id))
          .map(id => {
            const filename = pageFilenameMap.get(id)!;
            const targetPage = pages.find(p => p.id === id);
            return `<a class="page-link" href="../pages/${filename}">${targetPage?.title || 'View Page'}</a>`;
          });
        
        if (validLinks.length > 0) {
          linkedPagesLinks = `<span class="links-span">— ${validLinks.join(', ')}</span>`;
        }
      }

      return `
        <li class="index-item" style="margin-left: ${(idxItem.level || 0) * 20}px">
          <span class="index-bullet">▪</span>
          <span class="index-title">${idxItem.title}</span>
          ${linkedPagesLinks}
        </li>
      `;
    }).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Project Workspace Index</title>
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
    .index-list {
      list-style-type: none;
      padding-left: 0;
      margin-top: 24px;
    }
    .index-item {
      padding: 6px 0;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .index-bullet {
      color: #6366f1;
      font-size: 0.8rem;
    }
    .index-title {
      font-weight: 600;
      color: #334155;
    }
    .page-link {
      color: #4f46e5;
      text-decoration: none;
      font-size: 0.9rem;
      border-bottom: 1px solid transparent;
      transition: border-bottom 0.2s;
    }
    .page-link:hover {
      border-bottom-color: #4f46e5;
    }
    .links-span {
      font-size: 0.875rem;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <h1>Project Workspace Index Hierarchy</h1>
  <p>Explore the index structure and linked documentation below:</p>
  <ul class="index-list">
    ${indexRowsHtml}
  </ul>
</body>
</html>`;
  }
}


module.exports = {
  IndexExportService
};
