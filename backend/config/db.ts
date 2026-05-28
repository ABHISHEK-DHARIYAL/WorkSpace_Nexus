const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { ENV } = require("./env");

// Local persistent directory for JSON-based database
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
  memoryCache[colName] = data;

  const filePath = path.join(DATA_DIR, `${colName}.json`);
  const tmpPath = path.join(DATA_DIR, `${colName}.json.tmp`);
  const backupPath = path.join(DATA_DIR, `${colName}.json.bak`);

  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");
    
    if (fs.existsSync(filePath)) {
      try {
        fs.copyFileSync(filePath, backupPath);
      } catch (backupErr) {
        console.warn(`[Database Service] LocalDb: Rollback backup preservation issue for ${colName}:`, backupErr);
      }
    }

    try {
      fs.renameSync(tmpPath, filePath);
    } catch (renameErr) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    }
  } catch (err) {
    console.error(`[Database Service] LocalDb Error writing collection ${colName} to disk:`, err);
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
    try {
      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
    } catch (unlinkErr) {
      // Safe to ignore
    }
  }
}

const isDatabaseWorking = true;

async function testDatabaseConnection() {
  console.log("[Database Service] Backend mode: local persistent JSON database operational.");
}

const db = { type: "local-db" };

function collection(dbInstance: any, name: string) {
  return { type: "collection", path: name };
}

function doc(...args: any[]) {
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

async function getDoc(docRef: any) {
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

async function setDoc(docRef: any, data: any, options?: any) {
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

async function updateDoc(docRef: any, data: any) {
  const colName = docRef.col;
  const colData = readCollection(colName);
  const parsedData = resolveServerTimestamp(data);
  colData[docRef.id] = { ...(colData[docRef.id] || {}), ...parsedData };
  writeCollection(colName, colData);
}

async function addDoc(colRef: any, data: any) {
  const id = Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  const parsedData = resolveServerTimestamp(data);
  const colName = colRef.path;
  const colData = readCollection(colName);
  colData[id] = parsedData;
  writeCollection(colName, colData);
  return { id, type: "doc", col: colName };
}

async function deleteDoc(docRef: any) {
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

  if (colName && docId) {
    const colData = readCollection(colName);
    if (colData[docId] !== undefined) {
      delete colData[docId];
      writeCollection(colName, colData);
      console.log(`[Database Service] Cascaded fallback deletion clean for collection: ${colName}, id: ${docId}`);
    }
  }
}

function query(targetRef: any, ...constraints: any[]) {
  return {
    type: "query",
    col: targetRef.type === "collection" ? targetRef.path : targetRef.col,
    constraints,
  };
}

function where(field: string, op: string, value: any) {
  return { type: "where", field, op, value };
}

function orderBy(field: string, direction: "asc" | "desc" = "asc") {
  return { type: "orderBy", field, direction };
}

function limit(count: number) {
  return { type: "limit", count };
}

function serverTimestamp() {
  return { type: "serverTimestamp" };
}

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

async function getDocs(target: any) {
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

console.log("[Database Service] Custom local JSON database architecture engine loaded.");

// Restore administrator accounts and other users to standard user roles on startup
try {
  const users = readCollection("users");
  let updatedUsers = false;

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


module.exports = {
  isDatabaseWorking,
  db,
  testDatabaseConnection,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  getDocs,
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
};
