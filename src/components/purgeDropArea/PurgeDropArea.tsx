/**
 * PurgeDropArea Component
 * 
 * Reusable purge zone drop area that can be used in both the PurgeZone app window
 * and the work mode purge zone. Handles @dnd-kit/core integration and visual effects.
 * 
 * Features:
 * - Configurable DOM ID for multiple instances
 * - Drag-over visual feedback via dragStore
 * - Responsive sizing via containerStyle prop
 * - Consistent purge zone styling and behavior
 */

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useDragStore } from '../../stores';
import './PurgeDropArea.css';

interface PurgeDropAreaProps {
  /** Unique DOM ID for this purge zone instance */
  domId: string;
  /** Optional container styles for sizing/positioning */
  containerStyle?: React.CSSProperties;
  /** Optional class name for additional styling */
  className?: string;
}

const PurgeDropArea: React.FC<PurgeDropAreaProps> = ({
  domId,
  containerStyle = {},
  className = ''
}) => {
  const { setNodeRef } = useDroppable({
    id: domId,
  });

  const overId_cursor = useDragStore(state => state.overId_cursor);
  const overId_item = useDragStore(state => state.overId_item);
  const isActive = (overId_cursor === domId) || (overId_item === domId);

  return (
    <div
      ref={setNodeRef}
      id={domId}
      className={`purge-drop-area${isActive ? ' active' : ''}${className ? ` ${className}` : ''}`}
      style={containerStyle}
    >
      <div className="purge-drop-area-text">
        {isActive ? 'PURGE?' : 'DROP TO PURGE'}
      </div>
    </div>
  );
};

export default PurgeDropArea;
