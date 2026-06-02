import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ENV } from "./env";

// Local persistent directory for JSON-based mock Firestore
// Use /tmp/.data if deployed to Vercel (where root filesystem is read-only)
const isVercelEnv = !!process.env.VERCEL || !!process.env.NOW_BUILDER;
// Support running from both the monorepo root and the backend subfolder
const DATA_DIR = isVercelEnv 
  ? path.join("/tmp", ".data") 
  : (fs.existsSync(path.join(process.cwd(), "backend", ".data")) 
      ? path.join(process.cwd(), "backend", ".data") 
      : path.join(process.cwd(), ".data"));

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn(`[Database Service] Could not initialize DATA_DIR at ${DATA_DIR}, continuing dynamically with fully in-memory fallback state:`, err);
}

// In Vercel serverless environment, copy seed files from repository's .data folder to /tmp/.data on startup so it has original pre-saved data.
if (isVercelEnv) {
  try {
    const srcDir = path.join(process.cwd(), ".data");
    if (fs.existsSync(srcDir)) {
      const files = fs.readdirSync(srcDir);
      for (const file of files) {
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(DATA_DIR, file);
        if (fs.statSync(srcPath).isFile() && !fs.existsSync(destPath)) {
          fs.copyFileSync(srcPath, destPath);
          console.log(`[Database Service] Copied repository seed file to serverless /tmp: ${file}`);
        }
      }
    }
  } catch (copyErr: any) {
    console.error("[Database Service] Error copying repository seed data to /tmp/.data:", copyErr.message);
  }
}

// In-memory collection fallback for environments where local file system writes fail or are restricted
const memoryCache: Record<string, Record<string, any>> = {};

// Thread-safe / Sync-safe helper to read collection JSON with recovery fallback
export function readCollection(colName: string): Record<string, any> {
  // Always prefer loaded memory caching for instantaneous performance or fallback integrity
  if (memoryCache[colName]) {
    return memoryCache[colName];
  }

  const filePath = path.join(DATA_DIR, `${colName}.json`);
  const backupPath = path.join(DATA_DIR, `${colName}.json.bak`);

  const readAndParse = (p: string) => {
    const data = fs.readFileSync(p, "utf8");
    return JSON.parse(data || "{}");
  };

  try {
    // If main file is missing but backup exists, restore it automatically
    if (!fs.existsSync(filePath)) {
      if (fs.existsSync(backupPath)) {
        console.warn(`[Database Service] LocalDb: File ${filePath} went missing! Instantly recovering from stable backup file.`);
        try {
          fs.copyFileSync(backupPath, filePath);
        } catch (err) {
          console.error(`[Database Service] LocalDb: Failed to copy backup to main file path:`, err);
        }
      } else {
        memoryCache[colName] = {};
        return {};
      }
    }

    const parsed = readAndParse(filePath);
    memoryCache[colName] = parsed;
    return parsed;
  } catch (err) {
    console.error(`[Database Service] LocalDb Error reading collection ${colName}, attempting backup integration recovery:`, err);
    try {
      if (fs.existsSync(backupPath)) {
        try {
          const recoveredValue = readAndParse(backupPath);
          // Copy backup over to fix main file
          fs.copyFileSync(backupPath, filePath);
          console.log(`[Database Service] LocalDb: Recovered collection "${colName}" from backup successfully.`);
          memoryCache[colName] = recoveredValue;
          return recoveredValue;
        } catch (backupReadErr) {
          console.error(`[Database Service] LocalDb: Backup read failed for ${colName} as well:`, backupReadErr);
        }
      }
    } catch (e) {
      // Ignore inner backup filesystem check error
    }
    const fallbackVal = memoryCache[colName] || {};
    memoryCache[colName] = fallbackVal;
    return fallbackVal;
  }
}

