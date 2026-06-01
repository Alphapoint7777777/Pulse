const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";

import { ChevronLeft, ChevronRight, X, Dumbbell, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import moment from "moment";

const TYPE_COLORS = {
  push:      { bg: "bg-blue-500",   light: "bg-blue-500/20 text-blue-400",   dot: "#3b82f6" },
  pull:      { bg: "bg-purple-500", light: "bg-purple-500/20 text-purple-400", dot: "#a855f7" },
  legs:      { bg: "bg-green-500",  light: "bg-green-500/20 text-green-400",  dot: "#22c55e" },
  upper:     { bg: "bg-orange-500", light: "bg-orange-500/20 text-orange-400", dot: "#f97316" },
  lower:     { bg: "bg-cyan-500",   light: "bg-cyan-500/20 text-cyan-400",   dot: "#06b6d4" },
  full_body: { bg: "bg-pink-500",   light: "bg-pink-500/20 text-pink-400",   dot: "#ec4899" },
  custom:    { bg: "bg-slate-500",  light: "bg-slate-500/20 text-slate-400", dot: "#94a3b8" },
};

export default function CalendarPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [selectedDay, setSelectedDay] = useState(null);
  const [sessionSets, setSessionSets] = useState({});

  useEffect(() => {
    const load = async () => {
      const user = await db.auth.me();
      const sess = await db.entities.WorkoutSession.filter({ created_by: user.email, completed: true }, "-created_date", 200);
      setSessions(sess);
      setLoading(false);
    };
    load();
  }, []);

  const loadSetsForSession = async (sessionId) => {
    if (sessionSets[sessionId]) return;
    const sets = await db.entities.WorkoutSet.filter({ session_id: sessionId });
    setSessionSets(prev => ({ ...prev, [sessionId]: sets }));
  };

  const handleDayClick = (daySessions) => {
    if (daySessions.length === 0) return;
    setSelectedDay(daySessions);
    daySessions.forEach(s => loadSetsForSession(s.id));
  };

  // Build calendar grid
  const startOfMonth = currentMonth.clone().startOf("month");
  const endOfMonth = currentMonth.clone().endOf("month");
  const startDay = startOfMonth.clone().startOf("week");
  const endDay = endOfMonth.clone().endOf("week");

  const days = [];
  let day = startDay.clone();
  while (day.isSameOrBefore(endDay, "day")) {
    days.push(day.clone());
    day.add(1, "day");
  }

  // Map sessions by date string
  const sessionsByDate = {};
  sessions.forEach(s => {
    const dateStr = moment(s.completed_at || s.created_date).format("YYYY-MM-DD");
    if (!sessionsByDate[dateStr]) sessionsByDate[dateStr] = [];
    sessionsByDate[dateStr].push(s);
  });

  const today = moment().format("YYYY-MM-DD");

  // Monthly stats
  const monthSessions = sessions.filter(s => {
    const d = moment(s.completed_at || s.created_date);
    return d.isSame(currentMonth, "month");
  });
  const monthVolume = monthSessions.reduce((a, s) => a + (s.total_volume || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-heading font-bold">Calendar</h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => m.clone().subtract(1, "month"))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold w-32 text-center">{currentMonth.format("MMMM YYYY")}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => m.clone().add(1, "month"))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Monthly stats */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-2xl font-heading font-bold text-primary">{monthSessions.length}</p>
          <p className="text-xs text-muted-foreground">workouts</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-2xl font-heading font-bold">{monthVolume >= 1000 ? `${(monthVolume/1000).toFixed(1)}t` : `${Math.round(monthVolume)}kg`}</p>
          <p className="text-xs text-muted-foreground">volume</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-2xl font-heading font-bold">{monthSessions.reduce((a, s) => a + (s.duration_minutes || 0), 0)}m</p>
          <p className="text-xs text-muted-foreground">total time</p>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(d => {
          const dateStr = d.format("YYYY-MM-DD");
          const daySessions = sessionsByDate[dateStr] || [];
          const isToday = dateStr === today;
          const isCurrentMonth = d.isSame(currentMonth, "month");
          const hasWorkout = daySessions.length > 0;
          const isFuture = d.isAfter(moment(), "day");

          return (
            <button key={dateStr} onClick={() => handleDayClick(daySessions)}
              disabled={!hasWorkout}
              className={`
                relative aspect-square flex flex-col items-center justify-start pt-1.5 rounded-xl transition-all
                ${isToday ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}
                ${hasWorkout ? "cursor-pointer hover:bg-card" : "cursor-default"}
                ${isCurrentMonth ? "" : "opacity-30"}
                ${isFuture && !isToday ? "opacity-20" : ""}
              `}>
              <span className={`text-xs font-medium ${isToday ? "text-primary font-bold" : isCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}>
                {d.format("D")}
              </span>
              {hasWorkout && (
                <div className="flex flex-wrap gap-0.5 justify-center mt-1 px-0.5">
                  {daySessions.slice(0, 3).map((s, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: TYPE_COLORS[s.workout_type]?.dot || "#94a3b8" }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 bg-card rounded-2xl border border-border p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Workout Types</p>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(TYPE_COLORS).slice(0, 6).map(([type, colors]) => (
            <div key={type} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${colors.light} border border-current/10`}>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: colors.dot }} />
              <span className="text-xs font-medium capitalize">{type.replace("_", " ")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day Detail Drawer */}
      {selectedDay && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center" onClick={() => setSelectedDay(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-card rounded-t-3xl border-t border-x border-border p-5 pb-24 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-lg">
                {moment(selectedDay[0].completed_at || selectedDay[0].created_date).format("dddd, MMM D")}
              </h2>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDay(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {selectedDay.map(s => (
              <div key={s.id} className="space-y-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold ${TYPE_COLORS[s.workout_type]?.light || TYPE_COLORS.custom.light}`}>
                  <Dumbbell className="w-3.5 h-3.5" />
                  {s.name}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-secondary rounded-xl p-3 text-center">
                    <p className="text-lg font-bold font-heading">{s.total_sets || 0}</p>
                    <p className="text-xs text-muted-foreground">sets</p>
                  </div>
                  <div className="bg-secondary rounded-xl p-3 text-center">
                    <p className="text-lg font-bold font-heading">{Math.round(s.total_volume || 0)}kg</p>
                    <p className="text-xs text-muted-foreground">volume</p>
                  </div>
                  <div className="bg-secondary rounded-xl p-3 text-center">
                    <p className="text-lg font-bold font-heading">{s.duration_minutes || 0}m</p>
                    <p className="text-xs text-muted-foreground">duration</p>
                  </div>
                </div>

                {/* Sets breakdown */}
                {sessionSets[s.id] && sessionSets[s.id].length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Exercises</p>
                    <div className="space-y-1">
                      {Object.entries(
                        sessionSets[s.id].reduce((acc, set) => {
                          if (!acc[set.exercise_name]) acc[set.exercise_name] = [];
                          acc[set.exercise_name].push(set);
                          return acc;
                        }, {})
                      ).map(([exName, exSets]) => (
                        <div key={exName} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                          <span className="text-sm">{exName}</span>
                          <span className="text-xs text-muted-foreground">
                            {exSets.length} sets · {Math.max(...exSets.map(s => s.weight))}kg max
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}