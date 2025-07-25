import React from 'react';
import { ActiveScrapObject, getScrapAppearance } from '../../utils/scrapUtils';
import './ScrapItem.css';

interface ScrapItemProps {
  scrap: ActiveScrapObject;
  style?: React.CSSProperties;
}

const ScrapItem: React.FC<ScrapItemProps> = ({ scrap, style }) => {
  const appearance = getScrapAppearance(scrap);
  
  return (
    <div className="scrap-item" style={style}>
      <div className="scrap-content">{appearance}</div>
    </div>
  );
};

export default ScrapItem; 