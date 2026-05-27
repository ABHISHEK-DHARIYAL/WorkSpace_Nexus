import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { doc, getDoc, setDoc, deleteDoc, db, collection, query, where, getDocs } from "../config/firebase";
import { ENV } from "../config/env";

const isAdminEmail = (email: string): boolean => {
  return false;
};

export class AuthService {
  static async signup({ email, password, isSocial }: any) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const userRef = doc(db, "users", cleanEmail);
    const userDoc = await getDoc(userRef);
    const role = isAdminEmail(cleanEmail) ? "admin" : "user";

    if (userDoc.exists()) {
      const user = userDoc.data() as any;
      if (isSocial) {
        const storedRole = (user as any).role || role;
        
        // Securely write a default hashed password if none exists in Firestore
        // This ensures they have a valid password set without overwriting any existing ones
        if (!(user as any).password) {
          const hashedPassword = await bcrypt.hash("GOOGLE_AUTH_EXTERNAL", 10);
          await setDoc(userRef, { password: hashedPassword, role: storedRole }, { merge: true });
        } else if ((user as any).role !== storedRole) {
          await setDoc(userRef, { role: storedRole }, { merge: true });
        }

        const token = jwt.sign({ email: cleanEmail, role: storedRole }, ENV.JWT_SECRET, { expiresIn: "1d" });
        return { token, user: { email: cleanEmail, role: storedRole } };
      }

      // If the user already exists during standard registration, reject it to prevent bypassing login.
      throw new Error("Signup failed. Account already exists. Please log in instead.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { 
      email: cleanEmail, 
      password: hashedPassword, 
      role, 
      isSocial: !!isSocial,
      createdAt: new Date().toISOString() 
    };
    
    await setDoc(userRef, newUser);
    const token = jwt.sign({ email: cleanEmail, role }, ENV.JWT_SECRET, { expiresIn: "1d" });
    return { token, user: { email: cleanEmail, role } };
  }

  static async login({ email, password }: any) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const userRef = doc(db, "users", cleanEmail);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error("Invalid credentials");
    }
    
    const user = userDoc.data() as any;
    
    // Ensure user has a password stored before comparing
    if (!user.password) {
      throw new Error("Invalid credentials");
    }

    // Standard bcrypt-based authentication only
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) throw new Error("Invalid credentials");
    
    const role = user.role || 'user';
    
    const token = jwt.sign({ email: cleanEmail, role }, ENV.JWT_SECRET, { expiresIn: "1d" });
    return { token, user: { email: cleanEmail, role } };
  }

  static async updatePassword(email: string, password: string, currentRole: string) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRef = doc(db, "users", cleanEmail);
    
    await setDoc(userRef, { 
      password: hashedPassword,
      isSocial: false,
      role: currentRole || "user",
      createdAt: new Date().toISOString()
    }, { merge: true });
    
    return { message: "Password updated successfully" };
  }

  static async deleteAccount(email: string) {
    const cleanEmail = (email || "").trim().toLowerCase();
    
    // Check user existence
    const userRef = doc(db, "users", cleanEmail);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    try {
      console.log(`[AuthService.deleteAccount] Commencing cascading database purge for: ${cleanEmail}`);

      // 1. Find and delete all listings (projects) owned by the user
      const listingsRef = collection(db, "listings");
      const listingsQ = query(listingsRef, where("owner", "==", cleanEmail));
      const listingsSnap = await getDocs(listingsQ);

      for (const listingDoc of listingsSnap.docs) {
        const listingId = listingDoc.id;

        // A. Delete pages associated with the listing
        const pagesRef = collection(db, "pages");
        const pagesQ = query(pagesRef, where("listingId", "==", listingId));
        const pagesSnap = await getDocs(pagesQ);

        for (const pageDoc of pagesSnap.docs) {
          const pageId = pageDoc.id;

          // Delete highlights associated with this page
          const highlightsRef = collection(db, "highlights");
          const highlightsQ = query(highlightsRef, where("pageId", "==", pageId));
          const highlightsSnap = await getDocs(highlightsQ);
          for (const hDoc of highlightsSnap.docs) {
            await deleteDoc(hDoc.ref);
          }

          // Delete the page
          await deleteDoc(pageDoc.ref);
        }

        // B. Delete doc_pages (Document Nexus pages) associated with the listing
        const docPagesRef = collection(db, "doc_pages");
        const docPagesQ = query(docPagesRef, where("projectId", "==", listingId));
        const docPagesSnap = await getDocs(docPagesQ);
        for (const dpDoc of docPagesSnap.docs) {
          await deleteDoc(dpDoc.ref);
        }

        // C. Delete doc_indices (Document Nexus outline indices) associated with the listing
        const docIndicesRef = collection(db, "doc_indices");
        const docIndicesQ = query(docIndicesRef, where("projectId", "==", listingId));
        const docIndicesSnap = await getDocs(docIndicesQ);
        for (const diDoc of docIndicesSnap.docs) {
          await deleteDoc(diDoc.ref);
        }

        // D. Delete bookmarks of this project
        const bookmarksRef = collection(db, "bookmarks");
        const bkQ = query(bookmarksRef, where("projectId", "==", listingId));
        const bkSnap = await getDocs(bkQ);
        for (const bkDoc of bkSnap.docs) {
          await deleteDoc(bkDoc.ref);
        }

        // E. Delete favorites of this project
        const favoritesRef = collection(db, "favorites");
        const favQ = query(favoritesRef, where("projectId", "==", listingId));
        const favSnap = await getDocs(favQ);
        for (const favDoc of favSnap.docs) {
          await deleteDoc(favDoc.ref);
        }

        // F. Finally delete the listing itself
        await deleteDoc(listingDoc.ref);
      }

      // 2. Find and delete workspaces owned by the user
      const workspacesRef = collection(db, "workspaces");
      const workspacesQ = query(workspacesRef, where("owner", "==", cleanEmail));
      const workspacesSnap = await getDocs(workspacesQ);
      for (const wsDoc of workspacesSnap.docs) {
        await deleteDoc(wsDoc.ref);
      }

      // 3. Find and delete bookmarks, favorites, follows created by this user
      const userBookmarksQ = query(collection(db, "bookmarks"), where("userEmail", "==", cleanEmail));
      const userBookmarksSnap = await getDocs(userBookmarksQ);
      for (const bDoc of userBookmarksSnap.docs) {
        await deleteDoc(bDoc.ref);
      }

      const userFavsQ = query(collection(db, "favorites"), where("userEmail", "==", cleanEmail));
      const userFavsSnap = await getDocs(userFavsQ);
      for (const fDoc of userFavsSnap.docs) {
        await deleteDoc(fDoc.ref);
      }

      const userFollowsQ = query(collection(db, "follows"), where("userEmail", "==", cleanEmail));
      const userFollowsSnap = await getDocs(userFollowsQ);
      for (const flDoc of userFollowsSnap.docs) {
        await deleteDoc(flDoc.ref);
      }

    } catch (err) {
      console.error("[AuthService.deleteAccount] Error during cascade steps:", err);
    }

    // 4. Finally, delete primary user document
    await deleteDoc(userRef);
    console.log(`[AuthService.deleteAccount] Successfully deleted user account: ${cleanEmail}`);
    return { message: "Account deleted successfully" };
  }
}
