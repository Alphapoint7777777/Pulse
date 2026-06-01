import { X, Youtube, CheckCircle2, Lightbulb, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getExerciseData } from "@/utils/exerciseInstructions";

const MUSCLE_COLORS = {
  chest:      "bg-blue-500/15 text-blue-400 border-blue-500/20",
  back:       "bg-purple-500/15 text-purple-400 border-purple-500/20",
  shoulders:  "bg-orange-500/15 text-orange-400 border-orange-500/20",
  biceps:     "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  triceps:    "bg-pink-500/15 text-pink-400 border-pink-500/20",
  quads:      "bg-green-500/15 text-green-400 border-green-500/20",
  hamstrings: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  glutes:     "bg-rose-500/15 text-rose-400 border-rose-500/20",
  calves:     "bg-teal-500/15 text-teal-400 border-teal-500/20",
  abs:        "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  forearms:   "bg-amber-500/15 text-amber-400 border-amber-500/20",
};

export default function ExerciseDetailModal({ exercise, onClose, onAdd }) {
  if (!exercise) return null;
  const data = getExerciseData(exercise.name);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-card rounded-t-3xl border-t border-x border-border overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: "88vh" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(88vh - 60px)" }}>
          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-2 pb-4">
            <div className="flex-1">
              <h2 className="text-xl font-heading font-bold">{exercise.name}</h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${MUSCLE_COLORS[exercise.muscle_group] || "bg-secondary text-secondary-foreground border-border"}`}>
                  {exercise.muscle_group}
                </span>
                {exercise.category && (
                  <span className="text-xs px-2.5 py-1 rounded-full border border-border bg-secondary text-secondary-foreground font-medium capitalize">
                    {exercise.category}
                  </span>
                )}
                {exercise.equipment && (
                  <span className="text-xs px-2.5 py-1 rounded-full border border-border bg-secondary text-secondary-foreground font-medium capitalize">
                    {exercise.equipment}
                  </span>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 mt-1 shrink-0" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Video Embed */}
          {data.youtube && (
            <div className="px-5 mb-4">
              <div className="rounded-2xl overflow-hidden border border-border bg-black aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${data.youtube}?rel=0&modestbranding=1`}
                  title={`${exercise.name} tutorial`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {!data.youtube && (
            <div className="px-5 mb-4">
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + " exercise tutorial form")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
              >
                <Youtube className="w-6 h-6 text-red-400" />
                <div>
                  <p className="text-sm font-semibold text-red-400">Watch on YouTube</p>
                  <p className="text-xs text-muted-foreground">See tutorial videos for {exercise.name}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </a>
            </div>
          )}

          {/* Instructions */}
          <div className="px-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">How to perform</h3>
            </div>
            <div className="space-y-2">
              {data.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Tip */}
          <div className="px-5 mb-5">
            <div className="flex gap-3 p-3.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-200/80 leading-relaxed">{data.tips}</p>
            </div>
          </div>

          {/* Add Button */}
          {onAdd && (
            <div className="px-5 pb-6">
              <Button onClick={() => { onAdd(exercise); onClose(); }} className="w-full h-12 font-semibold rounded-2xl">
                Add to Workout
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}