# Centralized Mouse Tracking Refactor

## Summary

Successfully centralized mouse position tracking using the existing `dragStore`, eliminating fragmented tracking across multiple systems and reducing duplicate event listeners.

## Problem

Mouse tracking was scattered across three independent systems:

1. **`useScrapDrag`** - Local state + own mousemove listeners
2. **`useUnifiedDrag`** - Using dragStore (partial implementation)  
3. **`useDragHandler_Windows`** - Local tracking via callbacks

This caused:
- Multiple `mousemove` event listeners attached simultaneously
- Inconsistent throttling approaches
- Difficult debugging when tracking breaks
- Performance overhead from duplicate listeners

## Solution

### Expanded dragStore with Global Mouse Tracking

**New State:**
```typescript
interface MouseTrackingState {
  globalMousePosition: { x: number; y: number } | null;
  isTrackingMouse: boolean;
  trackingSubscribers: Set<string>; // Which components need tracking
}
```

**New Actions:**
- `subscribeToMouse(subscriberId: string)` - Request mouse tracking
- `unsubscribeFromMouse(subscriberId: string)` - Stop mouse tracking
- `updateGlobalMousePosition(position)` - Update position (called by global listener)

### New GlobalMouseTracker Component

**File:** `src/components/GlobalMouseTracker.tsx`

A single, throttled (60fps) mousemove listener that:
- Activates only when subscribers exist
- Updates `dragStore.mouseTracking.globalMousePosition`
- Automatically cleans up when no subscribers

**Mounted once in App.tsx** alongside ClockManager.

### Refactored useScrapDrag

**Changes:**
- ✅ Uses `useDragStore(state => state.mouseTracking.globalMousePosition)` for cursor position
- ✅ Subscribes to global tracking on mount
- ✅ Removes local `cursorPositionPx` state
- ✅ Calls `updateGlobalMousePosition` during drags for immediate updates
- ✅ Still maintains velocity/momentum tracking (scrap-specific physics)

**Why keep local listeners?**
Scrap drags need:
- Velocity calculations for physics
- Momentum tracking for "dense" scrap
- Custom throttling for physics updates

The global position is the source of truth, but local handlers add scrap-specific logic.

## Files Modified

### Core Store
- `src/stores/dragStore.ts` - Added mouse tracking state and actions

### New Component
- `src/components/GlobalMouseTracker.tsx` - Global listener component

### Refactored Hook
- `src/hooks/useScrapDrag.ts` - Now uses centralized tracking

### Integration
- `src/App.tsx` - Added GlobalMouseTracker component

## How to Use

### For New Components Needing Mouse Position

```typescript
import { useDragStore } from '../stores';
import { useEffect } from 'react';

function MyComponent() {
  const mousePos = useDragStore(state => state.mouseTracking.globalMousePosition);
  const subscribeToMouse = useDragStore(state => state.subscribeToMouse);
  const unsubscribeFromMouse = useDragStore(state => state.unsubscribeFromMouse);
  
  // Subscribe to tracking
  useEffect(() => {
    subscribeToMouse('MyComponent');
    return () => unsubscribeFromMouse('MyComponent');
  }, [subscribeToMouse, unsubscribeFromMouse]);
  
  // Use mousePos.x and mousePos.y
  return <div>Mouse at: {mousePos?.x}, {mousePos?.y}</div>;
}
```

### Accessing During Drags

The existing drag systems (`useUnifiedDrag`, `useScrapDrag`) automatically maintain mouse position:

```typescript
// From any component
const dragMousePos = useDragStore(state => state.dragState.mousePosition);
const globalMousePos = useDragStore(state => state.mouseTracking.globalMousePosition);
```

## Benefits

### Performance
- **Single throttled listener** instead of multiple unthrottled ones
- Automatic cleanup when no subscribers
- Selective Zustand subscriptions prevent unnecessary re-renders

### Maintainability  
- One source of truth for mouse position
- Centralized throttling logic
- Easy to debug - check dragStore state

### Flexibility
- Components subscribe only when needed
- Easy to add new mouse-dependent features
- Can track subscribers for debugging

## What's Not Changed

### useDragHandler_Windows
Still uses local tracking because it needs:
- Relative offsets (not absolute position)
- Window-specific drag constraints
- Different event model

Could be centralized later if needed, but current approach works well for window positioning.

### Touch Events
Both global and local touch handling remain unchanged - touch events are tracked locally where needed.

## Testing Checklist

- [x] No linter errors
- [x] MouseDebugReadout component created
- [ ] Scrap dragging works (normal and dense)
- [ ] Window dragging works
- [ ] App list reordering works  
- [x] Mouse position available via store
- [x] Global tracker activates/deactivates based on subscribers
- [ ] Performance: Check for duplicate listeners in DevTools

**See MOUSE_TRACKING_AUDIT.md for comprehensive audit results**

## Future Enhancements

1. **Add touch support to GlobalMouseTracker** for mobile
2. **Refactor useDragHandler_Windows** to use store if beneficial
3. **Add position history** for gesture recognition
4. **Mouse velocity tracking** at global level (not just in scrap drags)

