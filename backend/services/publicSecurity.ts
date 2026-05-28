const { db, doc, getDoc } = require("../config/db");

class PublicSecurityService {
  /**
   * Asserts if the given user is an administrator.
   */
  static isAdmin(user: any): boolean {
    return user && user.role === "admin";
  }

  /**
   * Validates if a resource has public visibility or is owned by the requester.
   */
  static async canAccess(resourceType: "workspace" | "project" | "page", id: string, user: any): Promise<boolean> {
    if (this.isAdmin(user)) return true;

    try {
      if (resourceType === "workspace") {
        const snap = await getDoc(doc(db, "workspaces", id));
        if (!snap.exists()) return false;
        const ws = snap.data() as any;
        return ws.visibility === "public" || (user && ws.owner === user.email);
      }

      if (resourceType === "project") {
        const snap = await getDoc(doc(db, "listings", id));
        if (!snap.exists()) return false;
        const project = snap.data() as any;
        return project.visibility === "public" || (user && project.owner === user.email);
      }

      if (resourceType === "page") {
        const snap = await getDoc(doc(db, "pages", id));
        if (!snap.exists()) return false;
        const page = snap.data() as any;
        
        // A page's visibility depends on the parent project listing's visibility
        const parentSnap = await getDoc(doc(db, "listings", page.listingId));
        if (!parentSnap.exists()) return false;
        const project = parentSnap.data() as any;
        return project.visibility === "public" || (user && project.owner === user.email);
      }
    } catch (err) {
      console.error("[PublicSecurityService] canAccess error:", err);
    }

    return false;
  }

  /**
   * Ensures that private content is strictly inaccessible or shielded.
   */
  static shieldPrivateContent(visibility: string, actionName: string) {
    if (visibility !== "public") {
      throw new Error(`Security constraint violation: Shielding private database nodes from dynamic moderation routine "${actionName}".`);
    }
  }
}


module.exports = {
  PublicSecurityService
};
