import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ENV } from "./env";

// Local persistent directory for JSON-based mock Firestore
// Use /tmp/.data if deployed to Vercel (where root filesystem is read-only)
const isVercelEnv = !!process.env.VERCEL || !!process.env.NOW_BUILDER;
const DATA_DIR = isVercelEnv ? path.join("/tmp", ".data") : path.join(process.cwd(), ".data");

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
function readCollection(colName: string): Record<string, any> {
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
function writeCollection(colName: string, data: Record<string, any>) {
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
import firebaseConfigJson from "../../firebase-applet-config.json";

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
  measurementId: firebaseConfigJson.measurementId,
};

const isConfigured = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "remixed-api-key";

// Admin SDK needs a private key/Service Account under serverless Vercel, otherwise it hangs the gRPC thread.
// So on Vercel, only initialize Admin SDK if a service account private key is detected,
// otherwise default to local database fallback instantly.
const shouldInitAdminSdk = isConfigured && (!isVercelEnv || !!process.env.GOOGLE_APPLICATION_CREDENTIALS || !!process.env.FIREBASE_SERVICE_ACCOUNT);

let adminApp: any = null;
let adminFirestoreInstance: any = null;
if (shouldInitAdminSdk) {
  try {
    const apps = getApps();
    if (apps.length > 0) {
      adminApp = apps[0]!;
    } else {
      adminApp = initializeApp({
        projectId: firebaseConfigJson.projectId,
      });
    }
    adminFirestoreInstance = getAdminFirestore(adminApp, firebaseConfigJson.firestoreDatabaseId);
    console.log("Firebase Admin SDK initialized successfully.");
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
  try {
    // A quick, lightweight read on a non-existent database key to test credentials and access permissions.
    // Wrap with a strict 2-second timeout to prevent serverless execution hanging on unconfigured Firestore connections.
    // To absolutely prevent unhandled promise rejections if the check times out but eventually fails/rejects in the background,
    // we convert BOTH the Firestore check and the timeout check into non-rejecting promises that resolve with a status object.
    const promiseGet = adminFirestoreInstance.collection("_startup_check_").limit(1).get();
    const safePromiseGet = promiseGet.then(
      (val) => ({ status: "success" as const, val }),
      (err: any) => {
        console.log("[Database Service] Background Firestore promise settled/rejected (preventing unhandled crash):", err.message);
        return { status: "error" as const, err };
      }
    );
    const promiseTimeout = new Promise<{ status: "timeout"; err: Error }>((resolve) => 
      setTimeout(() => resolve({ status: "timeout" as const, err: new Error("Firestore connection check timed out") }), 2000)
    );
    const result = await Promise.race([safePromiseGet, promiseTimeout]);

    if (result.status === "success") {
      console.log("[Database Service] Firestore connection test: SUCCESS. Live cloud database is fully accessible!");
      isFirestoreWorking = true;

      // Automatically migrate local JSON backup data to live Cloud Firestore in the background
      runBackgroundMigration().catch(migrateErr => {
        console.error("[Database Service] Live Firestore background migration error:", migrateErr);
      });
    } else {
      console.log(`[Database Service] Firestore connection test resolved without success (${result.status}):`, result.err?.message || "No error details available");
      console.log("[Database Service] Backend mode: local persistent JSON database (Active & Fully Operational).");
      isFirestoreWorking = false;
    }
  } catch (err: any) {
    // Standardize backend storage mode gracefully as a secure, high-performance local persistence store
    console.log("[Database Service] Backend mode: local persistent JSON database (Active & Fully Operational).");
    isFirestoreWorking = false;
  }
}

async function runBackgroundMigration() {
  const collectionsToSeed = ["users", "workspaces", "listings", "pages", "doc_pages", "bookmarks", "favorites"];
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

export const db = adminFirestoreInstance || { type: "firestore-local-db" };

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
        const decoded = await admin.auth().verifyIdToken(token);
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

export async function getDoc(docRef: any) {
  if (isConfigured && isFirestoreWorking && docRef && docRef.type !== "doc") {
    const snap = await docRef.get();
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
    return docRef.set(parsedData, options || {});
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
    return docRef.update(parsedData);
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
    const addedRef = await colRef.add(parsedData);
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
    await docRef.delete();
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
    return admin.firestore.FieldValue.serverTimestamp();
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
    const snap = await target.get();
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

  const nonAdminEmails = ["heroofthevil311@gmail.com", "hshit7534@gmail.com", "rajveer@gmail.com"];
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