// Thread-safe / Sync-safe helper to write collection JSON atomically with rollbacks
export function writeCollection(colName: string, data: Record<string, any>) {
  // Always update in-memory cache to guarantee immediately visible changes
  memoryCache[colName] = data;

  const filePath = path.join(DATA_DIR, `${colName}.json`);
  const tmpPath = path.join(DATA_DIR, `${colName}.json.tmp`);
  const backupPath = path.join(DATA_DIR, `${colName}.json.bak`);

  try {
    // 1. Write fresh data to a temporary file
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");
    
    // 2. Make a stable backup of the current valid file before overwrite (rollback-safety)
    if (fs.existsSync(filePath)) {
      try {
        fs.copyFileSync(filePath, backupPath);
      } catch (backupErr) {
        console.warn(`[Database Service] LocalDb: Rollback backup preservation issue for ${colName}:`, backupErr);
      }
    }

    // 3. Atomically rename the temp file to the main database file
    try {
      fs.renameSync(tmpPath, filePath);
    } catch (renameErr) {
      // If rename fails (e.g. EXDEV cross-device link error on container filesystems), fallback to direct write
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    }
  } catch (err) {
    console.error(`[Database Service] LocalDb Error writing collection ${colName} to disk:`, err);
    
    // Rollback recovery: if write failed/interrupted, restore the main file from stable backup
    try {
      if (fs.existsSync(backupPath) && !fs.existsSync(filePath)) {
        try {
          fs.copyFileSync(backupPath, filePath);
          console.log(`[Database Service] LocalDb: Rollback successful for ${colName}`);
        } catch (rollErr) {
          console.error(`[Database Service] LocalDb: Rollback failed for ${colName}:`, rollErr);
        }
      }
    } catch (e) {
      // Ignore nested fs check error
    }
  } finally {
    // Cleanup temporary file if it was left behind
    try {
      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
    } catch (unlinkErr) {
      // Safe to ignore
    }
  }
}

// Core Firebase imports
import * as admin from "firebase-admin";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { getApps, initializeApp } from "firebase-admin/app";

// Safely load and merge firebase-applet-config.json for absolute environment consistency
let appletConfig: any = {};
try {
  const rootConfigPath = path.resolve(process.cwd(), "backend/firebase-applet-config.json");
  let currentDir = "";
  try {
    currentDir = __dirname;
  } catch {
    currentDir = path.dirname(fileURLToPath(import.meta.url));
  }
  const subConfigPath = path.resolve(currentDir, "../firebase-applet-config.json");
  const configPath = fs.existsSync(rootConfigPath) ? rootConfigPath : (fs.existsSync(subConfigPath) ? subConfigPath : "");
  if (configPath) {
    appletConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    console.log("[Database Service] Backend loaded Configs from firebase-applet-config.json");
  }
} catch (err) {
  console.warn("[Database Service] Could not load firebase-applet-config.json:", err);
}

const finalProjectId = process.env.FIREBASE_PROJECT_ID || appletConfig.projectId || "";

const isConfigured = !!(
  finalProjectId ||
  (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL)
);

// Admin SDK needs a private key/Service Account under serverless Vercel, otherwise it hangs the gRPC thread.
// So on Vercel, only initialize Admin SDK if a service account private key is detected,
// otherwise default to local database fallback instantly.
const shouldInitAdminSdk = isConfigured && (
  !isVercelEnv || 
  !!process.env.GOOGLE_APPLICATION_CREDENTIALS || 
  !!process.env.FIREBASE_SERVICE_ACCOUNT ||
  (!!process.env.FIREBASE_PRIVATE_KEY && !!process.env.FIREBASE_CLIENT_EMAIL)
);

