import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc,
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  db
} from "../config/firebase";

export class DocumentNexusWorkspaceService {
  static async getAllByUser(userId: string) {
    const q = query(
      collection(db, "documentNexusWorkspaces"), 
      where("owner", "==", userId)
    );
    const snapshot = await getDocs(q);
    let workspaces = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    workspaces.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

    if (workspaces.length === 0) {
      const defaultId = `nexus-main-${userId.replace(/[^a-zA-Z0-9]/g, '-')}`;
      const defaultWs = {
        name: "Main Nexus Workspace",
        description: "Your default workspace for documents.",
        owner: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectCount: 0
      };
      await setDoc(doc(db, "documentNexusWorkspaces", defaultId), defaultWs);
      workspaces = [{ id: defaultId, ...defaultWs }];
    }

    // Fetch all listings owned by this user to dynamically calculate and auto-heal projectCount
    try {
      const listingsQuery = query(
        collection(db, "documentNexusDocuments"),
        where("owner", "==", userId)
      );
      const listingsSnapshot = await getDocs(listingsQuery);
      const allListings = listingsSnapshot.docs.map(d => d.data());

      for (const ws of workspaces) {
        const isMain = ws.id.startsWith('nexus-main-');
        const wsListings = allListings.filter(l => {
          if (isMain) {
            return !l.workspaceId || l.workspaceId === ws.id || l.workspaceId === 'main';
          }
          return l.workspaceId === ws.id;
        });
        const realCount = wsListings.length;
        if (ws.projectCount !== realCount) {
          const docRef = doc(db, "documentNexusWorkspaces", ws.id);
          await updateDoc(docRef, { projectCount: realCount });
          ws.projectCount = realCount;
        }
      }
    } catch (err) {
      console.error("Failed to dynamically sync Document Nexus document counts:", err);
    }

    return workspaces;
  }

  static async getById(id: string) {
    const docRef = doc(db, "documentNexusWorkspaces", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const ws = { id: docSnap.id, ...docSnap.data() as any };

    // Dynamically calculate and sync projectCount
    try {
      const listingsQuery = query(
        collection(db, "documentNexusDocuments"),
        where("owner", "==", ws.owner)
      );
      const listingsSnapshot = await getDocs(listingsQuery);
      const isMain = ws.id.startsWith('nexus-main-');
      const wsListings = listingsSnapshot.docs.map(d => d.data()).filter(l => {
        if (isMain) {
          return !l.workspaceId || l.workspaceId === ws.id || l.workspaceId === 'main';
        }
        return l.workspaceId === ws.id;
      });
      const realCount = wsListings.length;
      if (ws.projectCount !== realCount) {
        await updateDoc(docRef, { projectCount: realCount });
        ws.projectCount = realCount;
      }
    } catch (err) {
      console.error("Failed to dynamically sync documentCount for workspace by id:", err);
    }

    return ws;
  }

  static async create(data: any, ownerId: string) {
    const newWorkspace = {
      name: data.name,
      description: data.description || "",
      owner: ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectCount: 0
    };
    const docRef = await addDoc(collection(db, "documentNexusWorkspaces"), newWorkspace);
    return { id: docRef.id, ...newWorkspace };
  }

  static async update(id: string, data: any) {
    const docRef = doc(db, "documentNexusWorkspaces", id);
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(docRef, updateData);
    return { id, ...updateData };
  }

  static async delete(id: string) {
    await deleteDoc(doc(db, "documentNexusWorkspaces", id));
    return { message: "Document Nexus workspace deleted successfully" };
  }
}
