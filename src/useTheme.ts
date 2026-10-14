import { useEffect, useState } from "react";
import type { ThemeName } from "./types";
import { useMediaQuery } from "./useMediaQuery";

const STORAGE_KEY = "scanwick-theme";

function readOverride(): ThemeName | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    return null;
  }
  return null;
}

export function applyStoredTheme() {
  const saved = readOverride();
  if (saved) document.documentElement.dataset.theme = saved;
}

/** The theme follows the device until the user picks Light or Dark. */
export function useTheme() {
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)");
  const [override, setOverride] = useState<ThemeName | null>(readOverride);
  const theme: ThemeName = override ?? (systemDark ? "dark" : "light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function choose(next: ThemeName) {
    setOverride(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* The choice still applies for this visit. */
    }
  }

  return { theme, choose };
}
