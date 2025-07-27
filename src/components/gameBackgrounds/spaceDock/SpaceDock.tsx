/**
 * SpaceDock Background Component
 * 
 * Renders a space dock themed background with industrial/space station aesthetics.
 * Follows the gritty 80s sci-fi dystopian theme.
 */

import React, { useMemo } from 'react';
import './SpaceDock.css';

const SpaceDock: React.FC = () => {
  const stars = useMemo(() => {
    return Array.from({ length: 600 }).map((_, i) => {
      const top = Math.random();
      const left = Math.random();
      
      // Create different star types
      const starType = Math.random();
      let size, brightness, twinkle, className, color;
      
      if (starType < 0.02) {
        // Colored stars (2%) - very rare
        const colorType = Math.random();
        if (colorType < 0.5) {
          // Orange stars
          size = Math.random() * 1.5 + 1;
          brightness = Math.random() * 0.3 + 0.7;
          twinkle = Math.random() * 4 + 3;
          className = 'star colored orange';
          color = '#FFF8DC';
        } else {
          // Blue stars
          size = Math.random() * 1.2 + 0.8;
          brightness = Math.random() * 0.4 + 0.6;
          twinkle = Math.random() * 5 + 4;
          className = 'star colored blue';
          color = '#87CEEB';
        }
      } else if (starType < 0.05) {
        // Bright stars (3%)
        size = Math.random() * 2 + 1.5;
        brightness = Math.random() * 0.4 + 0.8;
        twinkle = Math.random() * 3 + 2;
        className = 'star bright';
        color = 'white';
      } else if (starType < 0.15) {
        // Medium stars (10%)
        size = Math.random() * 1 + 0.8;
        brightness = Math.random() * 0.3 + 0.5;
        twinkle = Math.random() * 4 + 3;
        className = 'star medium';
        color = 'white';
      } else {
        // Dim stars (85%)
        size = Math.random() * 0.8 + 0.2;
        brightness = Math.random() * 0.4 + 0.1;
        twinkle = 0; // No twinkle for dim stars
        className = 'star dim';
        color = 'white';
      }

      return {
        id: i,
        top: `${top * 100}%`,
        left: `${left * 100}%`,
        size: `${size}px`,
        brightness: brightness,
        twinkle: twinkle,
        className: className,
        color: color,
      };
    });
  }, []); // Empty dependency array means this only runs once

  return (
    <div className="starfield">
      {stars.map((star) => (
        <div
          key={star.id}
          className={star.className}
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            opacity: star.brightness,
            backgroundColor: star.color,
            animationDuration: star.twinkle ? `${star.twinkle}s` : 'none',
          }}
        />
      ))}
    </div>
  );
};

export default SpaceDock; 