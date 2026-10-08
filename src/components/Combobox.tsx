import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Shown muted after the label, and searchable (e.g. a role). */
  hint?: string;
}

interface Props {
  /** Id of the trigger button, for the field's <label htmlFor>. */
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Include "" here for a "none" / default choice. */
  options: ComboboxOption[];
  searchPlaceholder: string;
  emptyText?: string;
  /** The form's own input classes, so the field matches its neighbours. */
  triggerClassName: string;
}

/**
 * A select you can type into: the list filters as you type, and arrow
 * keys plus Enter pick an item. For lists that grow (people, tracks,
 * courses); short fixed lists stay plain <select>s.
 */
const Combobox = ({ id, value, onChange, options, searchPlaceholder, emptyText = "No matches.", triggerClassName }: Props) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        role="combobox"
        aria-expanded={open}
        className={cn(triggerClassName, "flex items-center justify-between gap-2 text-left")}
      >
        <span className="truncate">
          {selected?.label ?? "Choose…"}
          {selected?.hint && <span className="text-neutral-dark"> · {selected.hint}</span>}
        </span>
        <ChevronsUpDown size={16} className="shrink-0 text-neutral-dark" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-60 rounded-xl border-border p-0 shadow-lg">
        <Command className="bg-transparent">
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-64">
            <CommandEmpty className="py-5 text-center text-sm text-neutral-dark">{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value || "__none"}
                  // cmdk filters on this text; keep it unique per option
                  value={`${o.label} ${o.hint ?? ""} ${o.value}`}
                  onSelect={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className="min-h-10 cursor-pointer gap-2 rounded-lg px-2.5"
                >
                  <Check
                    size={16}
                    className={cn("shrink-0 text-brand", o.value === value ? "opacity-100" : "opacity-0")}
                    aria-hidden="true"
                  />
                  <span className="truncate">
                    {o.label}
                    {o.hint && <span className="text-neutral-dark"> · {o.hint}</span>}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default Combobox;
