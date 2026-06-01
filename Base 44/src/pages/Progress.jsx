const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";

import WorkoutAICoach from "@/components/WorkoutAICoach";
import MuscleHeatmap from "@/components/MuscleHeatmap";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import moment from "moment";

export default function Progress() {
  const [sessions, setSessions] = useState([]);
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState("all");

  useEffect(() => {
    const load = async () => {
      const user = await db.auth.me();
      const [sess, allSets] = await Promise.all([
        db.entities.WorkoutSession.filter({ created_by: user.email, completed: true }, "-created_date", 100),
        db.entities.WorkoutSet.filter({ created_by: user.email }, "-created_date", 500),
      ]);
      setSessions(sess);
      setSets(allSets);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  // Unique exercises
  const exerciseNames = [...new Set(sets.map(s => s.exercise_name))].sort();

  // Strength progression for selected exercise
  const strengthData = (() => {
    const filtered = selectedExercise === "all" ? sets : sets.filter(s => s.exercise_name === selectedExercise);
    const bySession = {};
    filtered.forEach(s => {
      if (!bySession[s.session_id] || s.weight > bySession[s.session_id].weight) {
        bySession[s.session_id] = s;
      }
    });
    const sessionMap = {};
    sessions.forEach(s => { sessionMap[s.id] = s; });
    return Object.values(bySession)
      .filter(s => sessionMap[s.session_id])
      .map(s => ({
        date: moment(sessionMap[s.session_id].completed_at || sessionMap[s.session_id].created_date).format("MMM D"),
        weight: s.weight,
        exercise: s.exercise_name,
      }))
      .reverse();
  })();

  // Weekly volume by muscle group
  const volumeData = (() => {
    const groups = {};
    sets.forEach(s => {
      const g = s.muscle_group || "other";
      groups[g] = (groups[g] || 0) + (s.weight * s.reps);
    });
    return Object.entries(groups).map(([name, volume]) => ({ name, volume: Math.round(volume) })).sort((a,b) => b.volume - a.volume);
  })();

  // PRs
  const prs = (() => {
    const map = {};
    sets.forEach(s => {
      if (!map[s.exercise_name] || s.weight > map[s.exercise_name].weight) {
        map[s.exercise_name] = s;
      }
    });
    return Object.values(map).sort((a,b) => b.weight - a.weight).slice(0, 5);
  })();

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-6 pb-4">
      <h1 className="text-2xl font-heading font-bold mb-6">Progress</h1>

      {sessions.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <p className="text-muted-foreground">Complete some workouts to see your progress here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Strength Progression */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-sm">Strength Progression</h2>
              <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                <SelectTrigger className="w-40 h-8 text-xs bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exercises</SelectItem>
                  {exerciseNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {strengthData.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={strengthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,15%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(220,10%,50%)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(220,10%,50%)" }} />
                  <Tooltip contentStyle={{ background: "hsl(220,18%,8%)", border: "1px solid hsl(220,15%,15%)", borderRadius: 12, fontSize: 12 }} />
                  <Legend formatter={() => "Max Weight (kg)"} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Line type="monotone" dataKey="weight" name="Max Weight" stroke="hsl(210,100%,55%)" strokeWidth={2.5} dot={{ fill: "hsl(210,100%,55%)", r: 4, strokeWidth: 2, stroke: "hsl(220,18%,8%)" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-xs text-muted-foreground text-center py-8">Need more data for this chart</p>}
          </div>

          {/* Volume by Muscle Group */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <h2 className="font-heading font-semibold text-sm mb-4">Volume by Muscle Group</h2>
            {volumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,15%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(220,10%,50%)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(220,10%,50%)" }} />
                  <Tooltip contentStyle={{ background: "hsl(220,18%,8%)", border: "1px solid hsl(220,15%,15%)", borderRadius: 12, fontSize: 12 }} />
                  <Legend formatter={() => "Total Volume (kg)"} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar dataKey="volume" name="Volume" fill="hsl(150,80%,50%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-xs text-muted-foreground text-center py-8">No volume data yet</p>}
          </div>

          {/* Muscle Heatmap */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <h2 className="font-heading font-semibold text-sm mb-4">🔥 Muscle Activation Map</h2>
            <MuscleHeatmap sets={sets} />
          </div>

          {/* Personal Records */}
          {prs.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-4">
              <h2 className="font-heading font-semibold text-sm mb-3">🏆 Personal Records</h2>
              <div className="space-y-2">
                {prs.map((pr, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <span className="text-sm">{pr.exercise_name}</span>
                    <span className="text-sm font-bold text-primary">{pr.weight}kg × {pr.reps}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <WorkoutAICoach exercises={[]} />
    </div>
  );
}