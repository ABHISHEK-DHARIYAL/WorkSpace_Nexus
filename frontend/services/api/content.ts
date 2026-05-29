import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  query, 
  where, 
  deleteDoc, 
  orderBy 
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';

// Helper to standardise Firestore Error diagnosing conforming to FirestoreErrorInfo
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
    },
    operationType,
    path
  };
  console.error('[Content Firestore Error]', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Memory / LocalStorage Fallback for high-durability Sandbox simulation
const getLocalFallbackContents = (): any[] => {
  try {
    const local = localStorage.getItem('workspace_nexus_sandbox_contents');
    if (local) {
      return JSON.parse(local);
    }
  } catch (err) {
    console.error("Local sandbox storage access failed:", err);
  }
  
  // High-fidelity standard seed documentation articles for the sandbox
  const seeds = [
    {
      id: "seed-doc-1",
      title: "Introduction to Workspace Nexus",
      slug: "introduction-to-workspace-nexus",
      body: `<h3>Welcome to Workspace Nexus!</h3>
             <p>Workspace Nexus is a modern knowledge repository and enterprise doc framework styled for teams who value speed, efficiency, and clarity.</p>
             <p>With fully integrated high-fidelity editing modules, local persistence capabilities, and direct outline navigation, managing rich project folders and documentation files has never been more intuitive.</p>`,
      category: "Guides",
      excerpt: "Get started with Workspace Nexus and learn about its core concepts, interface layout, and direct publishing workflow.",
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60",
      createdBy: "system@workspace.com",
      createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString()
    },
    {
      id: "seed-doc-2",
      title: "Direct Firestore Client Architectures",
      slug: "direct-firestore-client-architectures",
      body: `<h3>Going Backendless with Live Real-time Synced SDKs</h3>
             <p>Integrating application layers directly with client-side Firestore improves page latency, removes API proxy round-trips, and secures database access through hardened Firestore security rules.</p>
             <p>This approach eliminates standard express backend container single-point-of-failure vulnerabilities, saving operational costs and reducing API latency to zero.</p>`,
      category: "Architecture",
      excerpt: "Deep dive into direct Firestore integration, zero-trust attribute-based access control, and browser authentication logic.",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60",
      createdBy: "architecture@workspace.com",
      createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
    }
  ];
  try {
    localStorage.setItem('workspace_nexus_sandbox_contents', JSON.stringify(seeds));
  } catch (sErr) {
    console.warn("Could not save fallback content seeds:", sErr);
  }
  return seeds;
};

const saveLocalFallbackContents = (contents: any[]) => {
  try {
    localStorage.setItem('workspace_nexus_sandbox_contents', JSON.stringify(contents));
  } catch (err) {
    console.error("LocalStorage write error on contents:", err);
  }
};

export const contentService = {
  getAll: async () => {
    if (!db) {
      console.log("[Content Service] Sandbox: resolved getAll from localStorage.");
      return { data: getLocalFallbackContents() };
    }
    
    const pathForDocs = 'contents';
    try {
      const q = query(collection(db, pathForDocs), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      // Auto seed live collection if it's empty to prevent blank repository index screen
      if (items.length === 0) {
        // Only seed if current user is signed in as admin@workspace.com
        const userEmail = auth?.currentUser?.email;
        const isUserAdmin = userEmail === 'admin@workspace.com';
        if (isUserAdmin) {
          const fallbacks = getLocalFallbackContents();
          for (const item of fallbacks) {
            const { id, ...itemData } = item;
            try {
              await addDoc(collection(db, pathForDocs), {
                ...itemData,
                createdAt: new Date().toISOString()
              });
            } catch (seedErr) {
              console.warn("Seeding content document failed:", seedErr);
            }
          }
          // Refetch after seed execution
          const freshSnapshot = await getDocs(q);
          const seededItems = freshSnapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          }));
          return { data: seededItems };
        } else {
          // If not admin, return fallback seeds directly so the guest user can see them
          return { data: getLocalFallbackContents() };
        }
      }
      return { data: items };
    } catch (err) {
      console.warn("[Content Service] Live Firestore getAll query failed, falling back to local sandbox memory:", err);
      return { data: getLocalFallbackContents() };
    }
  },

  getBySlug: async (slug: string) => {
    if (!db) {
      console.log(`[Content Service] Sandbox: resolved getBySlug (${slug}) from localStorage.`);
      const local = getLocalFallbackContents();
      const item = local.find(x => x.slug === slug);
      return { data: item || null };
    }

    const pathForDocs = 'contents';
    try {
      const q = query(collection(db, pathForDocs), where("slug", "==", slug));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return { data: null };
      }
      const docSnap = snapshot.docs[0];
      return {
        data: {
          id: docSnap.id,
          ...docSnap.data()
        }
      };
    } catch (err) {
      console.warn(`[Content Service] Live Firestore getBySlug query failed for ${slug}, falling back to local sandbox memory:`, err);
      const local = getLocalFallbackContents();
      const item = local.find(x => x.slug === slug);
      return { data: item || null };
    }
  },

  create: async (data: any) => {
    const { title, body, category, excerpt, image } = data;
    const slug = title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
    const creatorEmail = auth?.currentUser?.email || "anonymous@workspace.com";
    
    const newContent = {
      title,
      slug,
      body,
      category: category || "General",
      excerpt: excerpt || body.substring(0, 150).replace(/<[^>]*>/g, '') + "...",
      image: image || "",
      createdBy: creatorEmail,
      createdAt: new Date().toISOString()
    };

    if (!db) {
      console.log("[Content Service] Sandbox: stored content locally.");
      const local = getLocalFallbackContents();
      const createdItem = { id: Math.random().toString(36).substring(2, 9), ...newContent };
      local.unshift(createdItem);
      saveLocalFallbackContents(local);
      return { data: createdItem };
    }

    const pathForDocs = 'contents';
    try {
      const docRef = await addDoc(collection(db, pathForDocs), newContent);
      return {
        data: {
          id: docRef.id,
          ...newContent
        }
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, pathForDocs);
    }
  },

  delete: async (id: string) => {
    if (!db) {
      console.log(`[Content Service] Sandbox: deleted content ${id} from localStorage.`);
      const local = getLocalFallbackContents();
      const filtered = local.filter(x => x.id !== id);
      saveLocalFallbackContents(filtered);
      return { data: { success: true } };
    }

    const pathForDocs = 'contents';
    try {
      await deleteDoc(doc(db, pathForDocs, id));
      return { data: { success: true } };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${pathForDocs}/${id}`);
    }
  }
};
