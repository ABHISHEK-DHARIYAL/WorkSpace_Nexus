import fs from "fs";
import path from "path";

interface VerifiedRoute {
  method: string;
  path: string;
}

interface FoundFrontendCall {
  method: string;
  rawPath: string;
  normalizedPath: string;
  file: string;
  line: number;
}

/**
 * Standardize parameter markers in API calls so frontend "/workspace/${id}" maps structurally to backend "/workspace/:id"
 */
function normalizePath(rawPath: string): string {
  let cleaned = rawPath
    .replace(/["'`]/g, "") // Strip quotes
    .split("?")[0]        // Strip query params
    .trim();

  // Replace ${id} or ${workspaceId} with :param placeholders
  cleaned = cleaned.replace(/\$\{[a-zA-Z0-9_]+\}/g, (match) => {
    const varName = match.slice(2, -1);
    return `:${varName}`;
  });

  // Ensure it starts with a leading slash
  if (!cleaned.startsWith("/")) {
    cleaned = "/" + cleaned;
  }

  return cleaned;
}

/**
 * Retrieve all registered routes from Express app configuration recursively.
 */
export function getExpressRoutes(app: any): VerifiedRoute[] {
  const routes: VerifiedRoute[] = [];

  function getMountPath(layer: any): string {
    if (!layer.regexp) return "";
    const regStr = layer.regexp.toString();
    
    // Express regex for app.use("/api", ...) is usually /^\/api\/?(?=\/|$)/i
    const match = regStr.match(/^\/\^\\\/([a-zA-Z0-9_\-\/]+)\\\/\?\(\?=\\\/\|\\\$\)\//) 
               || regStr.match(/^\/\^\\\/([a-zA-Z0-9_\-\/]+)\\\/\?\(\?=\\\/\|\$\)\//);
    if (match && match[1]) {
      return "/" + match[1].replace(/\\/g, "");
    }
    
    // General fallback
    let parts = regStr
      .replace(/^\/\^\\\/|^\/\^/, "")
      .split("(?=")[0]
      .replace(/\\/g, "")
      .replace(/\/\?\$/, "")
      .replace(/\/\?$/, "")
      .replace(/\/+$/, "");
    
    if (parts && !parts.startsWith("/")) parts = "/" + parts;
    return parts || "";
  }

  function processStack(stack: any[], prefix = "") {
    for (const layer of stack) {
      if (layer.route) {
        const pathSuffix = layer.route.path;
        const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
        for (const method of methods) {
          routes.push({
            method,
            path: `${prefix}${pathSuffix}`.replace(/\/+/g, "/")
          });
        }
      } else if (layer.name === "router" && layer.handle && layer.handle.stack) {
        const mountPath = getMountPath(layer);
        processStack(layer.handle.stack, `${prefix}${mountPath}`);
      }
    }
  }

  if (app._router && app._router.stack) {
    processStack(app._router.stack);
  }
  return routes;
}

/**
 * Recursively find all TypeScript/JavaScript files in a directory.
 */
function findSourceFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== "dist" && file !== ".git") {
        findSourceFiles(fullPath, fileList);
      }
    } else if (/\.(tsx|ts|jsx|js)$/.test(file)) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

/**
 * Scan all frontend files to detect calls matching "api.get", "api.post", etc. and register them.
 */
export function scanFrontendApiCalls(): FoundFrontendCall[] {
  const frontendDir = path.resolve(process.cwd(), "frontend");
  const files = findSourceFiles(frontendDir);
  const calls: FoundFrontendCall[] = [];

  // Match expressions like: api.get("/url"), api.post(`/url/${param}`), etc.
  const apiCallRegex = /\bapi\.(get|post|put|delete|patch)\s*\(\s*([`"'])([^`"'\s]+)\2/g;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i];
        let match;
        
        // Reset RegExp state before loop
        apiCallRegex.lastIndex = 0;
        
        while ((match = apiCallRegex.exec(lineText)) !== null) {
          const method = match[1].toUpperCase();
          const rawPath = match[3];
          
          calls.push({
            method,
            rawPath,
            normalizedPath: "/api" + normalizePath(rawPath),
            file: path.relative(process.cwd(), file),
            line: i + 1
          });
        }
      }
    } catch (err: any) {
      console.warn(`[Route Validator] Failed to read source file for route scanning: ${file}`, err.message);
    }
  }

  return calls;
}

/**
 * Perform startup comparison validation and print a complete report of active versus broken API routes.
 */
export function validateAllRoutes(app: any) {
  console.log("\n======================================================================");
  console.log("🚀 [Route Validator] Starting Automated Frontend-to-Backend API Verification...");
  console.log("======================================================================");

  try {
    const backendRoutes = getExpressRoutes(app);
    const frontendCalls = scanFrontendApiCalls();

    console.log(`[Route Validator] Registered backend routes total: ${backendRoutes.length}`);
    console.log(`[Route Validator] Detected frontend API calls total: ${frontendCalls.length}`);

    const brokenRoutes: FoundFrontendCall[] = [];
    const verifiedRoutes: FoundFrontendCall[] = [];

    // Helper to evaluate if a frontend path matches a backend route
    const matchesRouteRule = (callPath: string, routePath: string): boolean => {
      // 1. Direct match
      if (callPath === routePath) return true;

      // 2. Normalize express param styles: /workspace/:id to regex
      const routeRegexStr = "^" + routePath
        .replace(/:[a-zA-Z0-9_]+/g, "[a-zA-Z0-9_\\-]+") // Match params
        .replace(/\//g, "\\/") + "$";
      
      const regex = new RegExp(routeRegexStr, "i");
      return regex.test(callPath);
    };

    for (const call of frontendCalls) {
      // Check if some backend route matches this method and path schema
      const hasMatch = backendRoutes.some(route => 
        route.method === call.method && matchesRouteRule(call.normalizedPath, route.path)
      );

      if (hasMatch) {
        verifiedRoutes.push(call);
      } else {
        brokenRoutes.push(call);
      }
    }

    if (verifiedRoutes.length > 0) {
      console.log(`\n✅ [Verified API Routes] (${verifiedRoutes.length} active integrations validated):`);
      const displayed = new Set<string>();
      for (const call of verifiedRoutes) {
        const key = `${call.method} ${call.normalizedPath}`;
        if (!displayed.has(key)) {
          console.log(`  - [${call.method}] ${call.normalizedPath}`);
          displayed.add(key);
        }
      }
    }

    if (brokenRoutes.length > 0) {
      console.error(`\n❌ [BROKEN API REFERENCES DETECTED] (${brokenRoutes.length} potential routing vulnerabilities):`);
      for (const call of brokenRoutes) {
        console.error(`  ⚠️  Mismatched Call: [${call.method}] "${call.rawPath}" (Resolved: ${call.normalizedPath})`);
        console.error(`     Location: File "${call.file}" at Line ${call.line}`);
      }
      console.error("\n⚡ Action required: Ensure the matching controller methods and express routes exist in the backend!");
    } else {
      console.log("\n🌟 [SUCCESS] All frontend API interactions mapped perfectly to deployed backend service endpoints!");
    }

  } catch (err: any) {
    console.error("❌ [Route Validator] Evaluation failed during startup validation sequence:", err);
  }
  console.log("======================================================================\n");
}
