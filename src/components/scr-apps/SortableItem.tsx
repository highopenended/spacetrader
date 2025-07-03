/**
 * Sortable Item Component
 * 
 * A wrapper component that makes any child component sortable using dnd-kit.
 * Replaces the custom ScrApp-DragWrapper with a cleaner dnd-kit based approach.
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './SortableItem.css';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  onAppClick?: () => void;
  disabled?: boolean;
  isOverDeleteZone?: boolean;
}

const SortableItem: React.FC<SortableItemProps> = ({ 
  id, 
  children, 
  onAppClick,
  disabled = false,
  isOverDeleteZone = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled 
  });

  // Apply transform for smooth dragging
  const style = {
    transform: CSS.Transform.toString(transform),
    // Remove transition to prevent annoying slide-in animations
    // transition,
  };

  // Simple click handler - dnd-kit won't interfere due to activation constraint
  const handleClick = (e: React.MouseEvent) => {
    if (onAppClick) {
      onAppClick();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-item ${isDragging ? 'dragging' : ''} ${onAppClick ? 'clickable' : ''} ${isOverDeleteZone ? 'over-delete-zone' : ''}`}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
};

export default SortableItem; 