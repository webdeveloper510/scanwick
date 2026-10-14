import { useEffect, useId, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { BorrowersApi } from "./api";
import { BorrowerList } from "./BorrowerList";
import { parseSignalFilter, parseSortKey, selectBorrowers, signalFilterLabel, sortLabel } from "./query";
import type { SignalFilter, SortKey, ThemeName } from "./types";
import { useBorrowers } from "./useBorrowers";
import { useMediaQuery } from "./useMediaQuery";
import { useTheme } from "./useTheme";

type Props = {
  api: BorrowersApi;
};

export function BorrowersScreen({ api }: Props) {
  const { state, retry } = useBorrowers(api);
  const everReady = useRef(false);
  if (state.phase === "ready") everReady.current = true;
  const phone = useMediaQuery("(max-width: 767px)");
  const { theme, choose } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchSession = useRef(false);

  useEffect(() => {
    const onPop = () => {
      searchSession.current = false;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const query = searchParams.get("q") ?? "";
  const signal = parseSignalFilter(searchParams.get("signal"));
  const sort = parseSortKey(searchParams.get("sort"));
  const rows = state.phase === "ready" ? selectBorrowers(state.borrowers, query, signal, sort) : [];

  function updateSearch(value: string) {
    const replace = searchSession.current;
    searchSession.current = true;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set("q", value);
        else next.delete("q");
        return next;
      },
      { replace },
    );
  }

  function updateSignal(nextSignal: SignalFilter) {
    if (nextSignal === signal) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (nextSignal === "all") next.delete("signal");
      else next.set("signal", nextSignal);
      return next;
    });
  }

  function updateSort(nextSort: SortKey) {
    if (nextSort === sort) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (nextSort === "outstanding") next.delete("sort");
      else next.set("sort", nextSort);
      return next;
    });
  }

  function clearSearchAndFilter() {
    searchSession.current = false;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("q");
      next.delete("signal");
      return next;
    });
  }

  const showControls = everReady.current;
  const subtitle = subtitleFor({
    phase: state.phase,
    phone,
    query,
    signal,
    count: rows.length,
  });

  return (
    <div className="shell">
      <header className="header">
        <p className="brand">SCANWICK</p>
        <ThemeControl theme={theme} onChange={choose} />
      </header>
      <main aria-busy={state.phase === "loading"}>
        <h1>Monitored borrowers</h1>
        {subtitle ? (
          <p className="subtitle" aria-live="polite">
            {subtitle}
          </p>
        ) : null}
        {showControls ? (
          <div className="toolbar">
            <input
              className="search"
              type="search"
              placeholder="Search borrowers"
              aria-label="Search borrowers"
              value={query}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              onChange={(event) => updateSearch(event.target.value)}
              onBlur={() => {
                searchSession.current = false;
              }}
            />
            <div className="filters">
              <FilterControl signal={signal} onChange={updateSignal} />
              <SortControl sort={sort} onChange={updateSort} compact={phone} />
            </div>
          </div>
        ) : null}
        {state.phase === "loading" ? <LoadingPanel /> : null}
        {state.phase === "error" ? <ErrorPanel onRetry={retry} /> : null}
        {state.phase === "ready" && rows.length === 0 ? (
          <EmptyPanel query={query} onClear={clearSearchAndFilter} />
        ) : null}
        {state.phase === "ready" && rows.length > 0 ? (
          <BorrowerList borrowers={rows} sort={sort} onSort={updateSort} phone={phone} />
        ) : null}
      </main>
    </div>
  );
}

function subtitleFor(input: {
  phase: "loading" | "ready" | "error";
  phone: boolean;
  query: string;
  signal: SignalFilter;
  count: number;
}): string | null {
  if (input.phase === "loading") return "Loading…";
  if (input.phase === "error") return null;
  if (input.count === 0) {
    if (input.query) return `Search: "${input.query}"`;
    if (input.signal !== "all") return `Signal: ${signalFilterLabel(input.signal)}`;
    return null;
  }
  if (input.phone) return "Times in Lagos time (WAT)";
  const noun = input.count === 1 ? "borrower" : "borrowers";
  return `${input.count} ${noun} · amounts in naira · times in Lagos time (WAT)`;
}

