const { db, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, addDoc } = require("../config/db");

// Localized lists of spam and banned words for strict quality filtering
const SPAM_KEYWORDS = [
  "free pills", "cheap poker", "essay buy", "viagra", "make cash fast", 
  "click here to get free", "hot deals", "earn cash", "earn $", 
  "online casino", "lottery cheat", "payday loan", "replica watch"
];

const BANNED_WORDS = [
  "abuseword1", "fuck", "asshole", "bastard", "bitch", "profanity123", "nsfwcontent"
];

class PublicModerationService {

  // -------------------------------------------------------------
  // PUBLIC REPORTING LOGIC
  // -------------------------------------------------------------
  static async reportContent(data: {
    targetId: string;
    targetType: "workspace" | "project" | "page" | "upload";
    reason: "Spam" | "Abuse" | "Copied Content" | "Misleading Information" | "NSFW" | "Other";
    comment?: string;
    userEmail: string;
  }) {
    if (!data.targetId || !data.targetType) throw new Error("Missing target parameters.");
    
    const newReport = {
      targetId: data.targetId,
      targetType: data.targetType,
      reason: data.reason,
      comment: data.comment || "",
      userEmail: data.userEmail || "anonymous@example.com",
      status: "pending", // pending, resolved, dismissed
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, "reports"), newReport);

    // Increment local report counter system on target if applicable
    if (data.targetType === "project") {
      try {
        const listRef = doc(db, "listings", data.targetId);
        const listSnap = await getDoc(listRef);
        if (listSnap.exists()) {
          const lData = listSnap.data() as any;
          const currentCount = lData.reportCount || 0;
          await updateDoc(listRef, { reportCount: currentCount + 1 });
        }
      } catch (err) {
        console.warn("Could not increment reportCount on project", err);
      }
    }

