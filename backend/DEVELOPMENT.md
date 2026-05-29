# DocCMS Development & Execution Guide
---

This guide outlines how to run the DocCMS application using either the **Unified Mode** (where the backend and frontend are consolidated and run together) or the **Separated Mode** (where frontend and backend run entirely independently as decoupled services).

---

## 🚀 Run Option 1: Unified Consolidated Mode (Recommended for Local Dev & Sandbox)

In Unified Mode, a single Express server orchestrates the application. 
- In **Development**, Vite is mounted directly as an internal Express middleware.
- In **Production**, Express serves the compiled frontend static bundle.
- There are no CORS configurations to manage, and both services share port `3000`.

### Steps:
1. Ensure dependencies are fully installed:
   ```bash
   npm install
   ```
2. Launch the consolidated server on port `3000`:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser.

---

## ⚡ Run Option 2: Separated Decoupled Mode (Frontend & Backend Separated)

In Separated Mode, the frontend (Vite) and backend (Express API) run as separate servers. 
- The **Backend API** runs separately on port `3001` (avoids port conflicts automatically and skips spinning up Vite dev-server middleware to conserve CPU/memory).
- The **Frontend App** runs separately on port `3000`. It automatically proxies and forwards all `/api/*` requests to the separated backend on `http://localhost:3001`.

### Steps:

#### 1. Start the Separated Backend API:
In one terminal window, run:
```bash
npm run dev:backend
```
*Output confirmation:*
> `Server listening on port 3001 in development mode`

Any non-API router route accessed directly on the backend port will show:
> `DocCMS API Backend is running separately on port 3001. Access the frontend dynamically for full workflow.`

#### 2. Start the Separated Frontend:
In a second terminal window, run:
```bash
npm run dev:frontend
```
*Output confirmation:*
> `Vite Dev Server running on http://localhost:3000`

The frontend on `http://localhost:3000` now proxies all backend API calls seamlessly to `http://localhost:3001`.

---

## 📦 Production Builds & Compilation Scripts

To build and start each part of your stack for hosting environments (such as Render, Vercel, Railway, etc.):

- **Full Compilation**:
  ```bash
  npm run build
  ```
  *(Compiles the static frontend into `/dist` and bundles the Express backend code into a single, self-contained `/dist/server.cjs` file).*

- **Build Only Frontend (e.g., for Vercel/Netlify)**:
  ```bash
  npm run build:frontend
  ```

- **Build Only Backend (e.g., for Render/Heroku)**:
  ```bash
  npm run build:backend
  ```

- **Start Production Backend/Full App**:
  ```bash
  npm run start
  ```
