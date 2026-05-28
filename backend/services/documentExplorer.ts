const { collection, getDocs, db, getDoc, doc } = require("../config/db");

class DocumentExplorer {
  static async getNexusData() {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const workspacesSnapshot = await getDocs(collection(db, "workspaces"));
    const listingsSnapshot = await getDocs(collection(db, "listings"));
    const pagesSnapshot = await getDocs(collection(db, "pages"));
    const highlightsSnapshot = await getDocs(collection(db, "highlights"));
    const indicesSnapshot = await getDocs(collection(db, "doc_indices"));

    const users = usersSnapshot.docs.map(d => ({ email: d.id, ...d.data() as any }));
    const workspaces = workspacesSnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
    const listings = listingsSnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
    const pages = pagesSnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
    const highlights = highlightsSnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
    const docIndices = indicesSnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));

    return {
      users,
      workspaces,
      listings: listings.map(l => ({
        ...l,
        title: l.title || l.name || "Untitled Project",
        isUploadedDoc: l.description ? l.description.includes("Imported from") : false
      })),
      pages,
      highlights,
      docIndices
    };
  }

  static async getProjectDetails(id: string) {
    const listingRef = doc(db, "listings", id);
    const snap = await getDoc(listingRef);
    if (!snap.exists()) return null;
    const l = { id: snap.id, ...snap.data() as any };

    // Fetch workspace
    let workspaceName = "Unassigned";
    if (l.workspaceId) {
      const wsRef = doc(db, "workspaces", l.workspaceId);
      const wsSnap = await getDoc(wsRef);
      if (wsSnap.exists()) {
        workspaceName = (wsSnap.data() as any).name;
      }
    }

    // Fetch pages
    const pagesSnapshot = await getDocs(collection(db, "pages"));
    const projPages = pagesSnapshot.docs
      .map(d => ({ id: d.id, ...d.data() as any }))
      .filter(p => p.listingId === id);

    return {
      id: l.id,
      name: l.title || l.name || "Untitled Project",
      workspaceName,
      workspaceId: l.workspaceId,
      owner: l.owner,
      description: l.description,
      createdAt: l.createdAt || new Date().toISOString(),
      pageCount: projPages.length,
      indexCount: (l.index || []).length,
      pages: projPages
    };
  }

  static async getPageDetails(id: string) {
    const pageRef = doc(db, "pages", id);
    const snap = await getDoc(pageRef);
    if (!snap.exists()) return null;
    const p = { id: snap.id, ...snap.data() as any };

    // Fetch parent project
    let projectName = "Untitled Project";
    let workspaceName = "Default Workspace";
    let owner = "System";

    if (p.listingId) {
      const lRef = doc(db, "listings", p.listingId);
      const lSnap = await getDoc(lRef);
      if (lSnap.exists()) {
        const lData = lSnap.data() as any;
        projectName = lData.title || lData.name || "Untitled Project";
        owner = lData.owner;

        if (lData.workspaceId) {
          const wsRef = doc(db, "workspaces", lData.workspaceId);
          const wsSnap = await getDoc(wsRef);
          if (wsSnap.exists()) {
            workspaceName = (wsSnap.data() as any).name;
          }
        }
      }
    }

    // Fetch annotations/highlights
    const highlightsSnapshot = await getDocs(collection(db, "highlights"));
    const pageHighlights = highlightsSnapshot.docs
      .map(d => ({ id: d.id, ...d.data() as any }))
      .filter(h => h.pageId === id);

    // Fetch doc_indices if linked
    const indicesSnapshot = await getDocs(collection(db, "doc_indices"));
    const linkedIndices = indicesSnapshot.docs
      .map(d => ({ id: d.id, ...d.data() as any }))
      .filter(ind => ind.linkedPage === id);

    return {
      id: p.id,
      title: p.title,
      content: p.content || "",
      pageNumber: p.pageNumber,
      createdAt: p.createdAt || new Date().toISOString(),
      projectName,
      workspaceName,
      owner,
      highlights: pageHighlights,
      indexLinks: linkedIndices
    };
  }
}


module.exports = {
  DocumentExplorer
};
