const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useSettings } from "@/hooks/useSettings";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Palette, Monitor, Ruler, Zap, Bell, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";

const ACCENT_OPTIONS = [
  { value: "blue",   label: "Electric Blue", hex: "#1a90ff" },
  { value: "purple", label: "Neon Purple",   hex: "#9966ff" },
  { value: "orange", label: "Fiery Orange",  hex: "#f56a14" },
  { value: "green",  label: "Lime Green",    hex: "#22c97a" },
  { value: "red",    label: "Crimson Red",   hex: "#e83e55" },
  { value: "cyan",   label: "Cyan Frost",    hex: "#0fc8e8" },
];

const THEME_OPTIONS = [
  { value: "dark",   label: "Dark",        desc: "Classic dark mode",    preview: ["#0a0d14", "#111820"] },
  { value: "darker", label: "Pitch Black", desc: "OLED-optimized black", preview: ["#050505", "#0f0f0f"] },
  { value: "navy",   label: "Deep Navy",   desc: "Rich navy tones",      preview: ["#080d1a", "#101828"] },
];

const UNIT_OPTIONS = [
  { value: "kg",  label: "Kilograms (kg)" },
  { value: "lbs", label: "Pounds (lbs)"   },
];

const DENSITY_OPTIONS = [
  { value: "comfortable", label: "Comfortable", desc: "More spacing and padding" },
  { value: "compact",     label: "Compact",     desc: "Tighter, info-dense view" },
];

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold font-heading">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { settings, update } = useSettings();
  const [user, setUser] = useState(null);
  useEffect(() => { db.auth.me().then(setUser); }, []);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4 space-y-5">
      <div className="mb-2">
        <h1 className="text-2xl font-heading font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Personalise your experience</p>
      </div>

      {/* Account */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <User className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold font-heading">Account</span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{user?.full_name || "—"}</p>
            <p className="text-xs text-muted-foreground">{user?.email || "—"}</p>
          </div>
          <Button variant="destructive" size="sm" className="gap-2" onClick={() => db.auth.logout()}>
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Accent Color */}
      <Section icon={Palette} title="Accent Color">
        <div className="grid grid-cols-3 gap-2">
          {ACCENT_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => update("accentColor", opt.value)}
              className={cn(
                "relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                settings.accentColor === opt.value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary hover:border-primary/30"
              )}>
              <div className="w-8 h-8 rounded-full shadow-lg" style={{
                background: opt.hex,
                boxShadow: settings.accentColor === opt.value ? `0 0 16px ${opt.hex}60` : "none"
              }} />
              <span className="text-xs font-medium text-center leading-tight">{opt.label}</span>
              {settings.accentColor === opt.value && (
                <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </Section>

      {/* Theme */}
      <Section icon={Monitor} title="Interface Theme">
        <div className="space-y-2">
          {THEME_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => update("theme", opt.value)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border transition-all",
                settings.theme === opt.value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary hover:border-primary/30"
              )}>
              <div className="flex gap-1">
                {opt.preview.map((c, i) => (
                  <div key={i} className="w-6 h-6 rounded-lg border border-white/10" style={{ background: c }} />
                ))}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
              {settings.theme === opt.value && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
        </div>
      </Section>

      {/* Units */}
      <Section icon={Ruler} title="Measurement Units">
        <div className="flex gap-2">
          {UNIT_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => update("units", opt.value)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                settings.units === opt.value
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "bg-secondary border-border text-secondary-foreground hover:border-primary/40"
              )}>
              {opt.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Density */}
      <Section icon={Zap} title="Display Density">
        <div className="space-y-2">
          {DENSITY_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => update("density", opt.value)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-xl border transition-all",
                settings.density === opt.value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary hover:border-primary/30"
              )}>
              <div className="text-left">
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
              {settings.density === opt.value && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
        </div>
      </Section>

      {/* Preferences */}
      <Section icon={Bell} title="Preferences">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Motivational Quotes</Label>
            <p className="text-xs text-muted-foreground">Show daily quotes on dashboard</p>
          </div>
          <Switch
            checked={settings.showMotivationalQuotes}
            onCheckedChange={v => update("showMotivationalQuotes", v)}
          />
        </div>
      </Section>

      <p className="text-xs text-muted-foreground text-center pb-2">
        Changes apply instantly and are saved automatically
      </p>
    </div>
  );
}