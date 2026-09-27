import React, { useRef } from "react";
import { panelId, tabId } from "./tabIds";

export interface TrackTab {
  id: string;
  name: string;
  count?: number;
}

interface TrackTabsProps {
  tabs: TrackTab[];
  active: string;
  onChange: (id: string) => void;
}

/** WAI-ARIA tabs: one panel visible at a time, arrow keys move between tabs. */
const TrackTabs: React.FC<TrackTabsProps> = ({ tabs, active, onChange }) => {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const id = tabs[next].id;
    onChange(id);
    refs.current[id]?.focus();
  };

  return (
    <div className="sticky top-16 z-30 border-b border-gray-200 bg-gray-50">
      {/* Scrolls horizontally on phones instead of overflowing the page. */}
      <div
        role="tablist"
        aria-label="Track sections"
        className="-mb-px flex gap-6 overflow-x-auto [scrollbar-width:none] sm:gap-8"
      >
        {tabs.map((tab, index) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                refs.current[tab.id] = el;
              }}
              type="button"
              role="tab"
              id={tabId(tab.id)}
              aria-selected={selected}
              aria-controls={panelId(tab.id)}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`flex min-h-11 items-center gap-1.5 whitespace-nowrap border-b-2 px-1 text-sm font-semibold transition-colors ${
                selected
                  ? "border-primary text-gray-900"
                  : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"
              }`}
            >
              {tab.name}
              {typeof tab.count === "number" && tab.count > 0 && (
                <span className="rounded-full bg-gray-200 px-1.5 text-xs font-bold text-gray-700">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TrackTabs;
