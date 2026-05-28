const { collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, db } = require("../config/db");

class ListingService {
  static async getAllByUser(userId: string) {
    const q = query(
      collection(db, "listings"), 
      where("owner", "==", userId),
      orderBy("updatedAt", "desc")
    );
    const snapshot = await getDocs(q);
    const listings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    // Auto-healing: fetch missing page counts if necessary
    const enrichedListings = await Promise.all(listings.map(async (l) => {
      // If pages array is truly missing or explicitly empty, check the pages collection
      if (!l.pages || l.pages.length === 0) {
        const pagesRef = collection(db, "pages");
        const pagesQuery = query(pagesRef, where("listingId", "==", l.id));
        const pagesSnapshot = await getDocs(pagesQuery);
        
        if (pagesSnapshot.size > 0) {
          const pageIds = pagesSnapshot.docs.map(d => d.id);
          // Update the listing document in Firestore to persist the fix
          const listingRef = doc(db, "listings", l.id);
          await updateDoc(listingRef, { 
            pages: pageIds,
            updatedAt: new Date().toISOString()
          });
          return { ...l, pages: pageIds };
        }
      }
      return l;
    }));

    return enrichedListings;
  }

  static async getByWorkspace(workspaceId: string, userId: string) {
    const isMain = workspaceId.startsWith('main-');
    
    let listings: any[];
    if (isMain) {
      const q = query(
        collection(db, "listings"),
        where("owner", "==", userId)
      );
      const snapshot = await getDocs(q);
      const allListings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      listings = allListings.filter(l => !l.workspaceId || l.workspaceId === workspaceId || l.workspaceId === 'main');
    } else {
      const q = query(
        collection(db, "listings"), 
        where("workspaceId", "==", workspaceId),
        orderBy("updatedAt", "desc")
      );
      const snapshot = await getDocs(q);
      listings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    }

    // Auto-healing: fetch missing page counts if necessary
    const enrichedListings = await Promise.all(listings.map(async (l) => {
      if (!l.pages || l.pages.length === 0) {
        const pagesRef = collection(db, "pages");
        const pagesQuery = query(pagesRef, where("listingId", "==", l.id));
        const pagesSnapshot = await getDocs(pagesQuery);
        
        if (pagesSnapshot.size > 0) {
          const pageIds = pagesSnapshot.docs.map(d => d.id);
          const listingRef = doc(db, "listings", l.id);
          await updateDoc(listingRef, { 
            pages: pageIds,
            updatedAt: new Date().toISOString()
          });
          return { ...l, pages: pageIds };
        }
      }
      return l;
    }));

    return enrichedListings;
  }

  static async getById(id: string) {
    const docRef = doc(db, "listings", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    
    const listing = { id: docSnap.id, ...docSnap.data() as any };
    
    // Auto-healing
    if (!listing.pages || listing.pages.length === 0) {
      const pagesRef = collection(db, "pages");
      const pagesQuery = query(pagesRef, where("listingId", "==", id));
      const pagesSnapshot = await getDocs(pagesQuery);
      
      if (pagesSnapshot.size > 0) {
        const pageIds = pagesSnapshot.docs.map(d => d.id);
        await updateDoc(docRef, { 
          pages: pageIds,
          updatedAt: new Date().toISOString()
        });
        listing.pages = pageIds;
      }
    }
    
    return listing;
  }

  static async searchInWorkspace(workspaceId: string, searchTerm: string, userId: string) {
    const listings = await this.getByWorkspace(workspaceId, userId);
    const listingIds = listings.map(l => l.id);
    
    if (listingIds.length === 0) return { listings: [], pages: [], highlights: [] };

    // Search in listings
    const term = searchTerm.toLowerCase();
    const matchedListings = listings.filter(l => 
      l.title.toLowerCase().includes(term) || 
      l.description.toLowerCase().includes(term)
    );

    // Search in Pages
    // For large scale we'd need Meilisearch/Algolia. For now, fetch pages of these listings.
    // Optimization: Only search if term is > 2 chars
    let matchedPages: any[] = [];
    if (searchTerm.length > 2) {
      const pagesRef = collection(db, "pages");
      // Firestore 'in' query limit is 30, so we might need batches if many projects
      // But usually workspaces have < 30 projects
      const chunks = [];
      for (let i = 0; i < listingIds.length; i += 30) {
        chunks.push(listingIds.slice(i, i + 30));
      }

      for (const chunk of chunks) {
        const q = query(pagesRef, where("listingId", "in", chunk));
        const snap = await getDocs(q);
        const pages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
        const filtered = pages.filter(p => 
          p.title.toLowerCase().includes(term) || 
          p.content.toLowerCase().includes(term)
        );
        matchedPages = [...matchedPages, ...filtered];
      }
    }

    return {
      listings: matchedListings,
      pages: matchedPages
    };
  }

  static async create(data: any, ownerId: string) {
    const newListing = {
      title: data.title,
      description: data.description || "",
      workspaceId: data.workspaceId || "main", // Default to 'main' for backward compatibility
      owner: ownerId,
      visibility: data.visibility || "private",
      tags: data.tags || [],
      addedToNexus: data.addedToNexus !== undefined ? !!data.addedToNexus : false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pages: [],
      index: [],
      highlights: []
    };
    const docRef = await addDoc(collection(db, "listings"), newListing);
    
    // Update workspace project count (only if not added to Nexus)
    if (data.workspaceId && data.workspaceId !== "main" && data.addedToNexus !== true) {
      const workspaceRef = doc(db, "workspaces", data.workspaceId);
      const wsSnap = await getDoc(workspaceRef);
      if (wsSnap.exists()) {
        const wsData = wsSnap.data();
        await updateDoc(workspaceRef, {
          projectCount: (wsData.projectCount || 0) + 1,
          updatedAt: new Date().toISOString()
        });
      }
    }

    return { id: docRef.id, ...newListing };
  }

  static async update(id: string, data: any) {
    const docRef = doc(db, "listings", id);
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(docRef, updateData);
    return { id, ...updateData };
  }

  static async delete(id: string) {
    // 1. Delete associated pages
    const pagesQuery = query(collection(db, "pages"), where("listingId", "==", id));
    const pagesSnapshot = await getDocs(pagesQuery);
    
    const deleteBatch = pagesSnapshot.docs.map(async (pageDoc) => {
      // Also delete highlights for this page
      const highlightsQuery = query(collection(db, "highlights"), where("pageId", "==", pageDoc.id));
      const highlightsSnapshot = await getDocs(highlightsQuery);
      const highlightDeletes = highlightsSnapshot.docs.map(hDoc => deleteDoc(hDoc.ref));
      await Promise.all(highlightDeletes);
      
      // Delete page
      return deleteDoc(pageDoc.ref);
    });
    
    await Promise.all(deleteBatch);

    // 2. Delete the listing itself
    await deleteDoc(doc(db, "listings", id));
    
    return { message: "Listing and all associated content deleted successfully" };
  }
}


module.exports = {
  ListingService
};
