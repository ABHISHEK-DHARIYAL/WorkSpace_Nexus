# WorkSpace Nexus Agent Guidelines & Responsive Design System

This file preserves user instructions, design systems, and responsive guidelines for DocCMS. All future modifications by any developer or AI assistant must adhere strictly to the following parameters.

---

## 📱 Global Responsive Configuration

All UI elements must adapt perfectly to the entire multi-device viewport spectrum:

- **Extra Small (xs)**: `320px` - `480px` (Compact screens, foldables, older mobile devices)
- **Small (sm)**: `480px` - `768px` (Modern mobile devices, portrait foldables)
- **Medium (md)**: `768px` - `1024px` (iPads, portrait tablets, hybrid terminals)
- **Large (lg)**: `1024px` - `1280px` (Landscape tablets, small laptops)
- **Extra Large (xl)**: `1280px` + (Large screens, ultrawide workspaces, monitors)

---

## 🎨 Typography & Spacing Scaling Rules

To guarantee a fully responsive, pixel-perfect experience without text-overlaps, clipping, or system overflow:

1. **Dynamic Font Sizes**: Rely on `clamp()` typography structures defined in `/frontend/styles/responsive.css`. Avoid hardcoded pixel values (`font-size: 16px` is strictly forbidden).
2. **Viewport Relative Gaps**: Scale paddings, margins, and gaps dynamically depending on screen limits using `clamp()` values or responsive classes (`p-3 sm:p-5 lg:p-8`).
3. **Responsive Wrappers**: Use the pre-baked layout wrappers inside `<ResponsiveLayout>`, `<ResponsiveContainer>`, and `<ResponsiveSidebar>`:

### Layout Elements List:

- **ResponsiveLayout**: Fluid multi-device container handling overall full-screen layouts with desktop lateral menus and mobile lateral slide-drawers.
- **ResponsiveContainer**: Adaptive centered sheet boundaries clamps.
- **ResponsiveGrid**: Multi-column grids adapting columns from 1 up to 4 dynamically (`repeat(auto-fit, minmax(280px, 1fr))`).
- **ResponsiveSidebar**: Drawers for small/mobile devices, collapsible sections for tablets, fixed panels for desktop.
- **ResponsiveModal**: Automatically transforms modals into accessible bottom drawers on smaller responsive devices.
- **ResponsiveToolbar**: Action lists that wrap or convert to horizontally scrollable menus on mobile screens.

---

## 🔒 Preserved Architecture Rules

- DO NOT disable or bypass the viewport provider `<ViewportProvider>` or the `useBreakpoint` / `useDevice` hook system.
- DO NOT shrink or omit features, action items, or configuration options for small devices. Instead, adapt their sizes, paddings, and alignment.
- DO NOT let fixed pixel coordinates override fluid bounds (`w-full`, `%`, `vw`, `vh`).
