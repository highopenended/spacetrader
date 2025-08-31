/**
 * GameOptionsMenu Component
 * 
 * Modal overlay for game options including profile management, achievements, and accessibility settings.
 * Completely modal - blocks all interaction with the game while open.
 */

import React, { useEffect } from 'react';
import { ProfileState } from '../../../types/profileState';
import './GameOptionsMenu.css';

interface GameOptionsMenuProps {
  onClose: () => void;
  profileState: ProfileState;
}

const GameOptionsMenu: React.FC<GameOptionsMenuProps> = ({ onClose, profileState }) => {
  // Block ALL input events to create true modal behavior
  useEffect(() => {
    const handleEventCapture = (e: Event) => {
      // Stop ALL events from reaching any other listeners
      e.stopPropagation();
      
      // Only allow ESC key to close menu, prevent all other keyboard shortcuts
      if (e.type === 'keydown') {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === 'Escape') {
          onClose();
        }
        // Prevent all other keyboard events (including QuickBar shortcuts)
        e.preventDefault();
      }
      
      // Allow mouse events within the modal, but prevent them from reaching game
      if (e.type === 'click' || e.type === 'mousedown' || e.type === 'mouseup') {
        // Let clicks bubble normally within the modal content
        // The onClick handlers in our JSX will still work
        return;
      }
      
      // Block all other events
      e.preventDefault();
    };
    
    // Use capture phase to intercept events before they reach other listeners
    const events = ['keydown', 'keyup', 'keypress'];
    
    events.forEach(eventType => {
      window.addEventListener(eventType, handleEventCapture, { capture: true });
    });
    
    return () => {
      events.forEach(eventType => {
        window.removeEventListener(eventType, handleEventCapture, { capture: true });
      });
    };
  }, [onClose]);

  // Placeholder click handlers
  const handleChangeProfile = () => {
    console.log('Change Profile clicked');
  };

  const handleDeleteProfile = () => {
    console.log('Delete Profile clicked');
  };

  return (
    <div className="options-overlay" onClick={onClose}>
      <div className="options-menu" onClick={(e) => e.stopPropagation()}>
        
        {/* Profile Section */}
        <section className="options-section">
          <h2 className="section-header">Profile</h2>
          
          <div className="profile-info-row">
            <div className="profile-info-item">
              <span className="info-label">Profile:</span>
              <span className="info-value">{profileState.profileName}</span>
            </div>
            <div className="profile-info-item">
              <span className="info-label">Endings Achieved:</span>
              <span className="info-value">{profileState.endingsAchieved.length}</span>
            </div>
          </div>
          
          <div className="profile-buttons-row">
            <button className="options-btn" onClick={handleChangeProfile}>
              Change Profile
            </button>
            <button className="options-btn delete-btn" onClick={handleDeleteProfile}>
              Delete Profile
            </button>
          </div>
        </section>

        {/* Endings Achieved Section */}
        <section className="options-section">
          <h2 className="section-header">Endings Achieved</h2>
        </section>

        {/* Accessibility Section */}
        <section className="options-section">
          <h2 className="section-header">Accessibility</h2>
        </section>

        {/* Close Button */}
        <div className="options-close-section">
          <button className="options-btn close-btn" onClick={onClose}>
            Close Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOptionsMenu;
