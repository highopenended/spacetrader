import React from 'react';
import './WorkTimer.css';

interface WorkTimerProps {
  elapsedSeconds: number;
  frameCount: number;
  collectedCount?: number;
}

const WorkTimer: React.FC<WorkTimerProps> = ({ elapsedSeconds, frameCount, collectedCount }) => {
  return (
    <div className="work-timer">
      <div className="timer-display">
        <span className="timer-seconds">{elapsedSeconds.toFixed(1)}s</span>
        <span className="timer-frames">{frameCount} frames</span>
        {typeof collectedCount === 'number' && (
          <span className="timer-collected">collected: {collectedCount}</span>
        )}
      </div>
    </div>
  );
};

export default WorkTimer; 