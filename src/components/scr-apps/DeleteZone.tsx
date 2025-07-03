/**
 * Delete Zone Component
 * 
 * A droppable area that covers the entire screen outside the terminal.
 * Provides visual feedback when apps are dragged over it for deletion.
 */

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import './DeleteZone.css';

interface DeleteZoneProps {
  isActive: boolean; // Whether an app is currently being dragged over this zone
}

const DeleteZone: React.FC<DeleteZoneProps> = ({ isActive }) => {
  const { setNodeRef } = useDroppable({
    id: 'delete-zone',
  });

  return (
    <div
      ref={setNodeRef}
      className={`delete-zone ${isActive ? 'active' : ''}`}
    >
      {/* No visual content - just a drop target */}
    </div>
  );
};

export default DeleteZone; 