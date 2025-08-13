# SpaceTrader (SCR) — Minimalist 80s Sci‑Fi Incremental

Gritty, analog, terminal‑driven incremental game. Primary UI is a terminal list of compact apps; apps open into draggable/resizable windows. Color palette: blacks, whites, greys with terminal greens.

## Architecture Overview

- UI shell: `src/App.tsx`
- Terminal apps: `src/components/scr-apps/{appName}/listItem`
- Windows: `src/components/scr-apps/{appName}/window`
- Base components: `ScrAppItem`, `SortableItem`, `ScrAppWindow`
- State hooks (single-instance pattern): `useGameState`, `useWindowState`, `useToggleState`, `useQuickBarState`
- Drag orchestration: `DragManager` + `useUnifiedDrag` + `DragContext`
- Props building: `utils/appPropsBuilder.ts`

## Unified Drag System

- App list drag: reorder, delete via Purge Zone, undock to open as window
- Window drag: position via custom handler, delete via Purge Zone using @dnd-kit drag node
- Droppable targets: `terminal-dock-zone`, `purge-zone-window`
- Visuals: app ghost overlay; 12px red indicator for window purge drags

Key files:
- `src/components/DragManager.tsx`
- `src/hooks/useUnifiedDrag.ts`
- `src/contexts/DragContext.tsx`
- `src/components/scr-apps/scrAppWindow/ScrAppWindow.tsx`

## App and Window Patterns

- See `app-item-structure-pattern`
- See `app-window-structure-pattern`

## Theming

- Follow `src/styles/globals.css`
- Minimalist; avoid new custom CSS when existing classes suffice; never use `!important`

## Dev Notes

- Single-instance hooks live in `App.tsx`; pass data via props
- Windows are rendered via `windowRegistry.renderWindow`
- Avoid duplicate logic; prefer centralized utilities and constants
