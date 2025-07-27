/**
 * SpaceDock Background Component
 * 
 * Renders a space dock themed background with industrial/space station aesthetics.
 * Uses canvas for optimal performance and reduced DOM overhead.
 * Follows the gritty 80s sci-fi dystopian theme.
 */

import React, { useRef, useEffect, useMemo } from 'react';
import './SpaceDock.css';

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
  type: 'bright' | 'medium' | 'dim' | 'orange' | 'blue';
  color: string;
  hasCrosshair: boolean;
}

const SpaceDock: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // Generate stars data
  const stars = useMemo((): Star[] => {
    return Array.from({ length: 600 }).map(() => {
      const x = Math.random();
      const y = Math.random();
      
      // Create different star types
      const starType = Math.random();
      let size: number, brightness: number, twinkleSpeed: number, type: Star['type'], color: string;
      
      if (starType < 0.02) {
        // Colored stars (2%) - very rare
        const colorType = Math.random();
        if (colorType < 0.5) {
          // Orange stars
          size = Math.random() * 1.5 + 1;
          brightness = Math.random() * 0.3 + 0.7;
          twinkleSpeed = Math.random() * 4 + 3;
          type = 'orange';
          color = '#FFF8DC';
        } else {
          // Blue stars
          size = Math.random() * 1.2 + 0.8;
          brightness = Math.random() * 0.4 + 0.6;
          twinkleSpeed = Math.random() * 5 + 4;
          type = 'blue';
          color = '#87CEEB';
        }
      } else if (starType < 0.05) {
        // Bright stars (3%)
        size = Math.random() * 1.2 + 0.8;
        brightness = Math.random() * 0.4 + 0.8;
        twinkleSpeed = Math.random() * 3 + 2;
        type = 'bright';
        color = 'white';
      } else if (starType < 0.15) {
        // Medium stars (10%)
        size = Math.random() * 1 + 0.8;
        brightness = Math.random() * 0.3 + 0.5;
        twinkleSpeed = Math.random() * 4 + 3;
        type = 'medium';
        color = 'white';
      } else {
        // Dim stars (85%)
        size = Math.random() * 0.8 + 0.2;
        brightness = Math.random() * 0.4 + 0.1;
        twinkleSpeed = 0; // No twinkle for dim stars
        type = 'dim';
        color = 'white';
      }

      return {
        x,
        y,
        size,
        brightness,
        twinkleSpeed,
        twinklePhase: Math.random() * Math.PI * 2, // Random starting phase
        type,
        color,
        hasCrosshair: starType >= 0.85 && Math.random() < 0.1, // 10% of dim stars get crosshairs
      };
    });
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = (timestamp: number) => {
      // Clear canvas
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw atmospheric gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.03)');
      gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.06)');
      gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.08)');
      gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.06)');
      gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.03)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.01)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      stars.forEach(star => {
        const x = star.x * canvas.width;
        const y = star.y * canvas.height;
        
        // Calculate twinkle effect
        let currentBrightness = star.brightness;
        let currentSize = star.size;
        
        if (star.twinkleSpeed > 0) {
          const twinkle = Math.sin(timestamp * 0.001 * star.twinkleSpeed + star.twinklePhase);
          const twinkleFactor = (twinkle + 1) / 2; // Normalize to 0-1
          
          switch (star.type) {
            case 'bright':
              currentBrightness = star.brightness * (0.85 + twinkleFactor * 0.15);
              currentSize = star.size * (1 + twinkleFactor * 0.1);
              break;
            case 'medium':
              currentBrightness = star.brightness * (0.7 + twinkleFactor * 0.2);
              currentSize = star.size * (1 + twinkleFactor * 0.05);
              break;
            case 'orange':
              currentBrightness = star.brightness * (0.8 + twinkleFactor * 0.2);
              currentSize = star.size * (1 + twinkleFactor * 0.15);
              break;
            case 'blue':
              currentBrightness = star.brightness * (0.75 + twinkleFactor * 0.2);
              currentSize = star.size * (1 + twinkleFactor * 0.12);
              break;
            default:
              // Dim stars don't twinkle
              break;
          }
        }

        // Draw star with more realistic appearance
        const coreRadius = currentSize;
        const innerGlowRadius = currentSize * 1.5;
        const outerGlowRadius = currentSize * 2.5;
        
        // Create more defined glow with steeper falloff
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, outerGlowRadius);
        
        switch (star.type) {
          case 'bright':
            gradient.addColorStop(0, `rgba(255, 255, 255, ${currentBrightness})`);
            gradient.addColorStop(0.2, `rgba(255, 255, 255, ${currentBrightness * 0.8})`);
            gradient.addColorStop(0.4, `rgba(255, 255, 255, ${currentBrightness * 0.3})`);
            gradient.addColorStop(0.7, `rgba(255, 255, 255, ${currentBrightness * 0.1})`);
            gradient.addColorStop(1, 'transparent');
            break;
          case 'medium':
            gradient.addColorStop(0, `rgba(255, 255, 255, ${currentBrightness})`);
            gradient.addColorStop(0.3, `rgba(255, 255, 255, ${currentBrightness * 0.5})`);
            gradient.addColorStop(0.6, `rgba(255, 255, 255, ${currentBrightness * 0.15})`);
            gradient.addColorStop(1, 'transparent');
            break;
          case 'orange':
            gradient.addColorStop(0, `rgba(255, 248, 220, ${currentBrightness})`);
            gradient.addColorStop(0.2, `rgba(255, 248, 220, ${currentBrightness * 0.7})`);
            gradient.addColorStop(0.5, `rgba(255, 248, 220, ${currentBrightness * 0.2})`);
            gradient.addColorStop(0.8, `rgba(255, 248, 220, ${currentBrightness * 0.05})`);
            gradient.addColorStop(1, 'transparent');
            break;
          case 'blue':
            gradient.addColorStop(0, `rgba(135, 206, 235, ${currentBrightness})`);
            gradient.addColorStop(0.2, `rgba(135, 206, 235, ${currentBrightness * 0.7})`);
            gradient.addColorStop(0.5, `rgba(135, 206, 235, ${currentBrightness * 0.25})`);
            gradient.addColorStop(0.8, `rgba(135, 206, 235, ${currentBrightness * 0.08})`);
            gradient.addColorStop(1, 'transparent');
            break;
          default:
            // Dim stars - minimal, sharp glow
            gradient.addColorStop(0, `rgba(255, 255, 255, ${currentBrightness})`);
            gradient.addColorStop(0.4, `rgba(255, 255, 255, ${currentBrightness * 0.2})`);
            gradient.addColorStop(0.8, `rgba(255, 255, 255, ${currentBrightness * 0.05})`);
            gradient.addColorStop(1, 'transparent');
            break;
        }

        // Draw outer glow
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, outerGlowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw inner glow for brighter stars
        if (star.type === 'bright' || star.type === 'orange' || star.type === 'blue') {
          const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, innerGlowRadius);
          const innerColor = star.type === 'orange' ? 'rgba(255, 248, 220, 0.6)' : 
                           star.type === 'blue' ? 'rgba(135, 206, 235, 0.6)' : 
                           'rgba(255, 255, 255, 0.6)';
          
          innerGradient.addColorStop(0, innerColor);
          innerGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
          innerGradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = innerGradient;
          ctx.beginPath();
          ctx.arc(x, y, innerGlowRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw sharp star core
        ctx.fillStyle = star.color;
        ctx.globalAlpha = currentBrightness;
        ctx.beginPath();
        ctx.arc(x, y, coreRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Draw diamond crosshairs for select dim stars
        if (star.hasCrosshair) {
          const crosshairLength = currentSize * 3;
          const crosshairWidth = Math.max(0.3, currentSize * 0.2);
          
          ctx.strokeStyle = star.color;
          ctx.lineWidth = crosshairWidth;
          ctx.globalAlpha = currentBrightness * 0.6;
          
          // Vertical line
          ctx.beginPath();
          ctx.moveTo(x, y - crosshairLength);
          ctx.lineTo(x, y + crosshairLength);
          ctx.stroke();
          
          // Horizontal line
          ctx.beginPath();
          ctx.moveTo(x - crosshairLength, y);
          ctx.lineTo(x + crosshairLength, y);
          ctx.stroke();
          
          ctx.globalAlpha = 1;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stars]);

  return (
    <canvas
      ref={canvasRef}
      className="starfield-canvas"
    />
  );
};

export default SpaceDock; 