import React, { useMemo, useState, useCallback } from 'react';
import ScrAppWindow, { BaseWindowProps } from '../../scrAppWindow/ScrAppWindow';
import { ALL_LORE } from '../../../../gameLore/allLore';
import { filterLoreEntries, groupLoreByCategory } from '../../../../gameLore/loreSearch';
import type { LoreEntry } from '../../../../gameLore/loreTypes';
import './LoreAppWindow.css';

/** Root rem for lore list + search; stepper shows 1–3. */
const LORE_TEXT_SIZE_REMS = [0.8125, 0.9375, 1.0625] as const;
const LORE_TEXT_SIZE_DEFAULT_INDEX = 1;

interface LoreAppWindowProps extends BaseWindowProps {}

const LoreAppWindow: React.FC<LoreAppWindowProps> = ({ ...windowProps }) => {
  const [query, setQuery] = useState('');
  const [textSizeIndex, setTextSizeIndex] = useState(LORE_TEXT_SIZE_DEFAULT_INDEX);
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

  const textSizeRem = LORE_TEXT_SIZE_REMS[textSizeIndex];
  const textSizeDisplay = textSizeIndex + 1;

  const decreaseTextSize = useCallback(() => {
    setTextSizeIndex((i) => (i <= 0 ? LORE_TEXT_SIZE_REMS.length - 1 : i - 1));
  }, []);

  const increaseTextSize = useCallback(() => {
    setTextSizeIndex((i) => (i >= LORE_TEXT_SIZE_REMS.length - 1 ? 0 : i + 1));
  }, []);

  return (
    <ScrAppWindow title="Game Lore" {...windowProps}>
      <div className="window-content-padded lore-app-shell">
        <section className="lore-app-text-size" aria-label="Text size">
          <h2 className="lore-app-text-size-heading">Text Size</h2>
          <div className="lore-app-text-size-stepper">
            <button
              type="button"
              className="lore-app-text-size-arrow"
              onClick={decreaseTextSize}
              aria-label="Smaller text"
            >
              ◀
            </button>
            <div
              className="lore-app-text-size-readout"
              aria-live="polite"
              aria-atomic="true"
            >
              {textSizeDisplay}
            </div>
            <button
              type="button"
              className="lore-app-text-size-arrow"
              onClick={increaseTextSize}
              aria-label="Larger text"
            >
              ▶
            </button>
          </div>
        </section>

        <div
          className="lore-app-root"
          style={{ fontSize: `${textSizeRem}rem` }}
        >
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
  const label = expanded ? `Collapse: ${entry.title}` : `Expand: ${entry.title}`;

  return (
    <div className="lore-app-entry">
      <button
        type="button"
        className="lore-app-entry-row"
        title={entry.title}
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={label}
      >
        <span className="lore-app-entry-title">{entry.title}</span>
        <span className="lore-app-expand-chevron" aria-hidden>
          {expanded ? '\u25BC' : '\u25B6'}
        </span>
      </button>
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
