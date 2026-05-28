const JSZip = require("jszip");
const { PageExportService } = require("./pageExportService");
const { IndexExportService } = require("./indexExportService");
const { AnnotationExportService } = require("./annotationExportService");
const { BookmarkExportService } = require("./bookmarkExportService");
const { HighlightExportService } = require("./highlightExportService");

class ZipService {
  /**
   * Original generator for a single project zip (kept unchanged for compatibility).
   */
  static async generateProjectZip(projectData: {
    project: any;
    pages: any[];
    indices: any[];
    highlights: any[];
    bookmarks: any[];
    annotations: any[];
  }): Promise<Buffer> {
    const zip = new JSZip();

    // 1. Write the main metadata.json
    const metadata = {
      id: projectData.project.id,
      title: projectData.project.title,
      owner: projectData.project.owner,
      category: projectData.project.category || "",
      summary: projectData.project.summary || "",
      tags: projectData.project.tags || [],
      visibility: projectData.project.visibility || "private",
      createdAt: projectData.project.createdAt || "",
      updatedAt: projectData.project.updatedAt || "",
      addedToNexus: projectData.project.addedToNexus || false,
    };
    zip.file("metadata.json", JSON.stringify(metadata, null, 2));

    // 2. Write project data in general (project-data.json)
    zip.file("project-data.json", JSON.stringify(projectData, null, 2));

    // 3. Pages folder containing code, HTML, or Markdown text documents
    const pagesFolder = zip.folder("pages");
    if (pagesFolder) {
      projectData.pages.forEach((page, index) => {
        const pageNum = page.pageNumber !== undefined ? page.pageNumber : (index + 1);
        const sanitizeTitle = (page.title || `Page ${pageNum}`).trim().replace(/[^a-z0-9_-]/gi, '_');
        const fileName = `${pageNum}_${sanitizeTitle}`;
        
        // Write the HTML or Markdown content
        const content = page.content || "";
        const extension = content.trim().startsWith("<") ? "html" : "md";
        pagesFolder.file(`${fileName}.${extension}`, content);
        
        // Also write individual page metadata
        pagesFolder.file(`${fileName}_metadata.json`, JSON.stringify(page, null, 2));
      });
    }

    // 4. Project references files
    zip.file("bookmarks.json", JSON.stringify(projectData.bookmarks, null, 2));
    zip.file("highlights.json", JSON.stringify(projectData.highlights, null, 2));
    zip.file("annotations.json", JSON.stringify(projectData.annotations, null, 2));
    zip.file("indexes.json", JSON.stringify(projectData.indices, null, 2));

    // 5. Documentation README
    const readmeContent = `# ${projectData.project.title}

- **Owner:** ${projectData.project.owner}
- **Category:** ${projectData.project.category || "Uncategorized"}
- **Visibility:** ${projectData.project.visibility}
- **Last Updated:** ${projectData.project.updatedAt || "N/A"}

## Project Overview
${projectData.project.summary || "No project summary provided."}

## Content Breakdown
- Total Pages: ${projectData.pages.length}
- Total Highlights / Annotations: ${projectData.highlights.length}
- Total Comments: ${projectData.annotations.length}
- Total Bookmarks: ${projectData.bookmarks.length}
- Total Index Hierarchy Elements: ${projectData.indices.length}

*Generated automatically on ${new Date().toLocaleString()} by DocCMS Workspace Exporter*
`;
    zip.file("README.md", readmeContent);

    // 6. Output ZIP archive Node buffer representation
    return await zip.generateAsync({ type: "nodebuffer" });
  }

