/**
 * Work Mode Purge Zone Component
 * 
 * Minimal wrapper that positions the reusable PurgeDropArea component
 * beside the ScrapBin during work sessions. Contains zero logic - 
 * only exists to house the purge zone in the correct location.
 */

import React from 'react';
import PurgeDropArea from '../../purgeDropArea/PurgeDropArea';
import { DOM_IDS } from '../../../constants/domIds';
import './WorkModePurgeZone.css';

const WorkModePurgeZone: React.FC = () => {
  return (
    <div className="work-mode-purge-zone">
      <PurgeDropArea
        domId={DOM_IDS.PURGE_ZONE_WORKMODE}
        containerStyle={{
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
};

export default WorkModePurgeZone;
