const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useRef } from "react";

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Check, Clock, X, Pause, Play, Info, Edit2, Timer } from "lucide-react";
import ExerciseSelector from "@/components/ExerciseSelector";
import SetRow from "@/components/SetRow";
import ExerciseDetailModal from "@/components/ExerciseDetailModal";
import WorkoutAICoach from "@/components/WorkoutAICoach";
import RestTimer from "@/components/RestTimer";

const workoutTypes = [
  { value: "push", label: "Push" },
  { value: "pull", label: "Pull" },
  { value: "legs", label: "Legs" },
  { value: "upper", label: "Upper" },
  { value: "lower", label: "Lower" },
  { value: "full_body", label: "Full Body" },
  { value: "custom", label: "Custom" },
];

export default function Workout() {
  const navigate = useNavigate();
  const [workoutType, setWorkoutType] = useState("push");
  const [exercises, setExercises] = useState([]);
  const [showSelector, setShowSelector] = useState(false);
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [infoExercise, setInfoExercise] = useState(null);
  const [editingTimer, setEditingTimer] = useState(false);
  const [timerInput, setTimerInput] = useState({ h: "0", m: "0", s: "0" });
  const [restTimer, setRestTimer] = useState({ open: false, exerciseName: "", seconds: 90 });
  const timerRef = useRef(null);
  const pausedAt = useRef(null);
  const totalPaused = useRef(0);

  useEffect(() => {
    if (started && !paused && startTime) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime - totalPaused.current) / 1000));
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [started, paused, startTime]);

  const formatTime = (s) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleStart = () => { setStarted(true); setStartTime(Date.now()); };

  const togglePause = () => {
    if (paused) {
      totalPaused.current += Date.now() - pausedAt.current;
      setPaused(false);
    } else {
      pausedAt.current = Date.now();
      clearInterval(timerRef.current);
      setPaused(true);
    }
  };

  const openEditTimer = () => {
    setTimerInput({
      h: String(Math.floor(elapsed / 3600)),
      m: String(Math.floor((elapsed % 3600) / 60)),
      s: String(elapsed % 60),
    });
    setEditingTimer(true);
  };

  const applyEditTimer = () => {
    const newElapsed = (parseInt(timerInput.h) || 0) * 3600 + (parseInt(timerInput.m) || 0) * 60 + (parseInt(timerInput.s) || 0);
    setElapsed(newElapsed);
    // Adjust startTime so timer continues correctly from this point
    setStartTime(Date.now() - newElapsed * 1000 - totalPaused.current);
    setEditingTimer(false);
  };

  const addExercise = (ex) => setExercises([...exercises, { exercise: ex, sets: [{ weight: "", reps: "" }], restSeconds: 90 }]);

  const updateRestSeconds = (exIdx, val) => {
    const updated = [...exercises];
    updated[exIdx].restSeconds = val;
    setExercises(updated);
  };

  const updateSet = (exIdx, setIdx, newSet) => {
    const updated = [...exercises];
    updated[exIdx].sets[setIdx] = newSet;
    setExercises(updated);
  };

  const addSet = (exIdx) => {
    const updated = [...exercises];
    const lastSet = updated[exIdx].sets[updated[exIdx].sets.length - 1];
    updated[exIdx].sets.push({ weight: lastSet?.weight || "", reps: lastSet?.reps || "" });
    setExercises(updated);
  };

  const deleteSet = (exIdx, setIdx) => {
    const updated = [...exercises];
    updated[exIdx].sets.splice(setIdx, 1);
    if (updated[exIdx].sets.length === 0) updated.splice(exIdx, 1);
    setExercises(updated);
  };

  const removeExercise = (exIdx) => setExercises(exercises.filter((_, i) => i !== exIdx));

  const finishWorkout = async () => {
    setSaving(true);
    const user = await db.auth.me();
    let totalVolume = 0;
    let totalSets = 0;
    const allSets = [];

    const existingSets = await db.entities.WorkoutSet.filter({ created_by: user.email }, "-weight", 500);
    const prMap = {};
    existingSets.forEach(s => {
      if (!prMap[s.exercise_name] || s.weight > prMap[s.exercise_name]) prMap[s.exercise_name] = s.weight;
    });

    exercises.forEach(({ exercise, sets }) => {
      sets.forEach((set, i) => {
        const w = Number(set.weight) || 0;
        const r = Number(set.reps) || 0;
        totalVolume += w * r;
        totalSets++;
        const isPr = w > (prMap[exercise.name] || 0);
        if (isPr) prMap[exercise.name] = w;
        allSets.push({ exercise_id: exercise.id, exercise_name: exercise.name, muscle_group: exercise.muscle_group, set_number: i + 1, reps: r, weight: w, is_pr: isPr });
      });
    });

    const session = await db.entities.WorkoutSession.create({
      name: `${workoutTypes.find(t => t.value === workoutType)?.label} Day`,
      workout_type: workoutType,
      duration_minutes: Math.round(elapsed / 60),
      total_volume: totalVolume,
      total_sets: totalSets,
      completed: true,
      completed_at: new Date().toISOString(),
    });

    if (allSets.length > 0) {
      await db.entities.WorkoutSet.bulkCreate(allSets.map(s => ({ ...s, session_id: session.id })));
    }
    navigate("/");
  };

  if (!started) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 pt-6">
        <h1 className="text-2xl font-heading font-bold mb-6">New Workout</h1>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Workout Type</label>
            <Select value={workoutType} onValueChange={setWorkoutType}>
              <SelectTrigger className="bg-card border-border h-12"><SelectValue /></SelectTrigger>
              <SelectContent>
                {workoutTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleStart} className="w-full h-14 text-base font-semibold rounded-2xl bg-primary shadow-lg shadow-primary/25">
            Start Workout
          </Button>
          <Button variant="ghost" onClick={() => navigate("/")} className="w-full text-muted-foreground">Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-heading font-bold capitalize">{workoutType.replace("_", " ")} Day</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <button onClick={openEditTimer}
              className="flex items-center gap-1 text-primary text-sm font-mono hover:text-primary/80 transition-colors group">
              <Clock className="w-3.5 h-3.5" />
              <span className={paused ? "opacity-50" : ""}>{formatTime(elapsed)}</span>
              <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
            </button>
            <button onClick={togglePause}
              className="h-6 w-6 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-primary/10 transition-colors">
              {paused ? <Play className="w-3 h-3 text-primary" /> : <Pause className="w-3 h-3 text-muted-foreground" />}
            </button>
          </div>
        </div>
        <Button onClick={finishWorkout} disabled={saving || exercises.length === 0} size="sm"
          className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
          <Check className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Finish"}
        </Button>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {exercises.map((ex, exIdx) => (
          <div key={exIdx} className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{ex.exercise.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{ex.exercise.muscle_group}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setInfoExercise(ex.exercise)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                  <Info className="w-4 h-4" />
                </button>
                <button onClick={() => setRestTimer({ open: true, exerciseName: ex.exercise.name, seconds: ex.restSeconds || 90 })}
                  className="h-7 px-2 rounded-lg flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary/40">
                  <Timer className="w-3 h-3" /> {ex.restSeconds || 90}s
                </button>
                <button onClick={() => removeExercise(exIdx)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <span className="w-6 text-center">Set</span>
              <span className="flex-1 text-center">Weight</span>
              <span className="w-4" />
              <span className="flex-1 text-center">Reps</span>
              <span className="w-12" />
            </div>
            <div className="space-y-2">
              {ex.sets.map((set, setIdx) => (
                <SetRow key={setIdx} set={set} index={setIdx}
                  onChange={(s) => updateSet(exIdx, setIdx, s)}
                  onDelete={() => deleteSet(exIdx, setIdx)} />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => addSet(exIdx)} className="flex-1 text-xs text-muted-foreground">
                <Plus className="w-3 h-3 mr-1" /> Add Set
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Rest:</span>
                <button onClick={() => updateRestSeconds(exIdx, Math.max(5, (ex.restSeconds || 90) - 15))}
                  className="h-6 w-6 rounded-md bg-secondary border border-border flex items-center justify-center text-xs hover:border-primary/40">
                  -
                </button>
                <span className="text-xs font-mono w-8 text-center">{ex.restSeconds || 90}s</span>
                <button onClick={() => updateRestSeconds(exIdx, (ex.restSeconds || 90) + 15)}
                  className="h-6 w-6 rounded-md bg-secondary border border-border flex items-center justify-center text-xs hover:border-primary/40">
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={() => setShowSelector(true)}
        className="w-full mt-4 h-12 rounded-xl border-dashed border-border text-muted-foreground hover:text-foreground">
        <Plus className="w-4 h-4 mr-2" /> Add Exercise
      </Button>

      <ExerciseSelector open={showSelector} onClose={() => setShowSelector(false)} onSelect={addExercise} />

      <ExerciseDetailModal exercise={infoExercise} onClose={() => setInfoExercise(null)} />

      <WorkoutAICoach exercises={exercises} />
      <RestTimer
        open={restTimer.open}
        onClose={() => setRestTimer(r => ({ ...r, open: false }))}
        initialSeconds={restTimer.seconds}
        exerciseName={restTimer.exerciseName}
      />

      {/* Timer edit modal */}
      {editingTimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingTimer(false)} />
          <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-xs space-y-4">
            <h3 className="font-heading font-bold text-center">Edit Timer</h3>
            <div className="flex items-center gap-2 justify-center">
              {[{ label: "h", key: "h" }, { label: "m", key: "m" }, { label: "s", key: "s" }].map(({ label, key }) => (
                <div key={key} className="flex flex-col items-center gap-1">
                  <input type="number" min="0" value={timerInput[key]}
                    onChange={e => setTimerInput(p => ({ ...p, [key]: e.target.value }))}
                    className="w-16 h-12 text-center text-xl font-mono font-bold bg-secondary border border-border rounded-xl outline-none focus:border-primary/50" />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
            <Button onClick={applyEditTimer} className="w-full">Set Time</Button>
          </div>
        </div>
      )}
    </div>
  );
}