let adminApp: any = null;
let adminFirestoreInstance: any = null;
if (shouldInitAdminSdk) {
  try {
    const apps = getApps();
    if (apps.length > 0) {
      adminApp = apps[0]!;
    } else {
      let privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
      if (privateKeyRaw) {
        if (privateKeyRaw.startsWith('"') && privateKeyRaw.endsWith('"')) {
          privateKeyRaw = privateKeyRaw.slice(1, -1);
        }
        if (privateKeyRaw.startsWith("'") && privateKeyRaw.endsWith("'")) {
          privateKeyRaw = privateKeyRaw.slice(1, -1);
        }
      }
      const privateKey = privateKeyRaw
        ? privateKeyRaw.replace(/\\n/g, '\n').trim()
        : undefined;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

      if (privateKey && clientEmail) {
        const adminCred = admin.credential || (admin as any).default?.credential;
        adminApp = initializeApp({
          credential: adminCred.cert({
            projectId: finalProjectId,
            clientEmail,
            privateKey,
          }),
        });
      } else {
        adminApp = initializeApp({
          projectId: finalProjectId,
        });
      }
    }
    const rawDbId = appletConfig.firestoreDatabaseId || undefined;
    const dbId = (rawDbId === "ai-studio-893adea9-443c-445c-9e2d-10478f8a2e04" || !rawDbId || rawDbId === '""' || rawDbId === "''" || rawDbId === "(default)") ? undefined : rawDbId;
    adminFirestoreInstance = getAdminFirestore(adminApp, dbId);
    console.log(`Firebase Admin SDK initialized successfully for database: ${dbId || "(default)"}`);
  } catch (err) {
    console.error("Firebase Admin SDK init error:", err);
  }
}

export let isFirestoreWorking = false;

export async function testFirestoreConnection() {
  if (!isConfigured || !adminFirestoreInstance) {
    isFirestoreWorking = false;
    console.log("[Database Service] Backend mode: local persistent JSON database (Active & Fully Operational).");
    return;
  }

  const tryConnection = async (dbInstance: any, nameLabel: string): Promise<boolean> => {
    try {
      const promiseGet = dbInstance.collection("_startup_check_").limit(1).get();
      const safePromiseGet = promiseGet.then(
        (val) => ({ status: "success" as const, val }),
        (err: any) => {
          console.log(`[Database Service] Background Firestore (${nameLabel}) connection check concluded state.`);
          return { status: "error" as const, err: new Error("Silent connection failure") };
        }
      );
      const promiseTimeout = new Promise<{ status: "timeout"; err: Error }>((resolve) => 
        setTimeout(() => resolve({ status: "timeout" as const, err: new Error("Playback timed out") }), 2000)
      );
      const result = await Promise.race([safePromiseGet, promiseTimeout]);

      if (result.status === "success") {
        console.log(`[Database Service] Firestore (${nameLabel}) connection test success. Live cloud database is active.`);
        return true;
      } else {
        console.log(`[Database Service] Firestore (${nameLabel}) connection check finished without cloud active status.`);
        return false;
      }
    } catch (err: any) {
      console.log(`[Database Service] Firestore (${nameLabel}) connection check direct status resolved.`);
      return false;
    }
  };

  const customDbId = appletConfig.firestoreDatabaseId || "(none)";
  let connected = await tryConnection(adminFirestoreInstance, `config: ${customDbId}`);

  if (!connected && appletConfig.firestoreDatabaseId) {
    console.log("[Database Service] Custom database check finished. Trying fallback validation...");
    try {
      const fallbackDb = getAdminFirestore(adminApp);
      connected = await tryConnection(fallbackDb, "(default)");
      if (connected) {
        adminFirestoreInstance = fallbackDb;
        db = fallbackDb;
        console.log("[Database Service] Successfully re-routed Firestore service to (default) database!");
      }
    } catch (fallbackInitErr: any) {
      console.log("[Database Service] Optional fallback database verification completed.");
    }
  }

  if (connected) {
    isFirestoreWorking = true;
    db = adminFirestoreInstance;
    runBackgroundMigration().catch(migrateErr => {
      console.error("[Database Service] Live Firestore background migration error:", migrateErr);
    });
  } else {
    console.log("[Database Service] Backend mode: local persistent JSON database (Active & Fully Operational).");
    isFirestoreWorking = false;
  }
}

