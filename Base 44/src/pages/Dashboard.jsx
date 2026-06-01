const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useRef } from "react";

import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, Flame, TrendingUp, Dumbbell, Bot, BarChart3, Settings, LogOut, Users, Scale, FileDown } from "lucide-react";
import Onboarding from "./Onboarding";
import StreakCard from "@/components/StreakCard";
import { useSettings } from "@/hooks/useSettings";
import moment from "moment";

const QUOTES = [
  "The pain you feel today will be the strength you feel tomorrow.",
  "Every rep brings you closer to who you want to become.",
  "Discipline is doing it even when you don't feel like it.",
  "Your only competition is who you were yesterday.",
  "Progress, not perfection.",
];

const TYPE_COLORS = {
  push: "bg-blue-500/10 text-blue-400",
  pull: "bg-purple-500/10 text-purple-400",
  legs: "bg-green-500/10 text-green-400",
  upper: "bg-orange-500/10 text-orange-400",
  lower: "bg-cyan-500/10 text-cyan-400",
  full_body: "bg-pink-500/10 text-pink-400",
  custom: "bg-muted text-muted-foreground",
};

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const { settings } = useSettings();

  useEffect(() => {
    const handler = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const quote = QUOTES[new Date().getDay() % QUOTES.length];

  const load = async () => {
    setLoading(true);
    const u = await db.auth.me();
    setUser(u);
    const profiles = await db.entities.UserProfile.filter({ created_by: u.email });
    if (profiles.length === 0) {
      setNeedsOnboarding(true);
      setLoading(false);
      return;
    }
    setProfile(profiles[0]);
    const sess = await db.entities.WorkoutSession.filter({ created_by: u.email }, "-created_date", 50);
    setSessions(sess);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
  if (needsOnboarding) return <Onboarding onComplete={load} />;

  const recentSessions = sessions.filter(s => s.completed).slice(0, 5);
  const goalLabel = { strength: "Strength", hypertrophy: "Muscle Growth", fat_loss: "Fat Loss", general_fitness: "General Fitness" };
  const totalVolume = sessions.reduce((acc, s) => acc + (s.total_volume || 0), 0);
  const formatVolume = (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${Math.round(v)}kg`;

  return (
    <div className={`w-full max-w-2xl mx-auto px-4 pt-6 pb-4 ${settings.density === "compact" ? "space-y-3" : "space-y-5"}`}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},</p>
          <h1 className="text-2xl font-heading font-bold leading-tight">
            {user?.full_name?.split(" ")[0] || "Athlete"} 💪
          </h1>
        </div>
        <div className="relative" ref={profileRef}>
          <button onClick={() => setShowProfileMenu(p => !p)}
            className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 hover:bg-primary/30 transition-colors">
            <span className="text-primary font-bold text-sm">{(user?.full_name?.[0] || "A").toUpperCase()}</span>
          </button>
          {showProfileMenu && (
            <div className="absolute right-0 top-12 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[160px]">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-semibold truncate">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <button onClick={() => { setShowProfileMenu(false); navigate("/settings"); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary transition-colors">
                <Settings className="w-4 h-4 text-muted-foreground" /> Settings
              </button>
              <button onClick={() => db.auth.logout()}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-destructive/10 text-destructive transition-colors">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Motivational Quote */}
      {settings.showMotivationalQuotes && (
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4">
          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-primary/10 blur-xl" />
          <p className="text-sm text-foreground/80 italic leading-relaxed">"{quote}"</p>
        </div>
      )}

      {/* Streak Cards */}
      <StreakCard sessions={sessions} />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Volume</span>
          </div>
          <p className="text-2xl font-heading font-bold">{formatVolume(totalVolume)}</p>
          <p className="text-xs text-muted-foreground">all time</p>
        </div>
        {profile && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Goal</span>
            </div>
            <p className="text-base font-heading font-bold leading-tight">{goalLabel[profile.fitness_goal] || "Fitness"}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile.experience_level}</p>
          </div>
        )}
      </div>

      {/* CTA */}
      <Link to="/workout">
        <Button className="w-full h-14 text-base font-semibold rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
          <Plus className="w-5 h-5 mr-2" /> Start Workout
        </Button>
      </Link>

      {/* Quick Nav Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/progress">
          <div className="bg-card rounded-2xl border border-border p-4 hover:border-primary/30 transition-all">
            <BarChart3 className="w-5 h-5 text-primary mb-2" />
            <p className="font-semibold text-sm">Progress</p>
            <p className="text-xs text-muted-foreground">View your charts</p>
          </div>
        </Link>
        <Link to="/coach">
          <div className="bg-card rounded-2xl border border-border p-4 hover:border-primary/30 transition-all">
            <Bot className="w-5 h-5 text-primary mb-2" />
            <p className="font-semibold text-sm">AI Coach</p>
            <p className="text-xs text-muted-foreground">Get insights</p>
          </div>
        </Link>
        <Link to="/calculator">
          <div className="bg-card rounded-2xl border border-border p-4 hover:border-primary/30 transition-all">
            <Scale className="w-5 h-5 text-primary mb-2" />
            <p className="font-semibold text-sm">Plate Calc</p>
            <p className="text-xs text-muted-foreground">Bar weight setup</p>
          </div>
        </Link>
        <Link to="/friends">
          <div className="bg-card rounded-2xl border border-border p-4 hover:border-primary/30 transition-all">
            <Users className="w-5 h-5 text-primary mb-2" />
            <p className="font-semibold text-sm">Friends</p>
            <p className="text-xs text-muted-foreground">Leaderboard</p>
          </div>
        </Link>
        <Link to="/reports" className="col-span-2">
          <div className="bg-card rounded-2xl border border-border p-4 hover:border-primary/30 transition-all flex items-center gap-3">
            <FileDown className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-sm">PDF Reports</p>
              <p className="text-xs text-muted-foreground">Download your workout data</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Workouts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-semibold">Recent Workouts</h2>
          <Link to="/progress" className="text-xs text-primary flex items-center gap-0.5 hover:underline">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {recentSessions.length === 0 ? (
          <div className="bg-card rounded-2xl border border-dashed border-border p-10 text-center">
            <Dumbbell className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No workouts yet. Start your first one!</p>
          </div>
        ) : (
          <div className={`${settings.density === "compact" ? "space-y-1.5" : "space-y-2"}`}>
            {recentSessions.map(s => (
              <div key={s.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${TYPE_COLORS[s.workout_type] || TYPE_COLORS.custom}`}>
                    {s.workout_type?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {moment(s.completed_at || s.created_date).fromNow()} · {s.total_sets || 0} sets · {Math.round(s.total_volume || 0)}{settings.units}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-lg bg-secondary text-secondary-foreground font-medium">
                  {s.duration_minutes}m
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}