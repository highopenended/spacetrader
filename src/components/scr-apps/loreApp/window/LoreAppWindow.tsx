import React, { useMemo, useState, useCallback } from 'react';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';
import { ALL_LORE } from '../../../../gameLore/allLore';
import { filterLoreEntries, groupLoreByCategory } from '../../../../gameLore/loreSearch';
import type { LoreEntry } from '../../../../gameLore/loreTypes';
import './LoreAppWindow.css';

interface LoreAppWindowProps extends BaseWindowProps {}

const LoreAppWindow: React.FC<LoreAppWindowProps> = ({ ...windowProps }) => {
  const [query, setQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const grouped = useMemo(() => {
    const filtered = filterLoreEntries(ALL_LORE, query);
    return groupLoreByCategory(filtered);
  }, [query]);

  return (
    <ScrAppWindow title="Game Lore" {...windowProps}>
      <div className="window-content-padded lore-app-root">
        <div className="lore-app-search-wrap">
          <input
            id="lore-app-search"
            type="search"
            className="lore-app-search-input"
            placeholder="Search title, category, tags…"
            aria-label="Search lore by title, category, or tags"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="lore-app-scroll">
          {grouped.length === 0 ? (
            <div className="lore-app-empty">No entries match.</div>
          ) : (
            grouped.map(([category, entries]) => (
              <section key={category} className="lore-app-category">
                <h2 className="lore-app-category-title">{category}</h2>
                {entries.map((entry) => (
                  <LoreEntryRow
                    key={entry.id}
                    entry={entry}
                    expanded={expandedIds.has(entry.id)}
                    onToggle={() => toggleExpanded(entry.id)}
                  />
                ))}
              </section>
            ))
          )}
        </div>
      </div>
    </ScrAppWindow>
  );
};

function LoreEntryRow({
  entry,
  expanded,
  onToggle,
}: {
  entry: LoreEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="lore-app-entry">
      <div className="lore-app-entry-row">
        <div className="lore-app-entry-title" title={entry.title}>
          {entry.title}
        </div>
        <button
          type="button"
          className="lore-app-expand-btn"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse entry' : 'Expand entry'}
        >
          {expanded ? '\u25BC' : '\u25B6'}
        </button>
      </div>
      {expanded && (
        <div className="lore-app-expand-panel">
          <div className="lore-app-expand-panel-body">
            {entry.body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LoreAppWindow;