async function runBackgroundMigration() {
  const collectionsToSeed = [
    "users", 
    "workspaces", 
    "listings", 
    "pages", 
    "doc_pages", 
    "bookmarks", 
    "favorites",
    "workspaceHubWorkspaces",
    "workspaceHubProjects",
    "documentNexusWorkspaces",
    "documentNexusDocuments",
    "highlights",
    "annotations",
    "doc_indices",
    "follows",
    "admin_audit_logs",
    "page_versions",
    "drafts",
    "contents"
  ];
  for (const colName of collectionsToSeed) {
    try {
      const colRef = adminFirestoreInstance.collection(colName);
      const localData = readCollection(colName);
      let syncCount = 0;
      for (const [id, value] of Object.entries(localData)) {
        if (id === "undefined") continue; // Clear out raw trash data
        const docRef = colRef.doc(id);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
          await docRef.set(resolveServerTimestamp(value));
          syncCount++;
        }
      }
      if (syncCount > 0) {
        console.log(`[Database Service] Live Firestore: Synchronized ${syncCount} missing documents for collection "${colName}".`);
      }
    } catch (colErr: any) {
      console.error(`[Database Service] Live Firestore: Failed to sync data for collection "${colName}":`, colErr.message);
    }
  }
}

export let db = adminFirestoreInstance || { type: "firestore-local-db" };

// Helper to wrap Firestore Admin snapshot to look like client API for exists()
function wrapAdminSnapshot(snap: any) {
  if (!snap) return snap;
  return {
    id: snap.id,
    path: snap.ref?.path || "",
    ref: snap.ref,
    exists: () => snap.exists === true,
    data: () => (snap.exists ? { ...snap.data(), id: snap.id } : null),
  };
}

// Helper to wrap QuerySnapshot to have list of wrapped docs
function wrapAdminQuerySnapshot(querySnap: any) {
  if (!querySnap) return querySnap;
  const docs = (querySnap.docs || []).map((snap: any) => wrapAdminSnapshot(snap));
  return {
    docs,
    empty: querySnap.empty,
    size: querySnap.size !== undefined ? querySnap.size : docs.length
  };
}

// Mock/Real Auth Token verifier
export const adminAuth = {
  verifyIdToken: async (token: string) => {
    if (isConfigured) {
      try {
        const authModule = admin.auth || (admin as any).default?.auth;
        const decoded = await authModule().verifyIdToken(token);
        return {
          uid: decoded.uid,
          email: decoded.email || "",
          email_verified: decoded.email_verified || false,
        };
      } catch (err: any) {
        console.error("Firebase adminAuth verification failed:", err);
        throw err;
      }
    } else {
      try {
        const decoded = jwt.decode(token) as any;
        if (decoded) {
          return {
            uid: decoded.uid || decoded.sub || decoded.email || decoded.user_id || "mock-uid",
            email: decoded.email || "",
            email_verified: true,
          };
        }
      } catch (err) {
        console.warn("LocalDb adminAuth decode warning:", err);
      }
      throw new Error("Invalid Token");
    }
  }
};

// Routing helper functions depending on config status
export function collection(dbInstance: any, name: string) {
  if (isConfigured && isFirestoreWorking && dbInstance && dbInstance.type !== "firestore-local-db") {
    return dbInstance.collection(name);
  }
  return { type: "collection", path: name };
}

export function doc(...args: any[]) {
  if (isConfigured && isFirestoreWorking && db && (db as any).type !== "firestore-local-db") {
    const dbInstance = db as any;
    if (args.length === 3) {
      return dbInstance.collection(args[1]).doc(args[2]);
    }
    if (args.length === 2 && args[0]) {
      if (typeof args[0].doc === "function") {
        return args[0].doc(args[1]);
      } else {
        return dbInstance.doc(args[1]);
      }
    }
    return dbInstance.doc("");
  }
  if (args.length === 3) {
    return { type: "doc", col: args[1], id: args[2] };
  }
  if (args.length === 2 && args[0] && args[0].type === "collection") {
    return { type: "doc", col: args[0].path, id: args[1] };
  }
  if (args.length === 2 && typeof args[1] === "string") {
    const parts = args[1].split("/");
    return { type: "doc", col: parts[0], id: parts[1] || "" };
  }
  return { type: "doc", col: "", id: "" };
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const isPermissionDenied = error && (
    error.code === 7 || 
    error.code === "permission-denied" || 
    (error.message && error.message.toLowerCase().includes("permission"))
  );
  
  if (isPermissionDenied) {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      operationType,
      path,
      authInfo: {
        userId: "system-admin-role",
        email: "admin@workspace.com",
        emailVerified: true,
        isAnonymous: false,
        tenantId: null,
        providerInfo: []
      }
    };
    console.error("Firestore Permission Error Context: ", JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }
  
  throw error;
}

