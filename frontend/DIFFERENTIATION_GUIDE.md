# WorkSpace Nexus Code & Architecture Differentiation Guide

---

This guide highlights the separation of concerns between the **Workspace Hub / Listings Subsystem** and the **Document Nexus / Workspaces Subsystem** to ensure developers can easily locate, modify, and expand either architectural component.

---

## 🗺️ System Overview & Separation of Concerns

WorkSpace Nexus is structured as a dual-engine architecture:

1. **Workspace Hub (Listings)**: High-level document curation, project metadata collection, public sharing parameters, general bookmarks, and global activity monitoring. This is where user listings/projects are registered with attributes, tags, and general-use statuses.
2. **Document Nexus (Workspaces & Canvas)**: Low-level interactive workspace, multi-page layout canvases, index trees, inline WYSIWYG editors, custom background engines, and page-by-page annotation managers.

```
                  ┌─────────────────────────────────────────┐
                  │           WorkSpace Nexus App           │
                  └────────────────────┬────────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
  ┌───────────────────────────┐                 ┌───────────────────────────┐
  │    WORKSPACE HUB / LISTS  │                 │    DOCUMENT NEXUS / PAGES │
  └─────────────┬─────────────┘                 └─────────────┬─────────────┘
                │                                             │
      Database Flag:                                Database Flag:
      `addedToNexus: false`                         `addedToNexus: true`
                │                                             │
      Core Files:                                   Core Files:
      - ListingDashboard.tsx                        - DocumentWorkspace.tsx
      - ListingReader.tsx                           - Editor.tsx
      - ListingEditor.tsx                           - DocumentSidebar.tsx
      - BookmarksPage.tsx                           - docPageService / docIndexService
```

---

## 🛠️ Codebase Mapping

### 1. Workspace Hub & Listings Subsystem

These assets manage collections of projects, external cataloging, and top-level bookmark curation.

- **Primary Dashboard view**: `frontend/pages/ListingDashboard.tsx`
  - Displays public listings, global stats, activity feeds, project tagging, and visibility settings.
  - Filters and operates ONLY on items where `addedToNexus !== true` (i.e. standard listings or workspace hub projects).
- **Document Reader**: `frontend/pages/ListingReader.tsx`
  - Implements responsive, speed-optimized reader for standard publications.
- **Document Metadata Configurator**: `frontend/pages/ListingEditor.tsx`
  - High-level metadata builder for standard listings, linking indices and tags.
- **Relevant Database Attributes & Flags**:
  - `workspaceId`: Binds the Project/Listing to a high-level organizational scope (e.g. `main`).
  - `addedToNexus = false / undefined`: Indicates this is a general-purpose Workspace Hub Listing, NOT an interactive Document Nexus canvas.

### 2. Document Nexus & Pages Subsystem

These assets handle deep editing, tree hierarchy, page creation, and live workspace customisation.

- **Primary Nexus View**: `frontend/pages/DocumentWorkspace.tsx`
  - High-end, single-screen responsive hub containing the multi-panel editor and workspace index trees.
  - Operates ONLY on listings/projects where `addedToNexus === true` (interactive Document Nexus projects).
- **Inline Editor Component**: `frontend/components/editor/Editor.tsx`
  - A full-stack customizable wysiwyg text editor.
- **Navigation Tree Explorer**: `frontend/components/workspace/DocumentSidebar.tsx`
  - Nested page views, index nodes, and hierarchical document explorers.
- **Relevant Database Services**:
  - `docPageService` (`/content/page`): Distinct page resource queries supporting custom order weights.
  - `docIndexService` (`/index`): Tree indices mapping parent-child page clusters in real time.
  - `addedToNexus = true`: Binds a Listing/Project specifically to the active Document Nexus editor environment.

---

## ⚡ Extension Guides

If you wish to expand these systems, follow the blueprint below:

### How to Expand the "Workspace Hub" (Listings):

1. **Adding general attributes**: Update the service interfaces and inputs inside `frontend/pages/ListingDashboard.tsx`. Set `addedToNexus: false` upon creation to prevent bleeding into the Canvas sidebar.
2. **Adding bookmarks or filtering**: Add handlers to `filteredListings` or `workspaceListings` inside `ListingDashboard.tsx`.

### How to Expand the "Document Nexus" (Workspaces & Canvas):

1. **Adding customized editor modules**: Modify `frontend/components/editor/Editor.tsx` to include newer text blocks, layout widgets, or toolbar operations.
2. **Adding page structure metadata**: Modify the `docPageService` operations inside `frontend/pages/DocumentWorkspace.tsx` to handle page classification or status flags.
