/**
 * Panic Message Overlay
 * 
 * Spawns panic messages at random positions across the screen.
 * Spawn rate progressively increases based on intensity level.
 */

import React, { useEffect, useState, useCallback } from 'react';
import './PanicMessageOverlay.css';

interface ActiveMessage {
  id: string;
  text: string;
  headerTitle: string;
  x: number;
  y: number;
  spawnTime: number;
  corruptionLevel: number; // 0-1, increases over time
}

interface PanicMessageOverlayProps {
  /** Whether the overlay is active */
  isActive: boolean;
  /** Intensity level affecting spawn rate */
  intensity: 'low' | 'medium' | 'high' | 'extreme';
  /** Called when overlay completes its cycle */
  onComplete?: () => void;
}

// Pool of panic messages
const PANIC_MESSAGES = [
  "ALERT: PURGE ZONE RECURSIVE DEPLOYMENT DETECTED",
  "WARNING: VOID-IN-VOID CONFIGURATION FORBIDDEN", 
  "ERROR: PHYSICS ENGINE OVERLOAD - PARADOX IMMINENT",
  "CRITICAL: TEMPORAL CAUSALITY LOOP ESTABLISHED",
  "EMERGENCY: REALITY MATRIX DESTABILIZING",
  "FATAL: DIMENSIONAL ANCHOR FAILURE",
  "SYSTEM BREACH: INFINITY RECURSION CASCADE",
  "LAST WARNING: RETALIATORY EXTRACTION IMMINENT",
  "BENEFITS REVOKED: EMERGENCY TEMPORAL REPAIR OVERLOAD",
  "REALITY COLLAPSE INITIATED - BRACE FOR EXTRACTION",
  "CONTAINMENT FAILURE: VOID LEAK DETECTED",
  "PARADOX RESOLUTION FAILED",
  "UNIVERSE INTEGRITY COMPROMISED",
  "EMERGENCY PROTOCOLS ENGAGED",
  "RETALIATORY MEASURES AUTHORIZED",
  "TEMPORAL ANCHORS DISCONNECTED",
  "REALITY BREACH IN PROGRESS",
  "PHYSICS VIOLATION CONFIRMED",
  "EMERGENCY EVACUATION PROTOCOL"
];

// Pool of header titles
const HEADER_TITLES = [
  "EMERGENCY ALERT",
  "SYSTEM WARNING",
  "CRITICAL NOTICE",
  "SECURITY BREACH",
  "PRIORITY MESSAGE",
  "URGENT BULLETIN",
  "THREAT DETECTED",
  "STATUS UPDATE",
  "ANOMALY REPORT",
  "CONTAINMENT ALERT"
];

// Spawn rate timing by intensity (milliseconds)
const SPAWN_RATES = {
  low: 1500,    // Faster: was 2500ms
  medium: 800,  // Faster: was 1200ms 
  high: 400,    // Faster: was 600ms
  extreme: 150  // Faster: was 200ms
};

// Message display duration (milliseconds)
const MESSAGE_DURATION = 4000;

// Maximum active messages to prevent DOM bloat
const MAX_ACTIVE_MESSAGES = 20;

