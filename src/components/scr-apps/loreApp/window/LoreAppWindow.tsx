import React, { useMemo, useState, useCallback } from 'react';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';
import { ALL_LORE } from '../../../../gameLore/allLore';
import { filterLoreEntries, groupLoreByCategory } from '../../../../gameLore/loreSearch';
import type { LoreEntry } from '../../../../gameLore/loreTypes';
import './LoreAppWindow.css';

/** Three discrete text sizes (rem on `.lore-app-root`). */
const LORE_FONT_PRESETS = [
  { rem: 0.875, label: 'Small' },
  { rem: 1, label: 'Medium' },
  { rem: 1.125, label: 'Large' },
] as const;

const DEFAULT_LORE_FONT_LEVEL = 1;

interface LoreAppWindowProps extends BaseWindowProps {}

const LoreAppWindow: React.FC<LoreAppWindowProps> = ({ ...windowProps }) => {
  const [query, setQuery] = useState('');
  const [fontLevel, setFontLevel] = useState(DEFAULT_LORE_FONT_LEVEL);
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

  const fontPreset = LORE_FONT_PRESETS[fontLevel];
  const fontRem = fontPreset.rem;
  const fontLabel = fontPreset.label;
  const canShrinkFont = fontLevel > 0;
  const canGrowFont = fontLevel < LORE_FONT_PRESETS.length - 1;

  return (
    <ScrAppWindow title="Game Lore" {...windowProps}>
      <div
        className="window-content-padded lore-app-root"
        style={{ fontSize: `${fontRem}rem` }}
      >
        <div className="lore-app-toolbar" role="group" aria-label="Text size">
          <span className="lore-app-toolbar-label">TEXT SIZE</span>
          <div className="lore-app-toolbar-controls">
            <button
              type="button"
              className="lore-app-font-btn"
              onClick={() => setFontLevel((n) => Math.max(0, n - 1))}
              disabled={!canShrinkFont}
              title="Smaller text"
              aria-label="Decrease text size"
            >
              −
            </button>
            <span className="lore-app-font-readout" aria-live="polite">
              {fontLabel}
            </span>
            <button
              type="button"
              className="lore-app-font-btn"
              onClick={() => setFontLevel((n) => Math.min(LORE_FONT_PRESETS.length - 1, n + 1))}
              disabled={!canGrowFont}
              title="Larger text"
              aria-label="Increase text size"
            >
              +
            </button>
          </div>
        </div>

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
          {entry.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default LoreAppWindow;