export async function runWithRetry<T>(
  operation: () => Promise<T>, 
  operationType: OperationType, 
  path: string | null,
  retries = 3, 
  delay = 1000
): Promise<T> {
  let lastErr: any = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      lastErr = err;
      const isPermissionDenied = err && (
        err.code === 7 || 
        err.code === "permission-denied" || 
        (err.message && err.message.toLowerCase().includes("permission"))
      );
      
      if (isPermissionDenied) {
        handleFirestoreError(err, operationType, path);
      }
      
      console.warn(`[Database Service] Firestore operation ${operationType} on "${path}" failed (attempt ${attempt}/${retries}): ${err.message || err}. Retrying in ${delay * attempt}ms...`);
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  console.error(`[Database Service] Firestore operation ${operationType} on "${path}" definitively failed after ${retries} attempts.`);
  throw lastErr;
}

function getPath(ref: any): string | null {
  if (!ref) return null;
  if (typeof ref.path === "string") return ref.path;
  if (ref.col) return `${ref.col}/${ref.id || ""}`;
  return null;
}

export async function getDoc(docRef: any) {
  if (isConfigured && isFirestoreWorking && docRef && docRef.type !== "doc") {
    const snap = await runWithRetry(() => docRef.get(), OperationType.GET, getPath(docRef));
    return wrapAdminSnapshot(snap);
  }
  const colName = docRef.col;
  const data = readCollection(colName);
  const item = data[docRef.id];
  return {
    id: docRef.id,
    ref: docRef,
    exists: () => item !== undefined,
    data: () => (item ? { ...item, id: docRef.id } : null),
  };
}

export async function setDoc(docRef: any, data: any, options?: any) {
  if (isConfigured && isFirestoreWorking && docRef && docRef.type !== "doc") {
    const parsedData = resolveServerTimestamp(data);
    await runWithRetry(() => docRef.set(parsedData, options || {}), OperationType.WRITE, getPath(docRef));
    return;
  }
  const colName = docRef.col;
  const colData = readCollection(colName);
  const parsedData = resolveServerTimestamp(data);

  if (options && options.merge) {
    colData[docRef.id] = { ...(colData[docRef.id] || {}), ...parsedData };
  } else {
    colData[docRef.id] = parsedData;
  }
  writeCollection(colName, colData);
}

export async function updateDoc(docRef: any, data: any) {
  if (isConfigured && isFirestoreWorking && docRef && docRef.type !== "doc") {
    const parsedData = resolveServerTimestamp(data);
    await runWithRetry(() => docRef.update(parsedData), OperationType.UPDATE, getPath(docRef));
    return;
  }
  const colName = docRef.col;
  const colData = readCollection(colName);
  const parsedData = resolveServerTimestamp(data);
  colData[docRef.id] = { ...(colData[docRef.id] || {}), ...parsedData };
  writeCollection(colName, colData);
}

export async function addDoc(colRef: any, data: any) {
  if (isConfigured && isFirestoreWorking && colRef && colRef.type !== "collection") {
    const parsedData = resolveServerTimestamp(data);
    const addedRef = await runWithRetry(() => colRef.add(parsedData), OperationType.CREATE, getPath(colRef));
    return addedRef;
  }
  const id = Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  const parsedData = resolveServerTimestamp(data);
  const colName = colRef.path;
  const colData = readCollection(colName);
  colData[id] = parsedData;
  writeCollection(colName, colData);
  return { id, type: "doc", col: colName };
}

export async function deleteDoc(docRef: any) {
  let colName = "";
  let docId = "";

  if (docRef) {
    if (docRef.type === "doc") {
      colName = docRef.col;
      docId = docRef.id;
    } else {
      colName = docRef.parent ? docRef.parent.id : "";
      docId = docRef.id;
    }
  }

  if (isConfigured && isFirestoreWorking && docRef && docRef.type !== "doc") {
    await runWithRetry(() => docRef.delete(), OperationType.DELETE, getPath(docRef));
  }

  if (colName && docId) {
    const colData = readCollection(colName);
    if (colData[docId] !== undefined) {
      delete colData[docId];
      writeCollection(colName, colData);
      console.log(`[Database Service] Cascaded fallback deletion clean for collection: ${colName}, id: ${docId}`);
    }
  }
}