function ThemeControl({ theme, onChange }: { theme: ThemeName; onChange: (theme: ThemeName) => void }) {
  return (
    <SelectField
      label="Theme"
      prefix="Theme:"
      prefixClass="theme-prefix"
      value={theme}
      options={[
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ]}
      onChange={onChange}
    />
  );
}

function FilterControl({ signal, onChange }: { signal: SignalFilter; onChange: (signal: SignalFilter) => void }) {
  return (
    <SelectField
      label="Filter by most serious signal"
      prefix="Signal:"
      value={signal}
      options={[
        { value: "all", label: "All" },
        { value: "urgent", label: "Urgent" },
        { value: "act", label: "Act" },
        { value: "watch", label: "Watch" },
        { value: "informational", label: "Informational" },
        { value: "none", label: "None" },
      ]}
      onChange={onChange}
    />
  );
}

function SortControl({
  sort,
  onChange,
  compact,
}: {
  sort: SortKey;
  onChange: (sort: SortKey) => void;
  compact: boolean;
}) {
  return (
    <SelectField
      label="Sort borrowers"
      prefix="Sort:"
      value={sort}
      options={[
        { value: "outstanding", label: sortLabel("outstanding"), buttonLabel: compact ? "Outstanding" : undefined },
        { value: "repayment", label: sortLabel("repayment"), buttonLabel: compact ? "Next repayment" : undefined },
        { value: "name", label: sortLabel("name"), buttonLabel: compact ? "Name" : undefined },
      ]}
      onChange={onChange}
    />
  );
}

function SelectField<T extends string>({
  label,
  prefix,
  prefixClass,
  value,
  options,
  onChange,
}: {
  label: string;
  prefix: string;
  prefixClass?: string;
  value: T;
  options: { value: T; label: string; buttonLabel?: string }[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const current = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function openAt(index: number) {
    setActiveIndex(Math.min(Math.max(index, 0), options.length - 1));
    setOpen(true);
  }

  function choose(next: T) {
    setOpen(false);
    buttonRef.current?.focus();
    if (next !== value) onChange(next);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = Math.max(0, options.findIndex((option) => option.value === value));
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openAt(currentIndex);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        openAt(currentIndex);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + options.length) % options.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(options[activeIndex].value);
    }
  }

  return (
    <div className="control select-control" ref={rootRef}>
      <span className={prefixClass} aria-hidden="true">
        {prefix}
      </span>
      <button
        ref={buttonRef}
        type="button"
        className="select-button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
        onClick={() => (open ? setOpen(false) : openAt(options.findIndex((option) => option.value === value)))}
        onKeyDown={onKeyDown}
      >
        {current.buttonLabel ?? current.label}
      </button>
      {open ? (
        <ul id={listId} className="select-menu" role="listbox" aria-label={label}>
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option.value === value}
              className={index === activeIndex ? "is-active" : undefined}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option.value)}
            >
              <span>{option.label}</span>
              {option.value === value ? <span className="select-check" aria-hidden="true" /> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="surface skeleton-card">
      <div className="skeleton" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function EmptyPanel({ query, onClear }: { query: string; onClear: () => void }) {
  const detail = query
    ? `Nothing matches "${query}" with the signal filter you chose.`
    : "Nothing matches the signal filter you chose.";
  return (
    <div className="surface panel" role="status">
      <h2>No borrowers match</h2>
      <p>{detail}</p>
      <button type="button" className="button" onClick={onClear}>
        Clear search and filter
      </button>
    </div>
  );
}

function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="surface panel" role="alert">
      <h2>We could not load your borrowers</h2>
      <p>Nothing below is current. Check your connection and try again.</p>
      <button type="button" className="button" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
