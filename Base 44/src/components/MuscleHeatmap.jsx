import { useMemo } from "react";

// Volume thresholds → opacity levels
function getOpacity(volume, maxVolume) {
  if (!volume || maxVolume === 0) return 0;
  const ratio = volume / maxVolume;
  if (ratio > 0.75) return 0.95;
  if (ratio > 0.5)  return 0.7;
  if (ratio > 0.25) return 0.45;
  return 0.2;
}

// Color per muscle group
const MUSCLE_COLOR = {
  chest:      "#3b82f6",
  back:       "#8b5cf6",
  shoulders:  "#f59e0b",
  biceps:     "#06b6d4",
  triceps:    "#10b981",
  quads:      "#ec4899",
  hamstrings: "#f97316",
  glutes:     "#e11d48",
  calves:     "#14b8a6",
  abs:        "#6366f1",
  forearms:   "#84cc16",
};

export default function MuscleHeatmap({ sets }) {
  const volumeByGroup = useMemo(() => {
    const map = {};
    (sets || []).forEach(s => {
      const g = s.muscle_group;
      if (g) map[g] = (map[g] || 0) + (s.weight * s.reps);
    });
    return map;
  }, [sets]);

  const maxVolume = Math.max(...Object.values(volumeByGroup), 1);

  const m = (group) => ({
    fill: MUSCLE_COLOR[group] || "#94a3b8",
    fillOpacity: getOpacity(volumeByGroup[group], maxVolume),
    stroke: MUSCLE_COLOR[group] || "#94a3b8",
    strokeOpacity: Math.max(getOpacity(volumeByGroup[group], maxVolume), 0.15),
    strokeWidth: 1,
  });

  const sortedGroups = Object.entries(volumeByGroup).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 justify-center">
        {/* FRONT */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-muted-foreground font-medium">Front</span>
          <svg width="110" height="240" viewBox="0 0 110 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Head */}
            <ellipse cx="55" cy="18" rx="14" ry="16" fill="hsl(220,15%,20%)" stroke="hsl(220,15%,30%)" strokeWidth="1"/>
            {/* Neck */}
            <rect x="49" y="31" width="12" height="10" rx="3" fill="hsl(220,15%,20%)" stroke="hsl(220,15%,30%)" strokeWidth="1"/>
            {/* Torso */}
            <rect x="32" y="41" width="46" height="60" rx="8" fill="hsl(220,15%,14%)" stroke="hsl(220,15%,25%)" strokeWidth="1"/>
            {/* Chest left */}
            <ellipse cx="46" cy="58" rx="10" ry="10" {...m("chest")} />
            {/* Chest right */}
            <ellipse cx="64" cy="58" rx="10" ry="10" {...m("chest")} />
            {/* Abs */}
            <rect x="44" y="70" width="8" height="7" rx="2" {...m("abs")} />
            <rect x="57" y="70" width="8" height="7" rx="2" {...m("abs")} />
            <rect x="44" y="80" width="8" height="7" rx="2" {...m("abs")} />
            <rect x="57" y="80" width="8" height="7" rx="2" {...m("abs")} />
            <rect x="44" y="90" width="8" height="7" rx="2" {...m("abs")} />
            <rect x="57" y="90" width="8" height="7" rx="2" {...m("abs")} />
            {/* Shoulders */}
            <ellipse cx="26" cy="52" rx="9" ry="8" {...m("shoulders")} />
            <ellipse cx="84" cy="52" rx="9" ry="8" {...m("shoulders")} />
            {/* Upper arms (biceps) */}
            <rect x="16" y="58" width="12" height="28" rx="6" {...m("biceps")} />
            <rect x="82" y="58" width="12" height="28" rx="6" {...m("biceps")} />
            {/* Forearms */}
            <rect x="16" y="89" width="11" height="24" rx="5" {...m("forearms")} />
            <rect x="83" y="89" width="11" height="24" rx="5" {...m("forearms")} />
            {/* Hips */}
            <rect x="30" y="100" width="50" height="16" rx="6" fill="hsl(220,15%,14%)" stroke="hsl(220,15%,25%)" strokeWidth="1"/>
            {/* Quads left */}
            <rect x="31" y="116" width="20" height="52" rx="8" {...m("quads")} />
            {/* Quads right */}
            <rect x="59" y="116" width="20" height="52" rx="8" {...m("quads")} />
            {/* Knees */}
            <ellipse cx="41" cy="171" rx="10" ry="7" fill="hsl(220,15%,18%)" stroke="hsl(220,15%,28%)" strokeWidth="1"/>
            <ellipse cx="69" cy="171" rx="10" ry="7" fill="hsl(220,15%,18%)" stroke="hsl(220,15%,28%)" strokeWidth="1"/>
            {/* Calves front */}
            <rect x="33" y="177" width="17" height="40" rx="7" {...m("calves")} />
            <rect x="60" y="177" width="17" height="40" rx="7" {...m("calves")} />
          </svg>
        </div>

        {/* BACK */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-muted-foreground font-medium">Back</span>
          <svg width="110" height="240" viewBox="0 0 110 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Head */}
            <ellipse cx="55" cy="18" rx="14" ry="16" fill="hsl(220,15%,20%)" stroke="hsl(220,15%,30%)" strokeWidth="1"/>
            {/* Neck */}
            <rect x="49" y="31" width="12" height="10" rx="3" fill="hsl(220,15%,20%)" stroke="hsl(220,15%,30%)" strokeWidth="1"/>
            {/* Torso */}
            <rect x="32" y="41" width="46" height="60" rx="8" fill="hsl(220,15%,14%)" stroke="hsl(220,15%,25%)" strokeWidth="1"/>
            {/* Upper back / traps */}
            <ellipse cx="55" cy="52" rx="18" ry="9" {...m("back")} />
            {/* Lats */}
            <path d="M34 55 Q30 75 36 100 L50 100 L50 55 Z" {...m("back")} />
            <path d="M76 55 Q80 75 74 100 L60 100 L60 55 Z" {...m("back")} />
            {/* Shoulders */}
            <ellipse cx="26" cy="52" rx="9" ry="8" {...m("shoulders")} />
            <ellipse cx="84" cy="52" rx="9" ry="8" {...m("shoulders")} />
            {/* Triceps */}
            <rect x="16" y="58" width="12" height="28" rx="6" {...m("triceps")} />
            <rect x="82" y="58" width="12" height="28" rx="6" {...m("triceps")} />
            {/* Forearms */}
            <rect x="16" y="89" width="11" height="24" rx="5" {...m("forearms")} />
            <rect x="83" y="89" width="11" height="24" rx="5" {...m("forearms")} />
            {/* Glutes */}
            <ellipse cx="43" cy="108" rx="13" ry="12" {...m("glutes")} />
            <ellipse cx="67" cy="108" rx="13" ry="12" {...m("glutes")} />
            {/* Hamstrings */}
            <rect x="31" y="116" width="20" height="50" rx="8" {...m("hamstrings")} />
            <rect x="59" y="116" width="20" height="50" rx="8" {...m("hamstrings")} />
            {/* Calves back */}
            <rect x="33" y="177" width="17" height="40" rx="7" {...m("calves")} />
            <rect x="60" y="177" width="17" height="40" rx="7" {...m("calves")} />
          </svg>
        </div>
      </div>

      {/* Legend */}
      {sortedGroups.length > 0 ? (
        <div className="grid grid-cols-2 gap-1.5">
          {sortedGroups.map(([group, vol]) => (
            <div key={group} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-secondary">
              <div className="w-3 h-3 rounded-full shrink-0"
                style={{ background: MUSCLE_COLOR[group] || "#94a3b8", opacity: getOpacity(vol, maxVolume) + 0.3 }} />
              <span className="text-xs capitalize flex-1">{group.replace("_", " ")}</span>
              <span className="text-xs text-muted-foreground font-mono">{Math.round(vol / 1000)}k</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">Complete workouts to see muscle activation</p>
      )}
    </div>
  );
}