  /**
   * Generates a single unified ZIP package representing the user's Workspace Hub.
   * Matches the precise requested output hierarchy:
   * Workspace-Hub/
   *    Project-1/
   *        indexes/main-index.html
   *        pages/page-X_title.html
   *        annotations/annotations.json
   *        bookmarks/bookmarks.json
   *        highlights/highlights.json
   */
  static async generateWorkspaceHubZip(allProjectsData: {
    project: any;
    pages: any[];
    indices: any[];
    highlights: any[];
    bookmarks: any[];
    annotations: any[];
  }[]): Promise<Buffer> {
    const zip = new JSZip();
    const rootFolder = zip.folder("Workspace-Hub");

    if (!rootFolder) {
      throw new Error("Unable to establish root directory inside ZIP archive.");
    }

    allProjectsData.forEach((projectData, idx) => {
      // Sanitize the project name for its parent folder
      const safeProjTitle = (projectData.project.title || `Project-${idx + 1}`)
        .trim()
        .replace(/[^a-z0-9_-]/gi, '_');
      
      const projectFolder = rootFolder.folder(safeProjTitle);
      if (!projectFolder) return;

      // 1. Export Pages
      const pagesFolder = projectFolder.folder("pages");
      const pageFilenameMap = new Map<string, string>();
      if (pagesFolder) {
        const exportedPages = PageExportService.exportPages(projectData.pages);
        exportedPages.forEach((item, pIdx) => {
          pagesFolder.file(item.filename, item.content);
          
          // Map original page identifier to its generated filename for reference resolved in indexes
          const pageObj = projectData.pages[pIdx];
          if (pageObj && pageObj.id) {
            pageFilenameMap.set(pageObj.id, item.filename);
          }
        });
      }

      // 2. Export Indexes
      const indexesFolder = projectFolder.folder("indexes");
      if (indexesFolder) {
        const indexHtml = IndexExportService.formatIndexToHtml(
          projectData.indices,
          projectData.pages,
          pageFilenameMap
        );
        indexesFolder.file("main-index.html", indexHtml);
      }

      // 3. Export Annotations
      const annotationsFolder = projectFolder.folder("annotations");
      if (annotationsFolder) {
        const annotationsJson = AnnotationExportService.formatAnnotations(projectData.annotations);
        annotationsFolder.file("annotations.json", annotationsJson);
      }

      // 4. Export Bookmarks
      const bookmarksFolder = projectFolder.folder("bookmarks");
      if (bookmarksFolder) {
        const bookmarksJson = BookmarkExportService.formatBookmarks(projectData.bookmarks);
        bookmarksFolder.file("bookmarks.json", bookmarksJson);
      }

      // 5. Export Highlights
      const highlightsFolder = projectFolder.folder("highlights");
      if (highlightsFolder) {
        const highlightsJson = HighlightExportService.formatHighlights(projectData.highlights);
        highlightsFolder.file("highlights.json", highlightsJson);
      }
    });

    return await zip.generateAsync({ type: "nodebuffer" });
  }

  /**
   * Generates a single unified ZIP package representing the user's Document Nexus.
   * Matches the precise requested output hierarchy:
   * Document-Nexus/
   *    Workspace-1/
   *        Project-1/
   *            indexes/main-index.html
   *            pages/page-X.html
   *            annotations/annotations.json
   *            bookmarks/bookmarks.json
   *            highlights/highlights.json
   */
  static async generateDocumentNexusZip(groupedData: Array<{
    workspaceName: string;
    projects: Array<{
      project: any;
      pages: any[];
      indices: any[];
      highlights: any[];
      bookmarks: any[];
      annotations: any[];
    }>;
  }>): Promise<Buffer> {
    const zip = new JSZip();
    const rootFolder = zip.folder("Document-Nexus");

    if (!rootFolder) {
      throw new Error("Unable to establish root directory inside ZIP archive.");
    }

    groupedData.forEach(({ workspaceName, projects }) => {
      // Sanitize the workspace name for its parent folder
      const safeWsName = workspaceName
        .trim()
        .replace(/[^a-z0-9_-]/gi, '_') || "Workspace";
      
      const wsFolder = rootFolder.folder(safeWsName);
      if (!wsFolder) return;

      projects.forEach((projectData, idx) => {
        // Sanitize the project name for its parent folder
        const safeProjTitle = (projectData.project.title || `Project-${idx + 1}`)
          .trim()
          .replace(/[^a-z0-9_-]/gi, '_') || "Project";
        
        const projectFolder = wsFolder.folder(safeProjTitle);
        if (!projectFolder) return;

        // 1. Export Pages
        const pagesFolder = projectFolder.folder("pages");
        const pageFilenameMap = new Map<string, string>();
        if (pagesFolder) {
          const exportedPages = PageExportService.exportPages(projectData.pages);
          exportedPages.forEach((item, pIdx) => {
            pagesFolder.file(item.filename, item.content);
            const pageObj = projectData.pages[pIdx];
            if (pageObj && pageObj.id) {
              pageFilenameMap.set(pageObj.id, item.filename);
            }
          });
        }

        // 2. Export Indexes
        const indexesFolder = projectFolder.folder("indexes");
        if (indexesFolder) {
          const indexHtml = IndexExportService.formatIndexToHtml(
            projectData.indices,
            projectData.pages,
            pageFilenameMap
          );
          indexesFolder.file("main-index.html", indexHtml);
        }

        // 3. Export Annotations
        const annotationsFolder = projectFolder.folder("annotations");
        if (annotationsFolder) {
          const annotationsJson = AnnotationExportService.formatAnnotations(projectData.annotations);
          annotationsFolder.file("annotations.json", annotationsJson);
        }

        // 4. Export Bookmarks
        const bookmarksFolder = projectFolder.folder("bookmarks");
        if (bookmarksFolder) {
          const bookmarksJson = BookmarkExportService.formatBookmarks(projectData.bookmarks);
          bookmarksFolder.file("bookmarks.json", bookmarksJson);
        }

        // 5. Export Highlights
        const highlightsFolder = projectFolder.folder("highlights");
        if (highlightsFolder) {
          const highlightsJson = HighlightExportService.formatHighlights(projectData.highlights);
          highlightsFolder.file("highlights.json", highlightsJson);
        }
      });
    });

    return await zip.generateAsync({ type: "nodebuffer" });
  }
}


module.exports = {
  ZipService
};
