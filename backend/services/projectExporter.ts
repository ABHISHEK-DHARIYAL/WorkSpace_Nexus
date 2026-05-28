const { collection, getDocs, getDoc, doc, query, where, orderBy, db } = require("../config/db");

class ProjectExporter {
  /**
   * Collects all databases records associated to a specific project (listing)
   */
  static async exportProjectData(projectId: string, userEmail: string, isAdmin = false) {
    // 1. Get Listing (Project Metadata)
    const listingRef = doc(db, "listings", projectId);
    const listingSnap = await getDoc(listingRef);
    if (!listingSnap.exists()) {
      throw new Error("Project not found");
    }
    const listing = { id: listingSnap.id, ...listingSnap.data() as any };

    // Validate ownership before allowing export
    if (listing.owner !== userEmail && !isAdmin) {
      throw new Error("Access Denied: You are not authorized to export this project.");
    }

    // 2. Fetch associated pages & nexus indexes
    let pages: any[] = [];
    let indices: any[] = [];

    if (listing.addedToNexus === true) {
      // Document pages for Nexus format
      const pagesQuery = query(
        collection(db, "doc_pages"), 
        where("projectId", "==", projectId), 
        orderBy("pageNumber", "asc")
      );
      const pagesSnap = await getDocs(pagesQuery);
      pages = pagesSnap.docs.map(p => ({ id: p.id, ...p.data() as any }));

      // Fallback: if no specific doc_pages found, retrieve unassigned doc_pages as done in the frontend
      if (pages.length === 0) {
        const allPagesQuery = query(collection(db, "doc_pages"));
        const allPagesSnap = await getDocs(allPagesQuery);
        const allPages = allPagesSnap.docs.map(p => ({ id: p.id, ...p.data() as any }));
        pages = allPages.filter(p => !p.projectId);
        pages.sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));
      }

      // Document Nexus index structure
      const indicesQuery = query(
        collection(db, "doc_indices"), 
        where("projectId", "==", projectId), 
        orderBy("position", "asc")
      );
      const indicesSnap = await getDocs(indicesQuery);
      indices = indicesSnap.docs.map(i => ({ id: i.id, ...i.data() as any }));

      // Fallback: if no specific doc_indices found, retrieve unassigned doc_indices as done in the frontend
      if (indices.length === 0) {
        const allIndicesQuery = query(collection(db, "doc_indices"));
        const allIndicesSnap = await getDocs(allIndicesQuery);
        const allIndices = allIndicesSnap.docs.map(i => ({ id: i.id, ...i.data() as any }));
        indices = allIndices.filter(i => !i.projectId);
        indices.sort((a, b) => (a.position || 0) - (b.position || 0));
      }

      // Resolve and fetch any linked "Index-based Pages" that are not currently in the pages array
      const existingPageIds = new Set(pages.map(p => p.id));
      const referencedPageIds = new Set<string>();

      indices.forEach(idx => {
        if (!idx.linkedPage) return;
        const ids = Array.isArray(idx.linkedPage)
          ? idx.linkedPage
          : (typeof idx.linkedPage === 'string' ? idx.linkedPage.split(',').filter(Boolean) : [idx.linkedPage].filter(Boolean));
        ids.forEach(id => {
          if (id && typeof id === 'string') {
            referencedPageIds.add(id.trim());
          }
        });
      });

      for (const reqPageId of referencedPageIds) {
        if (!existingPageIds.has(reqPageId)) {
          // Attempt to find and load from `doc_pages` (Nexus pages)
          const docRef = doc(db, "doc_pages", reqPageId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            pages.push({ id: docSnap.id, ...docSnap.data() as any });
            existingPageIds.add(reqPageId);
          } else {
            // Attempt to find and load from standard `pages` collection
            const stdRef = doc(db, "pages", reqPageId);
            const stdSnap = await getDoc(stdRef);
            if (stdSnap.exists()) {
              pages.push({ id: stdSnap.id, ...stdSnap.data() as any });
              existingPageIds.add(reqPageId);
            }
          }
        }
      }
    } else {
      // Standard workspace pages
      const pagesQuery = query(collection(db, "pages"), where("listingId", "==", projectId));
      const pagesSnap = await getDocs(pagesQuery);
      pages = pagesSnap.docs.map(p => ({ id: p.id, ...p.data() as any }));
    }

    // Capture standard highlights and bookmarks
    const highlightsQuery = query(collection(db, "highlights"), where("listingId", "==", projectId));
    const highlightsSnap = await getDocs(highlightsQuery);
    const highlights = highlightsSnap.docs.map(h => ({ id: h.id, ...h.data() as any }));

    const bookmarksQuery = query(collection(db, "bookmarks"), where("projectId", "==", projectId));
    const bookmarksSnap = await getDocs(bookmarksQuery);
    const bookmarks = bookmarksSnap.docs.map(b => ({ id: b.id, ...b.data() as any }));

    // Fetch user annotations/comment threads on pages
    let annotations: any[] = [];
    if (pages.length > 0) {
      const annotationsSnap = await getDocs(collection(db, "annotations"));
      const allAnnotations = annotationsSnap.docs.map(a => ({ id: a.id, ...a.data() as any }));
      const pageIds = new Set(pages.map(p => p.id));
      annotations = allAnnotations.filter(a => pageIds.has(a.pageId));
    }

    return {
      project: listing,
      pages,
      indices,
      highlights,
      bookmarks,
      annotations
    };
  }
}


module.exports = {
  ProjectExporter
};
