const { collection, getDocs, getDoc, doc, addDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, db } = require("../config/db");

class WorkspaceService {
  static async getAllByUser(userId: string) {
    const q = query(
      collection(db, "workspaces"), 
      where("owner", "==", userId),
      orderBy("updatedAt", "desc")
    );
    const snapshot = await getDocs(q);
    let workspaces = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    if (workspaces.length === 0) {
      const defaultId = `main-${userId.replace(/[^a-zA-Z0-9]/g, '-')}`;
      const defaultWs = {
        name: "Main Workspace",
        description: "Your default workspace for projects.",
        owner: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectCount: 0
      };
      await setDoc(doc(db, "workspaces", defaultId), defaultWs);
      workspaces = [{ id: defaultId, ...defaultWs }];
    }

    // Fetch all listings owned by this user to dynamically calculate and auto-heal projectCount (excluding Document Nexus projects)
    try {
      const listingsQuery = query(
        collection(db, "listings"),
        where("owner", "==", userId)
      );
      const listingsSnapshot = await getDocs(listingsQuery);
      const allListings = listingsSnapshot.docs.map(d => d.data());

      for (const ws of workspaces) {
        const isMain = ws.id.startsWith('main-');
        const wsListings = allListings.filter(l => {
          if (l.addedToNexus === true) return false;
          if (isMain) {
            return !l.workspaceId || l.workspaceId === ws.id || l.workspaceId === 'main';
          }
          return l.workspaceId === ws.id;
        });
        const realCount = wsListings.length;
        if (ws.projectCount !== realCount) {
          const docRef = doc(db, "workspaces", ws.id);
          await updateDoc(docRef, { projectCount: realCount });
          ws.projectCount = realCount;
        }
      }
    } catch (err) {
      console.error("Failed to dynamically sync project counts:", err);
    }

    return workspaces;
  }

  static async getById(id: string) {
    const docRef = doc(db, "workspaces", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const ws = { id: docSnap.id, ...docSnap.data() as any };

    // Dynamically calculate and sync projectCount (excluding Document Nexus projects)
    try {
      const listingsQuery = query(
        collection(db, "listings"),
        where("owner", "==", ws.owner)
      );
      const listingsSnapshot = await getDocs(listingsQuery);
      const isMain = ws.id.startsWith('main-');
      const wsListings = listingsSnapshot.docs.map(d => d.data()).filter(l => {
        if (l.addedToNexus === true) return false;
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
      console.error("Failed to dynamically sync projectCount for workspace by id:", err);
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
    const docRef = await addDoc(collection(db, "workspaces"), newWorkspace);
    return { id: docRef.id, ...newWorkspace };
  }

  static async update(id: string, data: any) {
    const docRef = doc(db, "workspaces", id);
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(docRef, updateData);
    return { id, ...updateData };
  }

  static async delete(id: string) {
    // Note: We might want to handle what happens to listings in this workspace
    // For now, just delete the workspace
    await deleteDoc(doc(db, "workspaces", id));
    return { message: "Workspace deleted successfully" };
  }
}


module.exports = {
  WorkspaceService
};