export function query(targetRef: any, ...constraints: any[]) {
  if (isConfigured && isFirestoreWorking && targetRef && targetRef.type !== "collection" && targetRef.type !== "doc" && targetRef.type !== "query") {
    let adminQuery = targetRef;
    for (const c of constraints) {
      if (!c) continue;
      if (c.type === "where") {
        adminQuery = adminQuery.where(c.field, c.op, c.value);
      } else if (c.type === "orderBy") {
        adminQuery = adminQuery.orderBy(c.field, c.direction);
      } else if (c.type === "limit") {
        adminQuery = adminQuery.limit(c.count);
      }
    }
    return adminQuery;
  }
  return {
    type: "query",
    col: targetRef.type === "collection" ? targetRef.path : targetRef.col,
    constraints,
  };
}

export function where(field: string, op: string, value: any) {
  return { type: "where", field, op, value };
}

export function orderBy(field: string, direction: "asc" | "desc" = "asc") {
  return { type: "orderBy", field, direction };
}

export function limit(count: number) {
  return { type: "limit", count };
}

export function serverTimestamp() {
  if (isConfigured && isFirestoreWorking) {
    const firestoreModule = admin.firestore || (admin as any).default?.firestore;
    return firestoreModule.FieldValue.serverTimestamp();
  }
  return { type: "serverTimestamp" };
}

// Utility to recursively find and resolve Server Timestamp objects with actual ISO string
function resolveServerTimestamp(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  if (typeof data !== "object") {
    return data;
  }
  if (data.type === "serverTimestamp") {
    return new Date().toISOString();
  }
  const resolved: any = Array.isArray(data) ? [] : {};
  for (const key of Object.keys(data)) {
    if (data[key] && data[key].type === "serverTimestamp") {
      resolved[key] = new Date().toISOString();
    } else if (typeof data[key] === "object") {
      resolved[key] = resolveServerTimestamp(data[key]);
    } else {
      resolved[key] = data[key];
    }
  }
  return resolved;
}

export async function getDocs(target: any) {
  if (isConfigured && isFirestoreWorking && target && target.type !== "collection" && target.type !== "query") {
    const snap = await runWithRetry(() => target.get(), OperationType.LIST, getPath(target));
    return wrapAdminQuerySnapshot(snap);
  }
  const colName = target.col || (target.type === "collection" ? target.path : "");
  if (!colName) {
    return { docs: [], empty: true, size: 0 };
  }
  let items = Object.entries(readCollection(colName)).map(([id, val]: [string, any]) => ({
    id,
    ...val,
  }));

  if (target.type === "query" && target.constraints) {
    for (const c of target.constraints) {
      if (c && c.type === "where") {
        const { field, op, value } = c;
        items = items.filter((item: any) => {
          const itemVal = item[field];
          if (op === "==") {
            return itemVal === value;
          }
          if (op === "!=") {
            return itemVal !== value;
          }
          if (op === ">") {
            return itemVal > value;
          }
          if (op === "<") {
            return itemVal < value;
          }
          if (op === ">=") {
            return itemVal >= value;
          }
          if (op === "<=") {
            return itemVal <= value;
          }
          if (op === "in") {
            return Array.isArray(value) && value.includes(itemVal);
          }
          if (op === "array-contains") {
            return Array.isArray(itemVal) && itemVal.includes(value);
          }
          return true;
        });
      }
    }

    for (const c of target.constraints) {
      if (c && c.type === "orderBy") {
        const { field, direction } = c;
        items.sort((a: any, b: any) => {
          const aVal = a[field];
          const bVal = b[field];
          if (aVal === undefined && bVal === undefined) return 0;
          if (aVal === undefined) return direction === "asc" ? 1 : -1;
          if (bVal === undefined) return direction === "asc" ? -1 : 1;
          if (aVal < bVal) return direction === "asc" ? -1 : 1;
          if (aVal > bVal) return direction === "asc" ? 1 : -1;
          return 0;
        });
      }
    }

    for (const c of target.constraints) {
      if (c && c.type === "limit") {
        items = items.slice(0, c.count);
      }
    }
  }

  const docs = items.map((item: any) => {
    const { id, ...data } = item;
    return {
      id,
      ref: { type: "doc", col: colName, id },
      data: () => ({ ...data, id }),
    };
  });

  return { 
    docs,
    empty: docs.length === 0,
    size: docs.length
  };
}

