import React, { useState, useMemo } from 'react';
import './ScrAppStore_List.css';
import { GamePhase } from '../../../../../types/gameState';
import { AppDefinition } from '../../../../../types/scrAppListState';
import { APP_REGISTRY } from '../../../../../constants/scrAppListConstants';

type SortState = 'none' | 'asc' | 'desc';

interface ScrAppStore_ListProps {
  credits: number;
  gamePhase: GamePhase;
  getAvailableApps: () => AppDefinition[];
  installedApps: any[];
  selectedAppId: string | null;
  onSelectApp: (appId: string | null) => void;
}

const ScrAppStore_List: React.FC<ScrAppStore_ListProps> = ({
  credits,
  gamePhase,
  getAvailableApps,
  installedApps,
  selectedAppId,
  onSelectApp
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [nameSort, setNameSort] = useState<SortState>('asc');
  const [priceSort, setPriceSort] = useState<SortState>('none');

  // Get ALL apps from registry and add pricing/purchase info
  const allApps = useMemo(() => {
    const installedAppIds = installedApps.map(app => app.id);
    
    return Object.values(APP_REGISTRY).map(app => ({
      ...app,
      purchasePrice: app.tiers?.[0]?.flatUpgradeCost || 0,
      isPurchased: installedAppIds.includes(app.id)
    }));
  }, [installedApps]);

  // Filter and sort apps
  const filteredAndSortedApps = useMemo(() => {
    let filtered = allApps.filter((app: any) => 
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle sorting
    if (nameSort === 'none' && priceSort === 'none') {
      // Application 'none' state = alphabetical without separating purchased apps
      filtered.sort((a: any, b: any) => a.name.localeCompare(b.name));
      return filtered;
    }

    // For all other cases, separate purchased and unpurchased apps
    const unpurchased = filtered.filter((app: any) => !app.isPurchased);
    const purchased = filtered.filter((app: any) => app.isPurchased);
    
    if (nameSort !== 'none') {
      // Application column sorting (asc/desc)
      const comparison = nameSort === 'asc' ? 1 : -1;
      unpurchased.sort((a: any, b: any) => a.name.localeCompare(b.name) * comparison);
      purchased.sort((a: any, b: any) => a.name.localeCompare(b.name) * comparison);
    } else if (priceSort !== 'none') {
      // Price column sorting (when name is 'none' but price is active)
      const comparison = priceSort === 'asc' ? 1 : -1;
      unpurchased.sort((a: any, b: any) => (a.purchasePrice - b.purchasePrice) * comparison);
      purchased.sort((a: any, b: any) => (a.purchasePrice - b.purchasePrice) * comparison);
    } else {
      // Default alphabetical for each group when no explicit sort
      unpurchased.sort((a: any, b: any) => a.name.localeCompare(b.name));
      purchased.sort((a: any, b: any) => a.name.localeCompare(b.name));
    }
    
    return [...unpurchased, ...purchased];
  }, [allApps, searchTerm, nameSort, priceSort]);

  const handleNameSort = () => {
    setPriceSort('none');
    setNameSort(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? 'none' : 'asc');
  };

  const handlePriceSort = () => {
    setNameSort('none');
    setPriceSort(prev => prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none');
  };

  const getSortIndicator = (sortState: SortState, isNameColumn: boolean = false) => {
    if (isNameColumn) {
      // For Application column: down arrow for A-Z, up arrow for Z-A
      switch (sortState) {
        case 'asc': return ' ▼';
        case 'desc': return ' ▲';
        default: return '';
      }
    } else {
      // For Price column: normal behavior
      switch (sortState) {
        case 'asc': return ' ▲';
        case 'desc': return ' ▼';
        default: return '';
      }
    }
  };

  const formatPriceDisplay = (price: number, isPurchased: boolean) => {
    if (isPurchased) return 'PURCHASED';
    if (price === 0) return 'FREE';
    return `₵${price.toLocaleString()}`;
  };

  return (
    <div className="scr-app-store-list">
      {/* Search Bar */}
      <div className="app-search-container">
        <input
          type="text"
          className="app-search-input"
          placeholder="SEARCH APPLICATIONS..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Data Table */}
      <div className="app-table-container">
        {/* Headers */}
        <div className="app-table-headers">
          <div 
            className="app-table-header app-name-header"
            onClick={handleNameSort}
          >
            APPLICATION{getSortIndicator(nameSort, true)}
          </div>
          <div 
            className="app-table-header app-price-header"
            onClick={handlePriceSort}
          >
            COST{getSortIndicator(priceSort, false)}
          </div>
        </div>

        {/* App Rows */}
        <div className="app-table-body">
          {filteredAndSortedApps.length === 0 ? (
            <div className="app-no-results">
              NO APPLICATIONS MATCH SEARCH CRITERIA
            </div>
          ) : (
            filteredAndSortedApps.map((app: any) => (
              <div
                key={app.id}
                className={`app-table-row ${selectedAppId === app.id ? 'selected' : ''} ${app.isPurchased ? 'purchased' : ''}`}
                onClick={() => onSelectApp(selectedAppId === app.id ? null : app.id)}
              >
                <div className="app-name-cell">
                  {app.name}
                </div>
                <div className="app-price-cell">
                  <span className={app.purchasePrice === 0 && !app.isPurchased ? 'free-price' : ''}>
                    {formatPriceDisplay(app.purchasePrice, app.isPurchased)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ScrAppStore_List; 