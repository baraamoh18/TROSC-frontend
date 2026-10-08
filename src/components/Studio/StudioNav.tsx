import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type StudioGroup = "track" | "mine" | "platform";

export interface StudioNavSection {
  id: string;
  name: string;
  icon: LucideIcon;
  group: StudioGroup;
}

const GROUPS: StudioGroup[] = ["track", "mine", "platform"];
const GROUP_LABELS: Record<StudioGroup, string> = {
  track: "Track",
  mine: "Your own",
  platform: "Platform",
};

interface Props {
  sections: StudioNavSection[];
  activeId: string;
  /** Items needing attention per section id; shown as a red count. */
  counts: Partial<Record<string, number>>;
  onSelect: (id: string) => void;
}

const Count = ({ n }: { n: number }) => (
  <span className="ml-auto rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-white">
    {n}
    <span className="sr-only"> need attention</span>
  </span>
);

/**
 * Studio section switcher. Phones get one "Section" menu listing every
 * section (the old sideways-scrolling rows hid most of them); larger
 * screens keep the sidebar, where one highlight slides to the chosen
 * section (a CSS transition, so no animation library).
 */
const StudioNav = ({ sections, activeId, counts, onSelect }: Props) => {
  const groups = GROUPS.filter((g) => sections.some((s) => s.group === g));
  const active = sections.find((s) => s.id === activeId) ?? sections[0];
  const ActiveIcon = active.icon;
  // Work waiting in sections other than the open one, so it isn't missed
  const waitingElsewhere = sections.reduce((sum, s) => sum + (s.id === activeId ? 0 : counts[s.id] ?? 0), 0);

  // Sidebar highlight: measured from the selected button, then moved with CSS
  const sectionKey = sections.map((s) => s.id).join(",");
  const listRef = useRef<HTMLDivElement>(null);
  const [mark, setMark] = useState<{ top: number; height: number; animate: boolean } | null>(null);
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const place = () => {
      const btn = list.querySelector<HTMLElement>(`[data-section="${activeId}"]`);
      if (!btn) return;
      // Only slide once it has been placed; the first placement is instant
      const top = btn.offsetTop;
      const height = btn.offsetHeight;
      setMark((prev) =>
        prev && prev.top === top && prev.height === height ? prev : { top, height, animate: prev !== null },
      );
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(list);
    return () => ro.disconnect();
    // sectionKey, not sections: the parent passes a new array each render
  }, [activeId, sectionKey]);

  return (
    <>
      {/* Phones */}
      <div className="md:hidden">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className="group flex min-h-12 w-full items-center gap-3 rounded-lg border border-neutral-light-active bg-surface px-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <ActiveIcon size={18} className="shrink-0 text-brand" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-neutral-dark">Section</span>
              <span className="block truncate text-sm font-bold text-neutral-darker">{active.name}</span>
            </span>
            {waitingElsewhere > 0 && (
              <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-white">
                {waitingElsewhere}
                <span className="sr-only"> waiting in other sections</span>
              </span>
            )}
            <ChevronDown
              size={18}
              className="shrink-0 text-neutral-dark transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={6}
            className="w-(--radix-dropdown-menu-trigger-width) rounded-xl p-1.5 shadow-lg"
          >
            <DropdownMenuRadioGroup value={activeId} onValueChange={onSelect}>
              {groups.map((g, i) => (
                <div key={g}>
                  {i > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="px-2.5 pt-2 pb-1 text-xs font-bold tracking-wide text-neutral-dark uppercase">
                    {GROUP_LABELS[g]}
                  </DropdownMenuLabel>
                  {sections
                    .filter((s) => s.group === g)
                    .map(({ id, name, icon: Icon }) => (
                      <DropdownMenuRadioItem
                        key={id}
                        value={id}
                        className="min-h-11 cursor-pointer gap-2.5 rounded-lg font-semibold data-[state=checked]:text-brand-darker"
                      >
                        <Icon />
                        {name}
                        {(counts[id] ?? 0) > 0 && <Count n={counts[id]!} />}
                      </DropdownMenuRadioItem>
                    ))}
                </div>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tablets and up */}
      <div ref={listRef} className="relative hidden md:block">
        {mark && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 top-0 rounded-lg bg-surface shadow-sm ring-1 ring-gray-200 motion-reduce:transition-none ${
              mark.animate ? "transition-[translate,height] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]" : ""
            }`}
            style={{ translate: `0 ${mark.top}px`, height: mark.height }}
          />
        )}
        {groups.map((g) => (
          <div key={g} className="mb-5">
            <p className="mb-1 px-3 text-xs font-bold tracking-wide text-gray-600 uppercase">{GROUP_LABELS[g]}</p>
            <ul className="flex flex-col gap-1">
              {sections
                .filter((s) => s.group === g)
                .map(({ id, name, icon: Icon }) => {
                  const selected = id === activeId;
                  const count = counts[id] ?? 0;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        data-section={id}
                        aria-current={selected ? "page" : undefined}
                        onClick={() => onSelect(id)}
                        className={`relative flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                          selected ? "text-gray-900" : "text-gray-700 hover:bg-surface/60"
                        }`}
                      >
                        <Icon
                          size={17}
                          className={`transition-colors ${selected ? "text-brand" : "text-gray-500"}`}
                          aria-hidden="true"
                        />
                        {name}
                        {count > 0 && <Count n={count} />}
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
};

export default StudioNav;