console.log("Firebase / fallback local persistent DB loaded.");

// Restore administrator accounts and other users to standard user roles on startup
try {
  const users = readCollection("users");
  let updatedUsers = false;

  // Dynamically seed admin@workspace.com as the default primary Admin
  if (!users["admin@workspace.com"]) {
    users["admin@workspace.com"] = {
      email: "admin@workspace.com",
      role: "admin",
      isSocial: true,
      password: bcrypt.hashSync("password123", 10),
      createdAt: new Date().toISOString()
    };
    updatedUsers = true;
    console.log("[Database Service] Seeded default system administrator: admin@workspace.com");
  } else if (!users["admin@workspace.com"].password) {
    users["admin@workspace.com"].password = bcrypt.hashSync("password123", 10);
    updatedUsers = true;
  }

  // Seed jane.doe@example.com so standard sandbox option remains accessible
  if (!users["jane.doe@example.com"]) {
    users["jane.doe@example.com"] = {
      email: "jane.doe@example.com",
      role: "user",
      isSocial: true,
      password: bcrypt.hashSync("password123", 10),
      createdAt: new Date().toISOString()
    };
    updatedUsers = true;
    console.log("[Database Service] Seeded default standard sandbox user: jane.doe@example.com");
  } else if (!users["jane.doe@example.com"].password) {
    users["jane.doe@example.com"].password = bcrypt.hashSync("password123", 10);
    updatedUsers = true;
  }

  // Seed rajveerhelloworld@gmail.com so user can login directly
  if (!users["rajveerhelloworld@gmail.com"]) {
    users["rajveerhelloworld@gmail.com"] = {
      email: "rajveerhelloworld@gmail.com",
      role: "user",
      isSocial: false,
      password: bcrypt.hashSync("password123", 10),
      createdAt: new Date().toISOString()
    };
    updatedUsers = true;
    console.log("[Database Service] Seeded default active sandbox user: rajveerhelloworld@gmail.com");
  } else if (!users["rajveerhelloworld@gmail.com"].password) {
    users["rajveerhelloworld@gmail.com"].password = bcrypt.hashSync("password123", 10);
    updatedUsers = true;
  }

  // Seed heroofthevil311@gmail.com so user can login directly
  if (!users["heroofthevil311@gmail.com"]) {
    users["heroofthevil311@gmail.com"] = {
      email: "heroofthevil311@gmail.com",
      role: "user",
      isSocial: false,
      password: bcrypt.hashSync("password123", 10),
      createdAt: new Date().toISOString()
    };
    updatedUsers = true;
    console.log("[Database Service] Seeded default active sandbox user: heroofthevil311@gmail.com");
  } else if (!users["heroofthevil311@gmail.com"].password) {
    users["heroofthevil311@gmail.com"].password = bcrypt.hashSync("password123", 10);
    updatedUsers = true;
  }

  const nonAdminEmails = ["heroofthevil311@gmail.com", "hshit7534@gmail.com", "rajveer@gmail.com", "rajveerhelloworld@gmail.com"];
  for (const email of nonAdminEmails) {
    if (users[email] && users[email].role === "admin") {
      users[email].role = "user";
      updatedUsers = true;
      console.log(`[Database Service] Restored/Converted ${email} to standard user role`);
    }
  }
  if (updatedUsers) {
    writeCollection("users", users);
  }
} catch (seedErr) {
  console.error("Failed to sync user roles restore:", seedErr);
}

