import React, { forwardRef } from 'react';
import './ScrapBin.css';

const ScrapBin = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
  return (
    <div className="scrap-bin" ref={ref} {...props}>
      <div className="scrap-bin-container">
        <div className="scrap-bin-icon">🗑️</div>
        <div className="scrap-bin-label">SCRAP BIN</div>
      </div>
    </div>
  );
});

export default ScrapBin;