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

export class DocumentNexusDocumentService {
  static async getAllByUser(userId: string) {
    const q = query(
      collection(db, "documentNexusDocuments"), 
      where("owner", "==", userId),
      orderBy("updatedAt", "desc")
    );
    const snapshot = await getDocs(q);
    const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    // Auto-healing: fetch missing page counts if necessary using "doc_pages"
    const enrichedDocuments = await Promise.all(documents.map(async (docData) => {
      if (!docData.pages || docData.pages.length === 0) {
        const pagesRef = collection(db, "doc_pages");
        const pagesQuery = query(pagesRef, where("projectId", "==", docData.id));
        const pagesSnapshot = await getDocs(pagesQuery);
        
        if (pagesSnapshot.size > 0) {
          const pageIds = pagesSnapshot.docs.map(d => d.id);
          const docRef = doc(db, "documentNexusDocuments", docData.id);
          await updateDoc(docRef, { 
            pages: pageIds,
            updatedAt: new Date().toISOString()
          });
          return { ...docData, pages: pageIds };
        }
      }
      return docData;
    }));

    return enrichedDocuments;
  }

  static async getByWorkspace(workspaceId: string, userId: string) {
    const isMain = workspaceId.startsWith('nexus-main-');
    
    let documents: any[];
    if (isMain) {
      const q = query(
        collection(db, "documentNexusDocuments"),
        where("owner", "==", userId)
      );
      const snapshot = await getDocs(q);
      const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      documents = allDocs.filter(d => !d.workspaceId || d.workspaceId === workspaceId || d.workspaceId === 'main');
    } else {
      const q = query(
        collection(db, "documentNexusDocuments"), 
        where("workspaceId", "==", workspaceId),
        orderBy("updatedAt", "desc")
      );
      const snapshot = await getDocs(q);
      documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    }

    // Auto-healing: fetch missing page counts if necessary using "doc_pages"
    const enrichedDocuments = await Promise.all(documents.map(async (docData) => {
      if (!docData.pages || docData.pages.length === 0) {
        const pagesRef = collection(db, "doc_pages");
        const pagesQuery = query(pagesRef, where("projectId", "==", docData.id));
        const pagesSnapshot = await getDocs(pagesQuery);
        
        if (pagesSnapshot.size > 0) {
          const pageIds = pagesSnapshot.docs.map(d => d.id);
          const docRef = doc(db, "documentNexusDocuments", docData.id);
          await updateDoc(docRef, { 
            pages: pageIds,
            updatedAt: new Date().toISOString()
          });
          return { ...docData, pages: pageIds };
        }
      }
      return docData;
    }));

    return enrichedDocuments;
  }

  static async getById(id: string) {
    const docRef = doc(db, "documentNexusDocuments", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    
    const docData = { id: docSnap.id, ...docSnap.data() as any };
    
    // Auto-healing using "doc_pages"
    if (!docData.pages || docData.pages.length === 0) {
      const pagesRef = collection(db, "doc_pages");
      const pagesQuery = query(pagesRef, where("projectId", "==", id));
      const pagesSnapshot = await getDocs(pagesQuery);
      
      if (pagesSnapshot.size > 0) {
        const pageIds = pagesSnapshot.docs.map(d => d.id);
        await updateDoc(docRef, { 
          pages: pageIds,
          updatedAt: new Date().toISOString()
        });
        docData.pages = pageIds;
      }
    }
    
    return docData;
  }

  static async create(data: any, ownerId: string) {
    const newDoc = {
      title: data.title,
      description: data.description || "",
      workspaceId: data.workspaceId || "main",
      owner: ownerId,
      visibility: data.visibility || "private",
      tags: data.tags || [],
      addedToNexus: true, // Document Nexus is completely independent and uses its own entity
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pages: [],
      index: [],
      highlights: []
    };
    const docRef = await addDoc(collection(db, "documentNexusDocuments"), newDoc);
    
    // Update Document Nexus workspace project/document count
    if (data.workspaceId && data.workspaceId !== "main") {
      const workspaceRef = doc(db, "documentNexusWorkspaces", data.workspaceId);
      const wsSnap = await getDoc(workspaceRef);
      if (wsSnap.exists()) {
        const wsData = wsSnap.data();
        await updateDoc(workspaceRef, {
          projectCount: (wsData.projectCount || 0) + 1,
          updatedAt: new Date().toISOString()
        });
      }
    }

    return { id: docRef.id, ...newDoc };
  }

  static async update(id: string, data: any) {
    const docRef = doc(db, "documentNexusDocuments", id);
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(docRef, updateData);
    return { id, ...updateData };
  }

  static async delete(id: string) {
    // 1. Delete associated pages, highlights, and indices
    const pagesQuery = query(collection(db, "doc_pages"), where("projectId", "==", id));
    const pagesSnapshot = await getDocs(pagesQuery);
    const pagesDeletes = pagesSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
    await Promise.all(pagesDeletes);

    const indicesQuery = query(collection(db, "doc_indices"), where("projectId", "==", id));
    const indicesSnapshot = await getDocs(indicesQuery);
    const indicesDeletes = indicesSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
    await Promise.all(indicesDeletes);

    // 2. Delete the document entry itself
    await deleteDoc(doc(db, "documentNexusDocuments", id));
    
    return { message: "Document and all associated components deleted successfully" };
  }
}