    return { id: docRef.id, ...newReport };
  }

  static async getReports() {
    const snap = await getDocs(collection(db, "reports"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
  }

  static async handleReportAction(reportId: string, action: "approve" | "dismiss" | "delete", adminUser: any, comment?: string) {
    const reportRef = doc(db, "reports", reportId);
    const reportSnap = await getDoc(reportRef);
    if (!reportSnap.exists()) throw new Error("Report not found");
    const report = reportSnap.data() as any;

    if (action === "dismiss") {
      await updateDoc(reportRef, { status: "dismissed" });
    } else if (action === "approve") {
      await updateDoc(reportRef, { status: "resolved" });
    }

    // Log administrative action
    await this.logModerationActivity({
      adminEmail: adminUser.email,
      adminName: adminUser.name || adminUser.email.split("@")[0],
      action: `REPORT_${action.toUpperCase()}`,
      targetContent: `Report: ${reportId} targeting ${report.targetType} (${report.targetId})`,
      targetUser: report.userEmail,
      reason: comment || `Report handled: ${action}`,
      ipAddress: "127.0.0.1"
    });

    return { success: true, status: action === "dismiss" ? "dismissed" : "resolved" };
  }

  // -------------------------------------------------------------
  // COMPREHENSIVE CASCADE DELETION WORKFLOWS
  // -------------------------------------------------------------
  
  /**
   * Performs absolute deletion of a workspace and cascade-purges resources:
   * 1. Check if the workspace is public
   * 2. Remove all projects (listings) inside it (including pages, annotations, highlights, bookmarks, comments, indices, files, etc.)
   * 3. Update public slugs/indexing counts.
   */
  static async deleteWorkspacePermanently(id: string, adminUser: any, reason?: string, ipAddress?: string) {
    const wsRef = doc(db, "workspaces", id);
    const wsSnap = await getDoc(wsRef);
    if (!wsSnap.exists()) throw new Error("Workspace not found");
    const workspace = wsSnap.data() as any;

    if (workspace.visibility !== "public") {
      throw new Error("Security constraint violation: Private workspace cannot be deleted via the public control center.");
    }

    const owner = workspace.owner || "unknown";

    // Cascade: Find all listings/projects mapped to this workspace
    const lisSnap = await getDocs(collection(db, "listings"));
    const matchingListings = lisSnap.docs
      .map(d => ({ id: d.id, ...d.data() as any }))
      .filter(l => l.workspaceId === id || (id.startsWith("main-") && l.owner === workspace.owner && (!l.workspaceId || l.workspaceId === "main" || l.workspaceId === id)));

    for (const listing of matchingListings) {
      await this.deleteProjectCascaded(listing.id);
    }

    // Delete workspace itself
    await deleteDoc(wsRef);

    // Track in Moderation Log
    await this.logModerationActivity({
      adminEmail: adminUser.email,
      adminName: adminUser.name || adminUser.email.split("@")[0],
      action: "DELETE_PUBLIC_WORKSPACE",
      targetContent: `Workspace: ${workspace.name} (ID: ${id})`,
      targetUser: owner,
      reason: reason || "Permanent administrative deletion of public workspace",
      ipAddress: ipAddress || "127.0.0.1"
    });

    return { success: true, id, message: `Workspace "${workspace.name}" and all cascade elements permanently removed.` };
  }

  /**
   * Cascade-deletes a single public project (listing)
   */
  static async deleteProjectPermanently(id: string, adminUser: any, reason?: string, ipAddress?: string) {
    const docRef = doc(db, "listings", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Project not found");
    const listing = snap.data() as any;

    if (listing.visibility !== "public") {
      throw new Error("Security constraint violation: Private project shielded.");
    }

    await this.deleteProjectCascaded(id);

    // Delete project itself
    await deleteDoc(docRef);

    // Log Activity
    await this.logModerationActivity({
      adminEmail: adminUser.email,
      adminName: adminUser.name || adminUser.email.split("@")[0],
      action: "DELETE_PUBLIC_PROJECT",
      targetContent: `Project: ${listing.title} (ID: ${id})`,
      targetUser: listing.owner || "unknown",
      reason: reason || "Permanent administrative deletion of public project",
      ipAddress: ipAddress || "127.0.0.1"
    });

    return { success: true, id, message: "Project and all cascade references permanently purged." };
  }

  /**
   * Cascade-deletes a public page
   */
  static async deletePagePermanently(id: string, adminUser: any, reason?: string, ipAddress?: string) {
    const pageRef = doc(db, "pages", id);
    const snap = await getDoc(pageRef);
    if (!snap.exists()) throw new Error("Page not found");
    const page = snap.data() as any;

    // Check parent project publicity
    const parentRef = doc(db, "listings", page.listingId);
    const pSnap = await getDoc(parentRef);
    if (pSnap.exists()) {
      const parent = pSnap.data() as any;
      if (parent.visibility !== "public") {
        throw new Error("Security constraint violation: Page is private.");
      }
    }

    // Delete highlights & annotations
    const hSnap = await getDocs(collection(db, "highlights"));
    const matchingH = hSnap.docs.filter(d => (d.data() as any).pageId === id);
    for (const h of matchingH) {
      await deleteDoc(h.ref);
    }

    // Delete bookmarks referencing this page
    const bSnap = await getDocs(collection(db, "bookmarks"));
    const matchingB = bSnap.docs.filter(d => (d.data() as any).pageId === id);
    for (const b of matchingB) {
      await deleteDoc(b.ref);
    }

    // Delete public index items
    const iSnap = await getDocs(collection(db, "doc_indices"));
    const matchingI = iSnap.docs.filter(d => (d.data() as any).linkedPage === id);
    for (const indexDoc of matchingI) {
      await deleteDoc(indexDoc.ref);
    }

    // Delete page doc
    await deleteDoc(pageRef);

    // Log activity
    await this.logModerationActivity({
      adminEmail: adminUser.email,
      adminName: adminUser.name || adminUser.email.split("@")[0],
      action: "DELETE_PUBLIC_PAGE",
      targetContent: `Page: ${page.title} (ID: ${id})`,
      targetUser: page.owner || "unknown",
      reason: reason || "Permanent administrative deletion of public page",
      ipAddress: ipAddress || "127.0.0.1"
    });

    return { success: true, id, message: "Page content, annotations, and outlines deleted successfully." };
  }

  /**
   * Deallocates all matching pages, comments, bookmarks, indexes of a listing ID.
   */
  private static async deleteProjectCascaded(listingId: string) {
    // Pages deletion
    const pagesSnap = await getDocs(collection(db, "pages"));
    const matchingPages = pagesSnap.docs.filter(p => (p.data() as any).listingId === listingId);
    for (const pageDoc of matchingPages) {
      // Highlights & Annotations inside matching pages
      const hSnap = await getDocs(collection(db, "highlights"));
      const matchingH = hSnap.docs.filter(d => (d.data() as any).pageId === pageDoc.id);
      for (const h of matchingH) {
        await deleteDoc(h.ref);
      }
      
      // Indexes
      const iSnap = await getDocs(collection(db, "doc_indices"));
      const matchingI = iSnap.docs.filter(d => (d.data() as any).linkedPage === pageDoc.id);
      for (const idx of matchingI) {
        await deleteDoc(idx.ref);
      }

      await deleteDoc(pageDoc.ref);
    }

    // Favorites & Bookmarks
    const fSnap = await getDocs(collection(db, "favorites"));
    const matchingF = fSnap.docs.filter(d => (d.data() as any).projectId === listingId);
    for (const fav of matchingF) {
      await deleteDoc(fav.ref);
    }

    const bSnap = await getDocs(collection(db, "bookmarks"));
    const matchingB = bSnap.docs.filter(d => (d.data() as any).projectId === listingId);
    for (const bk of matchingB) {
      await deleteDoc(bk.ref);
    }
  }

  // -------------------------------------------------------------
  // ADVANCED ENTERPRISE MODERATION CONTROLS
  // -------------------------------------------------------------
  static async toggleHideContent(id: string, isHidden: boolean, adminUser: any, reason?: string) {
    const listRef = doc(db, "listings", id);
    const snap = await getDoc(listRef);
    if (!snap.exists()) throw new Error("Project not found");
    const listing = snap.data() as any;

    await updateDoc(listRef, { isHidden });

    await this.logModerationActivity({
      adminEmail: adminUser.email,
      adminName: adminUser.name || adminUser.email.split("@")[0],
      action: isHidden ? "HIDE_PUBLIC_CONTENT" : "UNHIDE_PUBLIC_CONTENT",
      targetContent: `Project: ${listing.title}`,
      targetUser: listing.owner,
      reason: reason || (isHidden ? "Muted visibility" : "Restored visibility"),
      ipAddress: "127.0.0.1"
    });

    return { success: true, isHidden };
  }

  static async toggleFeatureContent(id: string, isFeatured: boolean, adminUser: any, reason?: string) {
    const listRef = doc(db, "listings", id);
    const snap = await getDoc(listRef);
    if (!snap.exists()) throw new Error("Project not found");
    const listing = snap.data() as any;

    await updateDoc(listRef, { isFeatured });

    await this.logModerationActivity({
      adminEmail: adminUser.email,
      adminName: adminUser.name || adminUser.email.split("@")[0],
      action: isFeatured ? "FEATURE_CONTENT" : "UNFEATURE_CONTENT",
      targetContent: `Project: ${listing.title}`,
      targetUser: listing.owner,
      reason: reason || (isFeatured ? "Featured" : "Removed feature"),
      ipAddress: "127.0.0.1"
    });

    return { success: true, isFeatured };
  }

  static async updateVisibility(id: string, visibility: "public" | "private", adminUser: any, reason?: string) {
    const listRef = doc(db, "listings", id);
    const snap = await getDoc(listRef);
    if (!snap.exists()) throw new Error("Project not found");
    const listing = snap.data() as any;

    await updateDoc(listRef, { visibility });

    await this.logModerationActivity({
      adminEmail: adminUser.email,
      adminName: adminUser.name || adminUser.email.split("@")[0],
      action: `CONVERT_VISIBILITY_${visibility.toUpperCase()}`,
      targetContent: `Project: ${listing.title}`,
      targetUser: listing.owner,
      reason: reason || `Updated visibility parameter to ${visibility}`,
      ipAddress: "127.0.0.1"
    });

    return { success: true, visibility };
  }

  static async setQualityGrading(id: string, val: "high" | "low" | "spam", adminUser: any, reason?: string) {
    const listRef = doc(db, "listings", id);
    const snap = await getDoc(listRef);
    if (!snap.exists()) throw new Error("Project not found");
    const listing = snap.data() as any;

    const gradingPayload: any = { qualityGrading: val };
    if (val === "spam") {
      gradingPayload.isHidden = true;
    }

    await updateDoc(listRef, gradingPayload);

    await this.logModerationActivity({
      adminEmail: adminUser.email,
      adminName: adminUser.name || adminUser.email.split("@")[0],
      action: `MARK_QUALITY_${val.toUpperCase()}`,
      targetContent: `Project: ${listing.title}`,
      targetUser: listing.owner,
      reason: reason || `Marked content quality standard as ${val}`,
      ipAddress: "127.0.0.1"
    });

    return { success: true, qualityGrading: val };
  }

  static async setCreatorStatus(targetUserEmail: string, status: { isSuspended?: boolean; isTrustedCreator?: boolean }, adminUser: any, reason?: string) {
    const userRef = doc(db, "users", targetUserEmail);
    const snap = await getDoc(userRef);
    if (!snap.exists()) throw new Error("Creator user account not found");

    const payload: any = {};
    if (status.isSuspended !== undefined) payload.isSuspended = status.isSuspended;
    if (status.isTrustedCreator !== undefined) payload.isTrustedCreator = status.isTrustedCreator;

    await updateDoc(userRef, payload);

    await this.logModerationActivity({
      adminEmail: adminUser.email,
      adminName: adminUser.name || adminUser.email.split("@")[0],
      action: `SET_CREATOR_STATUS`,
      targetContent: `User Account: ${targetUserEmail}`,
      targetUser: targetUserEmail,
      reason: reason || `Creator account configuration updated: ${JSON.stringify(payload)}`,
      ipAddress: "127.0.0.1"
    });

    return { success: true, targetUserEmail, ...payload };
  }

  // -------------------------------------------------------------
  // NON-AI LOCAL ENTERPRISE MODERATION SCANNER (DETERMINISTIC NLP)
  // -------------------------------------------------------------
  static async scanContentSafety(id: string) {
    const listRef = doc(db, "listings", id);
    const snap = await getDoc(listRef);
    if (!snap.exists()) throw new Error("Project not found");
    const listing = snap.data() as any;

    const bodyText = `${listing.title || ""} ${listing.description || ""}`.toLowerCase();
    const cleanTitle = (listing.title || "").trim();
    const cleanSlug = (listing.slug || "").trim();
    const ownerEmail = listing.owner || "anonymous@example.com";

    // 1. Gather other listings for correlation checks
    const allListingsSnap = await getDocs(collection(db, "listings"));
    const otherListings = allListingsSnap.docs
      .map(d => ({ id: d.id, ...d.data() as any }))
      .filter(l => l.id !== id);

    const reasons: string[] = [];
    let spamScore = 0;
    let isDuplicateTitle = false;
    let isDuplicateSlug = false;
    let isRepeatedUpload = false;
    let isSizeWarning = false;

    // A. Duplicate Title Detection
    if (cleanTitle) {
      const matchTitle = otherListings.find(l => (l.title || "").trim().toLowerCase() === cleanTitle.toLowerCase());
      if (matchTitle) {
        isDuplicateTitle = true;
        spamScore += 35;
        reasons.push(`Duplicate title detected: Identical to existing project "${matchTitle.title}" (ID: ${matchTitle.id}).`);
      }
    }

    // B. Duplicate Slug Detection
    if (cleanSlug) {
      const matchSlug = otherListings.find(l => l.slug && l.slug.trim().toLowerCase() === cleanSlug.toLowerCase());
      if (matchSlug) {
        isDuplicateSlug = true;
        spamScore += 30;
        reasons.push(`Duplicate slug detected: Slug "${cleanSlug}" is already in use by project "${matchSlug.title}".`);
      }
    }

    // C. Repeated Upload Detection (Check user rapid duplicated posting)
    const userPrematureUploads = otherListings.filter(l => l.owner === ownerEmail);
    if (userPrematureUploads.length > 0) {
      const selfTitleMatch = userPrematureUploads.filter(l => (l.title || "").trim().toLowerCase() === cleanTitle.toLowerCase());
      if (selfTitleMatch.length >= 1) {
        isRepeatedUpload = true;
        spamScore += 40;
        reasons.push(`Repeated upload detected: User published identical document title multiple times.`);
      }
    }

    // D. Upload Size Validation
    // Calculate simulated body size in bytes based on text structure or pages length
    const contentTextLength = bodyText.length;
    let totalPagesCount = 1;
    try {
      const pagesSnap = await getDocs(collection(db, "pages"));
      const pCount = pagesSnap.docs.filter(p => (p.data() as any).listingId === id).length;
      totalPagesCount = pCount || 1;
    } catch {}

    const calculatedSizeBytes = contentTextLength + (totalPagesCount * 512);
    // Let's set a healthy warning count if it is excessively small or abnormally oversized
    if (calculatedSizeBytes > 700000) {
      isSizeWarning = true;
      reasons.push("Alert: Project metadata/pages combined size exceeds 700 KB safe allocation limit.");
    }

    // E. Spam Keyword Filters
    const matchedSpamKeywords = SPAM_KEYWORDS.filter(word => bodyText.includes(word));
    if (matchedSpamKeywords.length > 0) {
      spamScore += Math.min(matchedSpamKeywords.length * 25, 75);
      reasons.push(`Banned Spam keyword matches: [${matchedSpamKeywords.join(", ")}].`);
    }

    // F. Banned Word Filters
    const matchedBannedWords = BANNED_WORDS.filter(word => bodyText.includes(word));
    if (matchedBannedWords.length > 0) {
      spamScore += 50;
      reasons.push(`Profanity or Banned terminology matches: [${matchedBannedWords.join(", ")}].`);
    }

    // G. Suggestion determination
    let suggestion: "Approved" | "Soft Hidden" | "Spam Quarantined" = "Approved";
    if (spamScore >= 65) {
      suggestion = "Spam Quarantined";
    } else if (spamScore >= 35) {
      suggestion = "Soft Hidden";
    }

    // Update Project Status with calculated values
    const autoModerationPayload = {
      spamScore: Math.min(spamScore, 100),
      isDuplicateTitle,
      isDuplicateSlug,
      isRepeatedUpload,
      isSizeWarning,
      autoModerationSuggestion: suggestion,
      moderationReasons: reasons,
      scanTimestamp: new Date().toISOString()
    };

    if (spamScore >= 65) {
      await updateDoc(listRef, {
        ...autoModerationPayload,
        qualityGrading: "spam",
        isHidden: true
      });
    } else {
      await updateDoc(listRef, autoModerationPayload);
    }

    return {
      id,
      analysisType: "DocCMS Local Enterprise Quality Diagnostic",
      spamScore: Math.min(spamScore, 100),
      isDuplicate: isDuplicateTitle || isDuplicateSlug,
      isRepeatedUpload,
      isAbusive: matchedBannedWords.length > 0,
      reasons,
      suggestion
    };
  }

  // -------------------------------------------------------------
  // AUDIT LOGS RETRIEVAL & HELPER
  // -------------------------------------------------------------
  static async getAuditLogs() {
    const snap = await getDocs(collection(db, "admin_public_moderation_logs"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() as any })).sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  }

  static async logModerationActivity(log: {
    adminEmail: string;
    adminName: string;
    action: string;
    targetContent: string;
    targetUser: string;
    reason: string;
    ipAddress?: string;
  }) {
    await addDoc(collection(db, "admin_public_moderation_logs"), {
      ...log,
      timestamp: new Date().toISOString()
    });
  }
}


module.exports = {
  PublicModerationService
};
