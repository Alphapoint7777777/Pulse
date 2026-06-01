import { useState, useEffect } from "react";

const DEFAULTS = {
  accentColor: "blue",
  theme: "dark",
  units: "kg",
  density: "comfortable",
  showMotivationalQuotes: true,
};

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem("fittrack_settings");
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    localStorage.setItem("fittrack_settings", JSON.stringify(settings));
    applyTheme(settings);
  }, [settings]);

  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  return { settings, update };
}

const ACCENT_COLORS = {
  blue:   { primary: "210 100% 55%", ring: "210 100% 55%" },
  purple: { primary: "270 80% 60%",  ring: "270 80% 60%"  },
  orange: { primary: "30 95% 55%",   ring: "30 95% 55%"   },
  green:  { primary: "150 80% 45%",  ring: "150 80% 45%"  },
  red:    { primary: "350 80% 55%",  ring: "350 80% 55%"  },
  cyan:   { primary: "190 90% 50%",  ring: "190 90% 50%"  },
};

const THEMES = {
  dark:    { bg: "220 20% 4%",  card: "220 18% 8%",  secondary: "220 15% 14%", border: "220 15% 15%" },
  darker:  { bg: "0 0% 2%",    card: "0 0% 6%",     secondary: "0 0% 10%",    border: "0 0% 12%"   },
  navy:    { bg: "230 30% 6%",  card: "230 25% 10%", secondary: "230 20% 15%", border: "230 20% 18%" },
};

function applyTheme({ accentColor, theme }) {
  const root = document.documentElement;
  const a = ACCENT_COLORS[accentColor] || ACCENT_COLORS.blue;
  const t = THEMES[theme] || THEMES.dark;
  root.style.setProperty("--primary", a.primary);
  root.style.setProperty("--ring", a.ring);
  root.style.setProperty("--background", t.bg);
  root.style.setProperty("--card", t.card);
  root.style.setProperty("--secondary", t.secondary);
  root.style.setProperty("--border", t.border);
  root.style.setProperty("--muted", t.secondary);
  root.style.setProperty("--popover", t.card);
  root.style.setProperty("--sidebar-background", t.bg);
}

// Apply on load
try {
  const stored = localStorage.getItem("fittrack_settings");
  if (stored) applyTheme({ ...DEFAULTS, ...JSON.parse(stored) });
} catch {}