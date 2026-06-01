import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api/client";
import { Cloud, CloudCheck, CloudLightning, Loader2 } from "lucide-react";
import { triggerNotification } from "../context/NotificationContext";

export default function FirestoreSyncManager() {
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "restoring" | "error" | "unconfigured">("idle");
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  
  const lastSyncHashRef = useRef<string>("");
  const isSyncingInProgressRef = useRef<boolean>(false);
  const isFirstCheckCompleteRef = useRef<boolean>(false);

  useEffect(() => {
    if (!user || !user.email) {
      setSyncStatus("idle");
      isFirstCheckCompleteRef.current = false;
      lastSyncHashRef.current = "";
      return;
    }

    const emailKey = user.email.trim().toLowerCase();

    // Main sync handler
    const runSynchronizationSequence = async () => {
      if (isSyncingInProgressRef.current) return;
      isSyncingInProgressRef.current = true;

      try {
        setSyncStatus("syncing");
        
        // 1. Fetch current backend database snapshot
        const exportRes = await api.get("/sync/export");
        const backendData = exportRes.data?.data || {};

        const workspaces = backendData.workspaceHubWorkspaces || {};
        const nexusWorkspaces = backendData.documentNexusWorkspaces || {};

        const hasLocalWorkspaces = Object.keys(workspaces).length > 0 || Object.keys(nexusWorkspaces).length > 0;
        const currentDataString = JSON.stringify(backendData);
        const currentDataHash = btoa(unescape(encodeURIComponent(currentDataString))).slice(-100);

        // 2. Perform Startup Recovery check if this is the very first pass
        if (!isFirstCheckCompleteRef.current) {
          console.log("[Firestore Sync] Starting initial cloud backup recovery verification...");
          
          let cloudSnapshot: any = null;
          try {
            console.log("[Firestore Sync Trace Client] Retrieving backup dynamically from server-side admin Firestore...");
            const backupRes = await api.get("/sync/cloud-backup");
            cloudSnapshot = backupRes.data?.data || null;
          } catch (snapshotErr) {
            console.warn("[Firestore Sync] Failed to retrieve cloud backup snapshot via Admin SDK proxy:", snapshotErr);
          }

          if (cloudSnapshot && typeof cloudSnapshot === "object") {
            const cloudWorkspaces = cloudSnapshot.workspaceHubWorkspaces || {};
            const cloudNexusWorkspaces = cloudSnapshot.documentNexusWorkspaces || {};
            const hasCloudWorkspaces = Object.keys(cloudWorkspaces).length > 0 || Object.keys(cloudNexusWorkspaces).length > 0;

            // If the local backend server is empty BUT we have cloud backup workspaces, trigger a RESTORE
            if (!hasLocalWorkspaces && hasCloudWorkspaces) {
              console.log("[Firestore Sync] Startup state matches clean backend server profile. Rebuilding database from Firestore cloud backup...");
              setSyncStatus("restoring");
              
              triggerNotification(
                "Restoring your custom workspaces, pages, and highlights from secure cloud backup. Please wait...",
                "info",
                "Cloud Recovery Active"
              );

              await api.post("/sync/import", cloudSnapshot);
              
              triggerNotification(
                "Successfully restored your workspace and documentation nexus from cloud Firestore persistence!",
                "success",
                "Recovery Complete"
              );

              isFirstCheckCompleteRef.current = true;
              isSyncingInProgressRef.current = false;
              setSyncStatus("synced");
              
              // Force soft page refresh to update all cached hooks and load restored workspaces
              setTimeout(() => {
                window.location.reload();
              }, 1200);
              return;
            }
          }
          
          isFirstCheckCompleteRef.current = true;
        }

        // 3. Save / Backup to Firestore Cloud if data has changed
        if (currentDataHash !== lastSyncHashRef.current) {
          // Store if we have actual items to preserve (prevent backing up clean slate over existing backup)
          if (hasLocalWorkspaces) {
            console.log("[Firestore Sync] Modifications detected. Saving secure snapshot via Admin SDK proxy...");
            await api.post("/sync/cloud-backup", backendData);
            
            lastSyncHashRef.current = currentDataHash;
            setLastSynced(new Date().toLocaleTimeString());
            console.log("[Firestore Sync] Cloud backup fully persistent.");
          } else {
            // If local backend and cloud are both empty, just align the hash
            lastSyncHashRef.current = currentDataHash;
          }
        }
        
        setSyncStatus("synced");
      } catch (err: any) {
        console.error("[Firestore Sync] Synchronization loop failed:", err);
        setSyncStatus("error");
      } finally {
        isSyncingInProgressRef.current = false;
      }
    };

    // Run immediately on user login, then schedule periodic checks
    runSynchronizationSequence();

    const intervalId = setInterval(() => {
      runSynchronizationSequence();
    }, 10000); // Poll/sync every 10 seconds for instant durability

    return () => clearInterval(intervalId);
  }, [user]);

  // Subtle clean status tooltip
  if (syncStatus === "idle" || syncStatus === "unconfigured") return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9990] flex items-center gap-2 cursor-default pointer-events-none select-none">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-full shadow-lg border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium transition-all duration-300 animate-fade-in">
        {syncStatus === "syncing" && (
          <>
            <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
            <span>Syncing Cloud...</span>
          </>
        )}
        {syncStatus === "restoring" && (
          <>
            <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Recovering Workspace...</span>
          </>
        )}
        {syncStatus === "synced" && (
          <>
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </div>
            <span>Cloud Saved {lastSynced && `at ${lastSynced}`}</span>
          </>
        )}
        {syncStatus === "error" && (
          <>
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span>Connection Issue</span>
          </>
        )}
      </div>
    </div>
  );
}
