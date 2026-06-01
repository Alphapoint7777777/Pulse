const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

const QUICK_PROMPTS = [
  "Am I overtraining any muscle group?",
  "How can I break through my plateau?",
  "Suggest a workout for tomorrow",
  "Review my weekly volume balance",
];

export default function AICoach() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const loadContext = async () => {
      const user = await db.auth.me();
      const [profiles, sessions, sets] = await Promise.all([
        db.entities.UserProfile.filter({ created_by: user.email }),
        db.entities.WorkoutSession.filter({ created_by: user.email, completed: true }, "-created_date", 20),
        db.entities.WorkoutSet.filter({ created_by: user.email }, "-created_date", 200),
      ]);
      setContext({ profile: profiles[0], sessions, sets, user });
    };
    loadContext();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const profileSummary = context?.profile
      ? `User: ${context.profile.age}yo, ${context.profile.weight}kg, ${context.profile.height}cm, goal: ${context.profile.fitness_goal}, level: ${context.profile.experience_level}`
      : "No profile data yet.";

    const sessionSummary = context?.sessions?.slice(0, 10).map(s =>
      `${s.name} (${s.workout_type}) - ${s.total_sets} sets, ${Math.round(s.total_volume || 0)}kg volume, ${s.duration_minutes}min`
    ).join("\n") || "No workout history.";

    const volumeByGroup = {};
    context?.sets?.forEach(s => {
      volumeByGroup[s.muscle_group] = (volumeByGroup[s.muscle_group] || 0) + (s.weight * s.reps);
    });
    const volumeSummary = Object.entries(volumeByGroup).map(([g, v]) => `${g}: ${Math.round(v)}kg`).join(", ");

    const prompt = `You are an expert fitness coach AI. Be concise, encouraging, and specific. Use data provided to give personalized advice.

${profileSummary}

Recent workouts (last 10):
${sessionSummary}

Total volume by muscle group: ${volumeSummary || "No data"}

Conversation so far:
${messages.map(m => `${m.role}: ${m.content}`).join("\n")}

User: ${text}

Respond helpfully and concisely. Use markdown formatting.`;

    const response = await db.integrations.Core.InvokeLLM({ prompt });
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[calc(100vh-4rem)]">
      <div className="px-4 pt-6 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-heading font-bold">AI Coach</h1>
            <p className="text-xs text-muted-foreground">Powered by your training data</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-4">
        {messages.length === 0 && (
          <div className="pt-8 space-y-4">
            <div className="text-center mb-6">
              <Sparkles className="w-10 h-10 text-primary mx-auto mb-3 opacity-60" />
              <p className="text-sm text-muted-foreground">Ask me anything about your training</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p)}
                  className="text-left text-xs p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="h-6 w-6 rounded-lg bg-primary/20 flex items-center justify-center mt-1 shrink-0">
                <Bot className="w-3 h-3 text-primary" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
              m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border"
            }`}>
              {m.role === "user" ? (
                <p className="text-sm">{m.content}</p>
              ) : (
                <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  {m.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="h-6 w-6 rounded-lg bg-primary/20 flex items-center justify-center mt-1">
              <Bot className="w-3 h-3 text-primary" />
            </div>
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="px-4 py-3 border-t border-border">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
          <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask your AI coach..."
            className="flex-1 bg-card border-border rounded-xl" disabled={loading} />
          <Button type="submit" size="icon" disabled={!input.trim() || loading} className="rounded-xl h-10 w-10">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}