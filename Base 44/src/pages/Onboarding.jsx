const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell, Target, Zap, ChevronRight } from "lucide-react";

const goals = [
  { value: "strength", label: "Strength", icon: "💪", desc: "Lift heavier, get stronger" },
  { value: "hypertrophy", label: "Muscle Growth", icon: "🏋️", desc: "Build size & definition" },
  { value: "fat_loss", label: "Fat Loss", icon: "🔥", desc: "Burn fat, stay lean" },
  { value: "general_fitness", label: "General Fitness", icon: "⚡", desc: "Overall health & energy" },
];

const levels = [
  { value: "beginner", label: "Beginner", desc: "Less than 6 months" },
  { value: "intermediate", label: "Intermediate", desc: "6 months – 2 years" },
  { value: "advanced", label: "Advanced", desc: "2+ years consistent" },
];

const splits = [
  { value: "push_pull_legs", label: "Push / Pull / Legs" },
  { value: "upper_lower", label: "Upper / Lower" },
  { value: "full_body", label: "Full Body" },
  { value: "custom", label: "Custom" },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ age: "", weight: "", height: "", fitness_goal: "", experience_level: "", preferred_split: "push_pull_legs" });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await db.entities.UserProfile.create({
      ...data,
      age: Number(data.age),
      weight: Number(data.weight),
      height: Number(data.height),
      onboarded: true,
    });
    onComplete();
  };

  const canNext = () => {
    if (step === 0) return data.age && data.weight && data.height;
    if (step === 1) return data.fitness_goal;
    if (step === 2) return data.experience_level;
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex gap-1 mb-8">
          {[0,1,2,3].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-3xl font-heading font-bold">Let's get started</h1>
              <p className="text-muted-foreground mt-1">Tell us about yourself</p>
            </div>
            <div className="space-y-4">
              <div><Label>Age</Label><Input type="number" placeholder="25" value={data.age} onChange={e => setData({...data, age: e.target.value})} className="mt-1 bg-card border-border" /></div>
              <div><Label>Weight (kg)</Label><Input type="number" placeholder="75" value={data.weight} onChange={e => setData({...data, weight: e.target.value})} className="mt-1 bg-card border-border" /></div>
              <div><Label>Height (cm)</Label><Input type="number" placeholder="178" value={data.height} onChange={e => setData({...data, height: e.target.value})} className="mt-1 bg-card border-border" /></div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-3xl font-heading font-bold">Your goal</h1>
              <p className="text-muted-foreground mt-1">What are you training for?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {goals.map(g => (
                <button key={g.value} onClick={() => setData({...data, fitness_goal: g.value})}
                  className={`p-4 rounded-xl border text-left transition-all ${data.fitness_goal === g.value ? "border-primary bg-primary/10" : "border-border bg-card hover:border-muted-foreground/30"}`}>
                  <span className="text-2xl">{g.icon}</span>
                  <p className="font-semibold mt-2 text-sm">{g.label}</p>
                  <p className="text-xs text-muted-foreground">{g.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-3xl font-heading font-bold">Experience</h1>
              <p className="text-muted-foreground mt-1">How long have you been training?</p>
            </div>
            <div className="space-y-3">
              {levels.map(l => (
                <button key={l.value} onClick={() => setData({...data, experience_level: l.value})}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${data.experience_level === l.value ? "border-primary bg-primary/10" : "border-border bg-card hover:border-muted-foreground/30"}`}>
                  <p className="font-semibold">{l.label}</p>
                  <p className="text-sm text-muted-foreground">{l.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-3xl font-heading font-bold">Training split</h1>
              <p className="text-muted-foreground mt-1">How do you like to organize your workouts?</p>
            </div>
            <div className="space-y-3">
              {splits.map(s => (
                <button key={s.value} onClick={() => setData({...data, preferred_split: s.value})}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${data.preferred_split === s.value ? "border-primary bg-primary/10" : "border-border bg-card hover:border-muted-foreground/30"}`}>
                  <p className="font-semibold">{s.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">Back</Button>}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="flex-1">
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? "Setting up..." : "Let's Go"} <Zap className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}