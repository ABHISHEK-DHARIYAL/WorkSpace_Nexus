import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  db
} from "../config/firebase";

export class PageService {
  static async getByListing(listingId: string) {
    const q = query(
      collection(db, "pages"), 
      where("listingId", "==", listingId)
    );
    const snapshot = await getDocs(q);
    const pages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    pages.sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));
    return pages;
  }

  static async getById(id: string) {
    const docRef = doc(db, "pages", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() };
  }

  static async create(data: any) {
    const newPage = {
      listingId: data.listingId,
      title: data.title,
      content: data.content || "",
      pageNumber: data.pageNumber || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, "pages"), newPage);
    const createdPage = { id: docRef.id, ...newPage };

    // Update parent listing's pages array inside both possible collections
    const updateParentPages = async (collectionName: string) => {
      const parentRef = doc(db, collectionName, data.listingId);
      const parentSnap = await getDoc(parentRef);
      if (parentSnap.exists()) {
        const parentData = parentSnap.data();
        const pages = parentData.pages || [];
        if (!pages.includes(docRef.id)) {
          await updateDoc(parentRef, {
            pages: [...pages, docRef.id],
            updatedAt: new Date().toISOString()
          });
        }
        // console.log(`[DEBUG] create Page: Updated parent in ${collectionName} with new page ${docRef.id}`);
        return true;
      }
      return false;
    };

    const updatedWorkspaceProject = await updateParentPages("workspaceHubProjects");
    const updatedLegacyListing = await updateParentPages("listings");
    // console.log(`[DEBUG] create Page: update parents finished. workspaceHubProjects: ${updatedWorkspaceProject}, listings: ${updatedLegacyListing}`);

    return createdPage;
  }

  static async getByWorkspace(workspaceId: string) {
    // console.log(`[DEBUG] getByWorkspace: workspaceId = ${workspaceId}`);
    // Fetch project IDs from workspaceHubProjects
    const projectsRef = collection(db, "workspaceHubProjects");
    const qProjects = query(projectsRef, where("workspaceId", "==", workspaceId));
    const projectsSnap = await getDocs(qProjects);
    const projectIds = projectsSnap.docs.map(d => d.id);
    // console.log(`[DEBUG] getByWorkspace: Found ${projectIds.length} projects in workspaceHubProjects:`, projectIds);

    // Fetch listing IDs from legacy listings
    const listingsRef = collection(db, "listings");
    const qListings = query(listingsRef, where("workspaceId", "==", workspaceId));
    const listingsSnap = await getDocs(qListings);
    const legacyListingIds = listingsSnap.docs.map(d => d.id);
    // console.log(`[DEBUG] getByWorkspace: Found ${legacyListingIds.length} legacy listings in listings:`, legacyListingIds);

    const allListingIds = Array.from(new Set([...projectIds, ...legacyListingIds]));
    // console.log(`[DEBUG] getByWorkspace: Union listingIds =`, allListingIds);

    if (allListingIds.length === 0) {
      // console.log(`[DEBUG] getByWorkspace: No projects or listings found, returning empty array.`);
      return [];
    }

    const pagesRef = collection(db, "pages");
    const matchedPages: any[] = [];

    for (let i = 0; i < allListingIds.length; i += 30) {
      const chunk = allListingIds.slice(i, i + 30);
      const qPages = query(pagesRef, where("listingId", "in", chunk));
      const pagesSnap = await getDocs(qPages);
      const chunkPages = pagesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      // console.log(`[DEBUG] getByWorkspace chunk: Found ${chunkPages.length} pages`);
      matchedPages.push(...chunkPages);
    }

    // console.log(`[DEBUG] getByWorkspace total pages loaded: ${matchedPages.length}`);
    return matchedPages;
  }

  static async update(id: string, data: any) {
    if (!id) throw new Error("Page ID is required for update");
    
    const docRef = doc(db, "pages", id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error(`Page with ID ${id} not found`);
    }

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(docRef, updateData);
    return { id, ...updateData };
  }

  static async saveDraft(pageId: string, content: string, userId: string) {
    const draftRef = doc(db, "drafts", `${pageId}_${userId}`);
    await updateDoc(draftRef, {
      content,
      updatedAt: new Date().toISOString()
    }).catch(async () => {
      // Create if doesn't exist
      await addDoc(collection(db, "drafts"), {
        pageId,
        userId,
        content,
        updatedAt: new Date().toISOString()
      });
    });
  }

  static async getDraft(pageId: string, userId: string) {
    const q = query(
      collection(db, "drafts"),
      where("pageId", "==", pageId),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  }

  static async delete(id: string) {
    const docRef = doc(db, "pages", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const pageData = docSnap.data();
      const listingId = pageData.listingId;
      
      // Delete page
      await deleteDoc(docRef);
      
      // Update parent listing's pages array in both collections
      const removePageFromParent = async (collectionName: string) => {
        const parentRef = doc(db, collectionName, listingId);
        const parentSnap = await getDoc(parentRef);
        if (parentSnap.exists()) {
          const parentData = parentSnap.data();
          const pages = (parentData.pages || []).filter((pId: string) => pId !== id);
          await updateDoc(parentRef, {
            pages,
            updatedAt: new Date().toISOString()
          });
          // console.log(`[DEBUG] delete Page: Removed page ${id} from parent in ${collectionName}`);
          return true;
        }
        return false;
      };

      await removePageFromParent("workspaceHubProjects");
      await removePageFromParent("listings");
    } else {
      await deleteDoc(docRef);
    }
    
    return { message: "Page deleted successfully" };
  }

  static async getAll(userId: string) {
    // console.log(`[DEBUG] getAll Pages for user: ${userId}`);
    const projectsRef = collection(db, "workspaceHubProjects");
    const qProjects = query(projectsRef, where("owner", "==", userId));
    const projectsSnap = await getDocs(qProjects);
    const projectIds = projectsSnap.docs.map(d => d.id);
    // console.log(`[DEBUG] getAll Pages: Found ${projectIds.length} projects in workspaceHubProjects`);

    const listingsRef = collection(db, "listings");
    const qListings = query(listingsRef, where("owner", "==", userId));
    const listingsSnap = await getDocs(qListings);
    const legacyListingIds = listingsSnap.docs.map(d => d.id);
    // console.log(`[DEBUG] getAll Pages: Found ${legacyListingIds.length} legacy listings`);

    const allListingIds = Array.from(new Set([...projectIds, ...legacyListingIds]));
    // console.log(`[DEBUG] getAll Pages: Union listingIds =`, allListingIds);

    if (allListingIds.length === 0) {
      // console.log(`[DEBUG] getAll Pages: No projects or listings found, returning empty array.`);
      return [];
    }

    const pagesRef = collection(db, "pages");
    const matchedPages: any[] = [];

    for (let i = 0; i < allListingIds.length; i += 30) {
      const chunk = allListingIds.slice(i, i + 30);
      const qPages = query(pagesRef, where("listingId", "in", chunk));
      const pagesSnap = await getDocs(qPages);
      const chunkPages = pagesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      // console.log(`[DEBUG] getAll Pages chunk: Found ${chunkPages.length} pages`);
      matchedPages.push(...chunkPages);
    }

    // console.log(`[DEBUG] getAll Pages total pages loaded: ${matchedPages.length}`);
    return matchedPages;
  }
}
