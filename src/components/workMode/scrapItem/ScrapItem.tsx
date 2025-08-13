import React, { useMemo } from 'react';
import { ActiveScrapObject, getScrapAppearance } from '../../../utils/scrapUtils';
import './ScrapItem.css';

interface ScrapItemProps {
  scrap: ActiveScrapObject;
  style?: React.CSSProperties;
  draggableProps?: {
    onMouseDown?: (e: React.MouseEvent) => void;
    onTouchStart?: (e: React.TouchEvent) => void;
  };
}

const ScrapItem: React.FC<ScrapItemProps> = ({ scrap, style, draggableProps }) => {
  // Memoize appearance calculation to prevent recalculation on every render
  const appearance = useMemo(() => getScrapAppearance(scrap), [
    scrap.typeId,
    scrap.mutators.join(',') // Convert array to string for comparison
  ]);
  
  return (
    <div className="scrap-item" data-scrap-id={scrap.id} style={style} {...draggableProps}>
      <div className="scrap-content">{appearance}</div>
    </div>
  );
};

export default React.memo(ScrapItem); 