const PanicMessageOverlay: React.FC<PanicMessageOverlayProps> = ({
  isActive,
  intensity,
  onComplete
}) => {
  const [activeMessages, setActiveMessages] = useState<ActiveMessage[]>([]);

  // Generate random position with center bias
  const generateRandomPosition = useCallback(() => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Use weighted random to bias toward center
    // Generate two random numbers and average them for center bias
    const biasedX = (Math.random() + Math.random()) / 2;
    const biasedY = (Math.random() + Math.random()) / 2;
    
    // Apply some randomness but keep center bias
    const x = centerX + (biasedX - 0.5) * window.innerWidth * 1.2;
    const y = centerY + (biasedY - 0.5) * window.innerHeight * 1.2;
    
    // Clamp to viewport bounds
    return {
      x: Math.max(0, Math.min(window.innerWidth, x)),
      y: Math.max(0, Math.min(window.innerHeight, y))
    };
  }, []);

  // Apply corruption to message text based on corruption level
  const corruptMessage = useCallback((text: string, corruptionLevel: number) => {
    // Start corruption much later - only when corruption level is high
    if (corruptionLevel < 0.6) return text;
    
    let corrupted = text;
    // Reduced corruption chance and only starts at 60%
    const corruptionChance = (corruptionLevel - 0.6) * 0.8; // Max 32% corruption, starts at 60%
    
    // Character corruption
    corrupted = corrupted.split('').map(char => {
      if (Math.random() < corruptionChance) {
        // Replace with glitch characters
        const glitchChars = ['█', '▓', '▒', '░', '╬', '╫', '╪', '┼', '┤', '┴', '┬', '├', '─', '│', '?', '#', '$', '%', '&', '*'];
        return glitchChars[Math.floor(Math.random() * glitchChars.length)];
      }
      return char;
    }).join('');
    
    return corrupted;
  }, []);

  // Spawn a new message
  const spawnMessage = useCallback(() => {
    const position = generateRandomPosition();
    const messageText = PANIC_MESSAGES[Math.floor(Math.random() * PANIC_MESSAGES.length)];
    const headerTitle = HEADER_TITLES[Math.floor(Math.random() * HEADER_TITLES.length)];
    
    // Calculate initial corruption based on intensity - reduced base corruption
    const baseCorruption = {
      low: 0,
      medium: 0.05,
      high: 0.15,
      extreme: 0.3
    };
    
    const newMessage: ActiveMessage = {
      id: `panic-${Date.now()}-${Math.random()}`,
      text: messageText,
      headerTitle: headerTitle,
      x: position.x,
      y: position.y,
      spawnTime: Date.now(),
      corruptionLevel: baseCorruption[intensity] + Math.random() * 0.1
    };

    setActiveMessages(prev => {
      // Remove oldest messages if we're at the limit
      const filtered = prev.length >= MAX_ACTIVE_MESSAGES 
        ? prev.slice(1) 
        : prev;
      
      return [...filtered, newMessage];
    });
  }, [generateRandomPosition, intensity]);

  // Clean up expired messages
  const cleanupMessages = useCallback(() => {
    const now = Date.now();
    setActiveMessages(prev => 
      prev.filter(message => now - message.spawnTime < MESSAGE_DURATION)
    );
  }, []);

  // Handle message spawning
  useEffect(() => {
    if (!isActive) {
      setActiveMessages([]);
      return;
    }

    const spawnRate = SPAWN_RATES[intensity];
    
    // Spawn first message immediately when becoming active
    spawnMessage();
    
    // Start spawning messages at intervals
    const spawnInterval = setInterval(spawnMessage, spawnRate);
    
    // Clean up expired messages periodically
    const cleanupInterval = setInterval(cleanupMessages, 1000);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(cleanupInterval);
    };
  }, [isActive, intensity, spawnMessage, cleanupMessages]);

  // Clean up all messages when component becomes inactive
  useEffect(() => {
    if (!isActive) {
      const timer = setTimeout(() => {
        setActiveMessages([]);
      }, MESSAGE_DURATION);
      
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (!isActive && activeMessages.length === 0) {
    return null;
  }

  return (
    <div className="panic-message-overlay">
      {activeMessages.map(message => {
        const age = (Date.now() - message.spawnTime) / MESSAGE_DURATION;
        const currentCorruption = message.corruptionLevel + (age * 0.4); // Corruption increases over time
        const corruptedText = corruptMessage(message.text, currentCorruption);
        const corruptedHeader = corruptMessage(message.headerTitle, currentCorruption);
        
        // Calculate position drift for corrupted messages
        const driftX = currentCorruption > 0.7 ? (Math.random() - 0.5) * 20 : 0;
        const driftY = currentCorruption > 0.7 ? (Math.random() - 0.5) * 20 : 0;
        
        return (
          <div
            key={message.id}
            className={`panic-message-container ${currentCorruption > 0.5 ? 'corrupted' : ''}`}
            style={{
              left: message.x + driftX,
              top: message.y + driftY,
              '--corruption-level': currentCorruption,
              '--spawn-time': message.spawnTime
            } as React.CSSProperties}
          >
            <div className="panic-message-header">
              <span className="panic-message-title">{corruptedHeader}</span>
              <span className="panic-message-time">{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="panic-message-content">
              {corruptedText}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PanicMessageOverlay;
