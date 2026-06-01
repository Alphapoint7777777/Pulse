import { Flame } from "lucide-react";

export default function StreakCard({ sessions }) {
  // Calculate streak from sessions
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const sessionDays = new Set(
    sessions.filter(s => s.completed).map(s => {
      const d = new Date(s.completed_at || s.created_date);
      d.setHours(0,0,0,0);
      return d.getTime();
    })
  );

  let streak = 0;
  let check = new Date(today);
  // Allow today or yesterday as start
  if (!sessionDays.has(check.getTime())) {
    check.setDate(check.getDate() - 1);
  }
  while (sessionDays.has(check.getTime())) {
    streak++;
    check.setDate(check.getDate() - 1);
  }

  const thisWeekCount = sessions.filter(s => {
    const d = new Date(s.created_date);
    const diff = (today - d) / (1000 * 60 * 60 * 24);
    return diff <= 7 && s.completed;
  }).length;

  return (
    <div className="flex gap-3">
      <div className="flex-1 bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-1">
          <Flame className={`w-5 h-5 ${streak > 0 ? "text-orange-400" : "text-muted-foreground"}`} />
          <span className="text-xs text-muted-foreground font-medium">Streak</span>
        </div>
        <p className="text-3xl font-heading font-bold">{streak}</p>
        <p className="text-xs text-muted-foreground">{streak === 1 ? "day" : "days"}</p>
      </div>
      <div className="flex-1 bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground font-medium">This Week</span>
        </div>
        <p className="text-3xl font-heading font-bold">{thisWeekCount}</p>
        <p className="text-xs text-muted-foreground">workouts</p>
      </div>
      <div className="flex-1 bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground font-medium">Total</span>
        </div>
        <p className="text-3xl font-heading font-bold">{sessions.filter(s => s.completed).length}</p>
        <p className="text-xs text-muted-foreground">sessions</p>
      </div>
    </div>
  );
}