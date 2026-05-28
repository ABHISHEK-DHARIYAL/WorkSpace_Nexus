const { collection, getDocs, db, query, where, doc, updateDoc, deleteDoc, addDoc, getDoc, orderBy } = require("../config/db");

interface AuditLog {
  id?: string;
  adminEmail: string;
  adminName: string;
  action: string;
  contentOwner: string;
  contentId: string;
  contentTitle: string;
  contentType: string;
  reason?: string;
  timestamp: string;
}

class PublicExplorerService {
  // -------------------------------------------------------------
  // DASHBOARD HUB: SECURE PUBLIC ANALYTICS & HIERARCHY
  // -------------------------------------------------------------
  static async getDashboardHub(currentUserEmail?: string, isAdminUser = false) {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const workspacesSnapshot = await getDocs(collection(db, "workspaces"));
    const listingsSnapshot = await getDocs(collection(db, "listings"));
    const pagesSnapshot = await getDocs(collection(db, "pages"));

    const allUsers = usersSnapshot.docs.map(d => ({ email: d.id, ...d.data() as any }));
    const allWorkspaces = workspacesSnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
    const allListings = listingsSnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
    const allPages = pagesSnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));

    // Filter projects based on rules:
    // Regular users see ONLY visibility === "public" and isHidden !== true
    // Admins see all projects
    // ONLY Workspace Hub projects should be displayed here (exclude Document Nexus projects with addedToNexus === true)
    const publicListings = allListings.filter(l => {
      if (l.addedToNexus === true) return false;
      if (isAdminUser) return l.visibility === "public" || l.visibility === "private";
      return l.visibility === "public" && !l.isHidden;
    });

    const publicListingIds = publicListings.map(l => l.id);

    // Filter workspaces: must hold at least one public listing
    const publicWorkspaces = allWorkspaces.filter(ws => {
      return publicListings.some(l => {
        const isMain = ws.id.startsWith("main-");
        if (isMain) {
          return l.owner === ws.owner && (!l.workspaceId || l.workspaceId === ws.id || l.workspaceId === "main");
        }
        return l.workspaceId === ws.id;
      });
    });

    // Filter pages: must belong to a public listing
    const publicPages = allPages.filter(p => publicListingIds.includes(p.listingId));

    // Find unique owners who have public listings
    const uniqueOwners: string[] = Array.from(new Set(publicListings.map(l => l.owner as string)));

    // Get follows, favorites, bookmarks for counts or references
    const followsSnap = await getDocs(collection(db, "follows"));
    const follows = followsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

    const favoritesSnap = await getDocs(collection(db, "favorites"));
    const favorites = favoritesSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

    const userSummaries = uniqueOwners.map(ownerEmail => {
      const user = allUsers.find(u => u.email === ownerEmail) || {
        email: ownerEmail,
        name: ownerEmail.split("@")[0],
        username: ownerEmail.split("@")[0],
        bio: "DocCMS explorer & doc publisher",
        role: "user",
        profileImage: "",
        createdAt: new Date().toISOString()
      };

      const uWorkspaces = publicWorkspaces.filter(w => w.owner === ownerEmail);
      const uListings = publicListings.filter(l => l.owner === ownerEmail);
      const uListingIds = uListings.map(l => l.id);
      const uPages = publicPages.filter(p => uListingIds.includes(p.listingId));

      const followersCount = follows.filter(f => f.targetUserEmail === ownerEmail).length;
      const followingCount = follows.filter(f => f.followerEmail === ownerEmail).length;

      const assignedListingIds = new Set<string>();
      const workspacesData = uWorkspaces.map(w => {
        const wsListings = uListings.filter(l => {
          const isMain = w.id.startsWith("main-");
          let matches = false;
          if (isMain) {
            matches = !l.workspaceId || l.workspaceId === w.id || l.workspaceId === "main";
          } else {
            matches = l.workspaceId === w.id;
          }
          if (matches) {
            assignedListingIds.add(l.id);
          }
          return matches;
        });

        return {
          id: w.id,
          name: w.name,
          description: w.description,
          projects: wsListings.map(l => {
            const projPages = publicPages.filter(p => p.listingId === l.id);
            return {
              id: l.id,
              title: l.title,
              description: l.description,
              visibility: l.visibility || "private",
              isHidden: !!l.isHidden,
              isFeatured: !!l.isFeatured,
              tags: l.tags || [],
              createdAt: l.createdAt,
              owner: l.owner,
              pagesCount: projPages.length,
              favoritesCount: favorites.filter(fav => fav.projectId === l.id).length,
              pages: projPages.map(p => ({
                id: p.id,
                title: p.title,
                createdAt: p.createdAt
              }))
            };
          }).filter(l => l.visibility === "public" || isAdminUser)
        };
      }).filter(w => w.projects.length > 0);

      const unassignedListings = uListings.filter(l => !assignedListingIds.has(l.id));
      if (unassignedListings.length > 0) {
        workspacesData.push({
          id: `main-${ownerEmail.replace(/[^a-zA-Z0-9]/g, '-')}`,
          name: "Main Workspace",
          description: "Your default workspace for projects.",
          projects: unassignedListings.map(l => {
            const projPages = publicPages.filter(p => p.listingId === l.id);
            return {
              id: l.id,
              title: l.title,
              description: l.description,
              visibility: l.visibility || "private",
              isHidden: !!l.isHidden,
              isFeatured: !!l.isFeatured,
              tags: l.tags || [],
              createdAt: l.createdAt,
              owner: l.owner,
              pagesCount: projPages.length,
              favoritesCount: favorites.filter(fav => fav.projectId === l.id).length,
              pages: projPages.map(p => ({
                id: p.id,
                title: p.title,
                createdAt: p.createdAt
              }))
            };
          }).filter(l => l.visibility === "public" || isAdminUser)
        });
      }

      const activeWorkspaces = workspacesData.filter(w => w.projects.length > 0);

      return {
        email: ownerEmail,
        username: user.name || user.username || ownerEmail.split("@")[0],
        bio: user.bio || "DocCMS explorer & doc publisher",
        profileImage: user.profileImage || "",
        createdAt: user.createdAt || new Date().toISOString(),
        role: user.role || "user",
        projectsCount: uListings.length,
        workspacesCount: activeWorkspaces.length,
        pagesCount: uPages.length,
        followersCount,
        followingCount,
        workspaces: activeWorkspaces
      };
    }).filter(u => u.workspaces.length > 0);

    const totals = {
      users: uniqueOwners.length,
      workspaces: Array.from(new Set(publicWorkspaces.map(ws => ws.id))).length || 1,
      projects: publicListings.filter(l => l.visibility === "public").length,
      pages: publicPages.length
    };

    return {
      totals,
      userSummaries
    };
  }

  // -------------------------------------------------------------
  // DOCUMENT NEXUS: MULTI-LEVEL NAVIGATION & CONTENT
  // -------------------------------------------------------------
  static async getDocumentNexus(currentUserEmail?: string, isAdminUser = false) {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const workspacesSnapshot = await getDocs(collection(db, "workspaces"));
    const listingsSnapshot = await getDocs(collection(db, "listings"));
    const pagesSnapshot = await getDocs(collection(db, "doc_pages"));

    const allUsers = usersSnapshot.docs.map(d => ({ email: d.id, ...d.data() as any }));
    const allWorkspaces = workspacesSnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
    const allListings = listingsSnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
    const allPages = pagesSnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));

    // ONLY Document Nexus projects (addedToNexus === true) should be displayed here
    const publicListings = allListings.filter(l => {
      if (l.addedToNexus !== true) return false;
      if (isAdminUser) return true;
      return l.visibility === "public" && !l.isHidden;
    });
    const publicListingIds = publicListings.map(l => l.id);

    const publicPages = allPages.filter(p => publicListingIds.includes(p.projectId));
    const publicWorkspaces = allWorkspaces.filter(ws => {
      return publicListings.some(l => {
        const isMain = ws.id.startsWith("main-");
        if (isMain) {
          return l.owner === ws.owner && (!l.workspaceId || l.workspaceId === ws.id || l.workspaceId === "main");
        }
        return l.workspaceId === ws.id;
      });
    });

    const uniqueOwners: string[] = Array.from(new Set(publicListings.map(l => l.owner as string)));

    const nexusUsers = uniqueOwners.map(ownerEmail => {
      const user = allUsers.find(u => u.email === ownerEmail) || {
        email: ownerEmail,
        name: ownerEmail.split("@")[0],
        username: ownerEmail.split("@")[0],
        bio: "DocCMS explorer & doc publisher",
        role: "user"
      };

      const uWorkspaces = publicWorkspaces.filter(w => w.owner === ownerEmail);
      const uListings = publicListings.filter(l => l.owner === ownerEmail);

      const assignedListingIds = new Set<string>();
      const workspacesData = uWorkspaces.map(w => {
        const wsListings = uListings.filter(l => {
          const isMain = w.id.startsWith("main-");
          let matches = false;
          if (isMain) {
            matches = !l.workspaceId || l.workspaceId === w.id || l.workspaceId === "main";
          } else {
            matches = l.workspaceId === w.id;
          }
          if (matches) {
            assignedListingIds.add(l.id);
          }
          return matches;
        });

        return {
          id: w.id,
          name: w.name,
          projects: wsListings.map(l => {
            const projPages = publicPages.filter(p => p.projectId === l.id);
            return {
              id: l.id,
              title: l.title,
              description: l.description,
              visibility: l.visibility || "private",
              tags: l.tags || [],
              pages: projPages.map(p => ({
                id: p.id,
                title: p.title,
                createdAt: p.createdAt
              }))
            };
          }).filter(l => l.visibility === "public" || isAdminUser)
        };
      }).filter(w => w.projects.length > 0);

      const unassignedListings = uListings.filter(l => !assignedListingIds.has(l.id));
      if (unassignedListings.length > 0) {
        workspacesData.push({
          id: `main-${ownerEmail.replace(/[^a-zA-Z0-9]/g, '-')}`,
          name: "Main Workspace",
          projects: unassignedListings.map(l => {
            const projPages = publicPages.filter(p => p.projectId === l.id);
            return {
              id: l.id,
              title: l.title,
              description: l.description,
              visibility: l.visibility || "private",
              tags: l.tags || [],
              pages: projPages.map(p => ({
                id: p.id,
                title: p.title,
                createdAt: p.createdAt
              }))
            };
          }).filter(l => l.visibility === "public" || isAdminUser)
        });
      }

      return {
        email: ownerEmail,
        username: user.name || user.username || ownerEmail.split("@")[0],
        workspaces: workspacesData.filter(w => w.projects.length > 0)
      };
    }).filter(u => u.workspaces.length > 0);

    return nexusUsers;
  }

  // -------------------------------------------------------------
  // PROJECTS LIST & SPECIFIC LOOKUPS
  // -------------------------------------------------------------
  static async getProjects(isAdminUser = false) {
    const snap = await getDocs(collection(db, "listings"));
    const listings = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
    if (isAdminUser) return listings;
    return listings.filter(l => l.visibility === "public" && !l.isHidden);
  }

  static async getProjectById(id: string, isAdminUser = false) {
    const docRef = doc(db, "listings", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const listing = { id: snap.id, ...snap.data() as any };
    if (!isAdminUser && listing.visibility !== "public") {
      throw new Error("Private project access denied");
    }
    if (!isAdminUser && listing.isHidden) {
      throw new Error("This resource is hidden by moderators");
    }

    if (listing.addedToNexus === true) {
      const pagesQuery = query(collection(db, "doc_pages"), where("projectId", "==", id), orderBy("pageNumber", "asc"));
      const pagesSnap = await getDocs(pagesQuery);
      const pages = pagesSnap.docs.map(p => ({ id: p.id, ...p.data() as any }));

      const indicesQuery = query(collection(db, "doc_indices"), where("projectId", "==", id), orderBy("position", "asc"));
      const indicesSnap = await getDocs(indicesQuery);
      const indices = indicesSnap.docs.map(i => ({ id: i.id, ...i.data() as any }));

      listing.pagesDetails = pages;
      listing.indicesDetails = indices;
    } else {
      const pagesQuery = query(collection(db, "pages"), where("listingId", "==", id));
      const pagesSnap = await getDocs(pagesQuery);
      const pages = pagesSnap.docs.map(p => ({ id: p.id, ...p.data() as any }));

      listing.pagesDetails = pages;
    }
    
    return listing;
  }

  static async getPageById(id: string, isAdminUser = false) {
    const docRef = doc(db, "pages", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const page = { id: snap.id, ...snap.data() as any };

    // Check project visibility
    const listingRef = doc(db, "listings", page.listingId);
    const listingSnap = await getDoc(listingRef);
    if (!listingSnap.exists()) {
      throw new Error("Associated project not found");
    }

    const listing = listingSnap.data() as any;
    if (!isAdminUser && listing.visibility !== "public") {
      throw new Error("Associated project is private");
    }
    if (!isAdminUser && listing.isHidden) {
      throw new Error("This content has been hidden by moderation");
    }

    // Fetch Highlights / Annotations if enabled
    const highlightsQuery = query(collection(db, "highlights"), where("pageId", "==", id));
    const highlightsSnap = await getDocs(highlightsQuery);
    page.highlights = highlightsSnap.docs.map(h => ({ id: h.id, ...h.data() as any }));

    page.projectTitle = listing.title;
    page.projectTags = listing.tags || [];
    page.owner = listing.owner;

    return page;
  }

  // -------------------------------------------------------------
  // USER INTERACTIONS: INTERACTION WRAPPERS
  // -------------------------------------------------------------
  static async toggleBookmark(userId: string, data: { pageId: string, projectId: string }) {
    const q = query(
      collection(db, "bookmarks"),
      where("userId", "==", userId),
      where("pageId", "==", data.pageId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const deletePromises = snap.docs.map(d => deleteDoc(doc(db, "bookmarks", d.id)));
      await Promise.all(deletePromises);
      return { bookmarked: false };
    } else {
      // Fetch Page Title
      let pageTitle = "Untitled Document";
      const pSnap = await getDoc(doc(db, "pages", data.pageId));
      if (pSnap.exists()) {
        pageTitle = (pSnap.data() as any).title;
      } else {
        const dpSnap = await getDoc(doc(db, "doc_pages", data.pageId));
        if (dpSnap.exists()) {
          pageTitle = (dpSnap.data() as any).title;
        }
      }

      await addDoc(collection(db, "bookmarks"), {
        userId,
        projectId: data.projectId,
        pageId: data.pageId,
        pageTitle,
        createdAt: new Date().toISOString()
      });
      return { bookmarked: true };
    }
  }

  static async getBookmarks(userId: string) {
    const q = query(collection(db, "bookmarks"), where("userId", "==", userId));
    const snap = await getDocs(q);
    const bookmarks = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));

    try {
      const listingsSnap = await getDocs(collection(db, "listings"));
      const listingsMap = new Map();
      listingsSnap.docs.forEach(doc => {
        listingsMap.set(doc.id, doc.data());
      });

      return bookmarks.map(b => {
        const listing = listingsMap.get(b.projectId);
        return {
          ...b,
          addedToNexus: listing ? (listing.addedToNexus === true) : false,
          projectTitle: listing ? listing.title : ""
        };
      });
    } catch (err) {
      console.error("Error enriching bookmarks:", err);
      return bookmarks;
    }
  }

  static async toggleFavorite(userId: string, projectId: string) {
    const q = query(
      collection(db, "favorites"),
      where("userId", "==", userId),
      where("projectId", "==", projectId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const deletes = snap.docs.map(d => deleteDoc(doc(db, "favorites", d.id)));
      await Promise.all(deletes);

      // Clean up project bookmark from bookmarks collection
      const bkQ = query(
        collection(db, "bookmarks"),
        where("userId", "==", userId),
        where("projectId", "==", projectId),
        where("pageId", "==", "")
      );
      const bkSnap = await getDocs(bkQ);
      if (!bkSnap.empty) {
        const bkDeletes = bkSnap.docs.map(d => deleteDoc(doc(db, "bookmarks", d.id)));
        await Promise.all(bkDeletes);
      }

      return { favorited: false };
    } else {
      const projSnap = await getDoc(doc(db, "listings", projectId));
      const title = projSnap.exists() ? (projSnap.data() as any).title : "Untitled Project";
      await addDoc(collection(db, "favorites"), {
        userId,
        projectId,
        title,
        createdAt: new Date().toISOString()
      });

      // Synchronize to bookmarks collection as a project bookmark
      await addDoc(collection(db, "bookmarks"), {
        userId,
        projectId,
        pageId: "", // Empty pageId represents a project-level bookmark
        pageTitle: title,
        createdAt: new Date().toISOString()
      });

      return { favorited: true };
    }
  }

  static async toggleFollow(userId: string, targetEmail: string) {
    const q = query(
      collection(db, "follows"),
      where("followerEmail", "==", userId),
      where("targetUserEmail", "==", targetEmail)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const deletes = snap.docs.map(d => deleteDoc(doc(db, "follows", d.id)));
      await Promise.all(deletes);
      return { followed: false };
    } else {
      await addDoc(collection(db, "follows"), {
        followerEmail: userId,
        targetUserEmail: targetEmail,
        createdAt: new Date().toISOString()
      });
      return { followed: true };
    }
  }

  static async getFollowRelations(userId: string) {
    const followingQ = query(collection(db, "follows"), where("followerEmail", "==", userId));
    const followingSnap = await getDocs(followingQ);
    const following = followingSnap.docs.map(d => (d.data() as any).targetUserEmail);

    const followersQ = query(collection(db, "follows"), where("targetUserEmail", "==", userId));
    const followersSnap = await getDocs(followersQ);
    const followers = followersSnap.docs.map(d => (d.data() as any).followerEmail);

    return { following, followers };
  }

  // -------------------------------------------------------------
  // ADMIN MODERATION CONTROL SYSTEM
  // -------------------------------------------------------------
  static async logAdminActivity(log: AuditLog) {
    await addDoc(collection(db, "admin_audit_logs"), log);
  }

  static async getAdminAuditLogs() {
    const snap = await getDocs(collection(db, "admin_audit_logs"));
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  static async moderateProject(id: string, action: "hide" | "feature" | "unpublish" | "unhide" | "unfeature" | "to-private", adminUser: any, reason?: string) {
    const docRef = doc(db, "listings", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Content not found");
    const listing = snap.data() as any;

    let updatePayload: any = {};
    if (action === "hide") updatePayload.isHidden = true;
    if (action === "unhide") updatePayload.isHidden = false;
    if (action === "feature") updatePayload.isFeatured = true;
    if (action === "unfeature") updatePayload.isFeatured = false;
    if (action === "to-private") updatePayload.visibility = "private";
    if (action === "unpublish") {
      updatePayload.visibility = "private";
      updatePayload.isHidden = false;
    }

    await updateDoc(docRef, { ...updatePayload, updatedAt: new Date().toISOString() });

    await this.logAdminActivity({
      adminEmail: adminUser.email,
      adminName: adminUser.name || adminUser.email.split("@")[0],
      action: action.toUpperCase(),
      contentOwner: listing.owner,
      contentId: id,
      contentTitle: listing.title,
      contentType: "PROJECT",
      reason: reason || `Admin moderation: ${action}`,
      timestamp: new Date().toISOString()
    });

    return { success: true, listing: { id, ...listing, ...updatePayload } };
  }

  static async deleteProjectPermanently(id: string, adminUser: any, reason?: string) {
    const docRef = doc(db, "listings", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Project not found");
    const listing = snap.data() as any;

    // Delete associated pages
    const pagesQuery = query(collection(db, "pages"), where("listingId", "==", id));
    const pagesSnapshot = await getDocs(pagesQuery);
    
    for (const pageDoc of pagesSnapshot.docs) {
      // delete highlights
      const highlightsQuery = query(collection(db, "highlights"), where("pageId", "==", pageDoc.id));
      const highlightsSnapshot = await getDocs(highlightsQuery);
      for (const hDoc of highlightsSnapshot.docs) {
        await deleteDoc(hDoc.ref);
      }
      
      // delete page
      await deleteDoc(pageDoc.ref);
    }

    // Delete project itself
    await deleteDoc(docRef);

    // Bookmarks and Favorites cleanup
    const favsQ = query(collection(db, "favorites"), where("projectId", "==", id));
    const favsSnap = await getDocs(favsQ);
    for (const f of favsSnap.docs) {
      await deleteDoc(f.ref);
    }

    const bksQ = query(collection(db, "bookmarks"), where("projectId", "==", id));
    const bksSnap = await getDocs(bksQ);
    for (const b of bksSnap.docs) {
      await deleteDoc(b.ref);
    }

    // Log Activity
    await this.logAdminActivity({
      adminEmail: adminUser.email,
      adminName: adminUser.name || adminUser.email.split("@")[0],
      action: "PERMANENT_DELETE",
      contentOwner: listing.owner,
      contentId: id,
      contentTitle: listing.title,
      contentType: "PROJECT",
      reason: reason || "Permanent administrative deletion",
      timestamp: new Date().toISOString()
    });

    return { message: "Content and all cascade references permanently purged." };
  }
}


module.exports = {
  PublicExplorerService
};
