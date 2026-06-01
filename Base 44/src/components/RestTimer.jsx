import { useState, useEffect, useRef } from "react";
import { Timer, X, Play, Pause, RotateCcw, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

const circumference = 2 * Math.PI * 40;

export default function RestTimer({ open, onClose, initialSeconds = 90, exerciseName }) {
  const [duration, setDuration] = useState(initialSeconds);
  const [remaining, setRemaining] = useState(initialSeconds);
  const [running, setRunning] = useState(true);
  const [editingSeconds, setEditingSeconds] = useState(false);
  const intervalRef = useRef(null);

  // Reset when opened with new duration
  useEffect(() => {
    if (open) {
      setDuration(initialSeconds);
      setRemaining(initialSeconds);
      setRunning(true);
    }
  }, [open, initialSeconds]);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (running && open) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, open]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const progress = duration > 0 ? (remaining / duration) * 100 : 0;
  const isDone = remaining === 0 && !running;

  const adjustDuration = (delta) => {
    const newDur = Math.max(5, duration + delta);
    setDuration(newDur);
    setRemaining(prev => Math.max(0, prev + delta));
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setRemaining(duration);
    setRunning(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border-t border-x border-border rounded-t-3xl p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold flex items-center gap-2">
              <Timer className="w-4 h-4 text-primary" /> Rest Timer
            </h3>
            {exerciseName && <p className="text-xs text-muted-foreground mt-0.5">{exerciseName}</p>}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Circular countdown */}
        <div className="flex justify-center">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="absolute -rotate-90" width="144" height="144">
              <circle cx="72" cy="72" r="40" fill="none" stroke="hsl(220,15%,15%)" strokeWidth="7" />
              <circle cx="72" cy="72" r="40" fill="none"
                stroke={isDone ? "hsl(150,80%,50%)" : "hsl(210,100%,55%)"}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress / 100)}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.9s ease, stroke 0.3s" }}
              />
            </svg>
            <div className="text-center z-10">
              <p className={`text-3xl font-bold font-mono ${isDone ? "text-accent" : ""}`}>{fmt(remaining)}</p>
              {isDone
                ? <p className="text-xs text-accent font-semibold mt-0.5">Done! 💪</p>
                : <p className="text-xs text-muted-foreground mt-0.5">of {fmt(duration)}</p>
              }
            </div>
          </div>
        </div>

        {/* Duration adjustment */}
        <div className="bg-secondary rounded-2xl p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Rest Duration</span>
          <div className="flex items-center gap-2">
            <button onClick={() => adjustDuration(-15)} className="h-8 w-8 rounded-xl bg-card border border-border flex items-center justify-center hover:border-primary/40 transition-colors">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-bold font-mono w-12 text-center">{fmt(duration)}</span>
            <button onClick={() => adjustDuration(15)} className="h-8 w-8 rounded-xl bg-card border border-border flex items-center justify-center hover:border-primary/40 transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick presets */}
        <div className="flex gap-2">
          {[30, 60, 90, 120, 180].map(p => (
            <button key={p} onClick={() => { setDuration(p); setRemaining(p); setRunning(true); }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all
                ${duration === p ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border hover:border-primary/40"}`}>
              {p < 60 ? `${p}s` : `${p / 60}m`}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 flex-1" onClick={reset}>
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
          <Button className="gap-2 flex-1" onClick={() => setRunning(r => !r)} disabled={isDone}>
            {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {running ? "Pause" : "Resume"}
          </Button>
        </div>
      </div>
    </div>
  );
}