import React from 'react';
import './ScrAppStore_Details.css';

interface ScrAppStore_DetailsProps {
  selectedAppId: string | null;
  credits: number;
  installApp: (appId: string) => void;
  onAppInstalled: () => void;
}

const ScrAppStore_Details: React.FC<ScrAppStore_DetailsProps> = ({
  selectedAppId,
  credits,
  installApp,
  onAppInstalled
}) => {
  return (
    <div className="scr-app-store-details">
      {/* Header section will go here */}
      
      {/* Information section (scrollable) will go here */}
      
      {/* Purchase button section will go here */}
      
      <div>Right Half - App Details (Placeholder)</div>
      <div>Selected: {selectedAppId || 'None'}</div>
      <div>Credits: ₵{credits.toLocaleString()}</div>
    </div>
  );
};

export default ScrAppStore_Details; 