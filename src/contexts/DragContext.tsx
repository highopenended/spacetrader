/**
 * Drag Context
 * 
 * Provides drag state information through React context.
 * Used by components that need drag-over visual feedback styling.
 * Centralized way to share drag state from the unified drag hook.
 */

import React, { createContext, useContext, ReactNode } from 'react';

// Interface for drag context state
export interface DragContextState {
  // Visual feedback state
  overId: any;
  isOverTerminalDropZone: boolean;
  
  // Drag state
  dragState: {
    isDragging: boolean;
    draggedAppId: string | null;
    draggedAppType: string | null;
    draggedWindowTitle: string | null;
    mousePosition: { x: number; y: number } | null;
  };
  
  // Drag type information (for debugging and conditional styling)
  dragType: 'none' | 'app-drag-node' | 'window-drag-node';
}

// Create the context
const DragContext = createContext<DragContextState | null>(null);

// Provider component props
interface DragContextProviderProps {
  children: ReactNode;
  value: DragContextState;
}

// Provider component
export const DragContextProvider: React.FC<DragContextProviderProps> = ({ 
  children, 
  value 
}) => {
  return (
    <DragContext.Provider value={value}>
      {children}
    </DragContext.Provider>
  );
};

// Hook to use the drag context
export const useDragContext = (): DragContextState => {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error('useDragContext must be used within a DragContextProvider');
  }
  return context;
}; 