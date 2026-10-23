import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";

interface Option {
  value: string;
  label: string;
  group?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  /** Classe appliquée au trigger */
  triggerClassName?: string;
  /** Mode dark (fond semi-transparent blanc sur fond sombre) */
  dark?: boolean;
}

const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder = "Sélectionner…",
  searchPlaceholder = "Rechercher…",
  emptyLabel = "Aucun résultat",
  triggerClassName = "",
  dark = false,
}: SearchableSelectProps) => {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState("");
  const containerRef          = useRef<HTMLDivElement>(null);
  const searchRef             = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = search.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.trim().toLowerCase())
      )
    : options;

  // Grouper les options
  const grouped: { group: string | undefined; items: Option[] }[] = [];
  filtered.forEach((opt) => {
    const last = grouped[grouped.length - 1];
    if (last && last.group === opt.group) {
      last.items.push(opt);
    } else {
      grouped.push({ group: opt.group, items: [opt] });
    }
  });

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
    else setSearch("");
  }, [open]);

  // Fermer si clic à l'extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setOpen(false);
  };

  // Styles selon mode
  const triggerBase = dark
    ? "bg-white/10 border-white/20 text-white hover:bg-white/15"
    : "bg-white border-input text-encre hover:bg-surface";

  const placeholderColor = dark ? "text-white/35" : "text-texte2";

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={[
          "flex h-12 w-full items-center justify-between rounded-control border px-4 text-body-l transition-colors duration-hover focus-visible:border-2 focus-visible:border-baobab focus-visible:outline-none",
          triggerBase,
          triggerClassName,
        ].join(" ")}
      >
        <span className={selected ? "" : placeholderColor}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="flex items-center gap-0.5 ml-2 flex-shrink-0">
          {value && (
            <span
              role="button"
              onClick={handleClear}
              className={`p-0.5 rounded hover:bg-surface ${dark ? "text-white/50 hover:text-white" : "text-texte2 hover:text-texte2"}`}
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-150 ${open ? "rotate-180" : ""} ${dark ? "text-white/40" : "text-texte2"}`}
          />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-control border border-filet shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-filet">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-texte2 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 text-body-m text-encre placeholder:text-texte2 bg-surface rounded-control border border-filet focus:outline-none focus:border-baobab"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto py-1">
            {grouped.length === 0 ? (
              <div className="px-3 py-2 text-body-m text-texte2 text-center">{emptyLabel}</div>
            ) : (
              grouped.map(({ group, items }) => (
                <div key={group ?? "_"}>
                  {group && (
                    <div className="px-3 py-1 text-caption font-semibold text-texte2 uppercase tracking-wider bg-surface">
                      {group}
                    </div>
                  )}
                  {items.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={[
                        "min-h-11 w-full px-4 py-2 text-left text-body-m transition-colors",
                        opt.value === value
                          ? "bg-baobab-100 font-semibold text-baobab"
                          : "text-encre hover:bg-surface",
                      ].join(" ")}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
