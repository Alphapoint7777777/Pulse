const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, FileDown, Loader2, FileText } from "lucide-react";
import moment from "moment";
import jsPDF from "jspdf";

const REPORT_TYPES = [
  { id: "monthly", label: "Monthly Summary", desc: "Stats for a specific month" },
  { id: "alltime", label: "All-Time Report", desc: "Full history & personal records" },
  { id: "recent", label: "Last 30 Days", desc: "Recent training snapshot" },
];

function buildPDF(reportType, sessions, sets, user) {
  const doc = new jsPDF();
  const primary = [59, 130, 246];
  const accent = [34, 197, 94];
  const gray = [100, 116, 139];

  // Header
  doc.setFillColor(10, 15, 35);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Workout Report", 15, 18);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);
  doc.text(`${user?.full_name || "Athlete"} · Generated ${moment().format("MMMM D, YYYY")}`, 15, 28);
  doc.setTextColor(...primary);
  doc.text(REPORT_TYPES.find(r => r.id === reportType)?.label || "Report", 15, 35);

  let y = 55;

  // Filter sessions
  let filtered = sessions.filter(s => s.completed);
  if (reportType === "monthly") {
    filtered = filtered.filter(s => moment(s.completed_at || s.created_date).isSame(moment(), "month"));
  } else if (reportType === "recent") {
    filtered = filtered.filter(s => moment(s.completed_at || s.created_date).isAfter(moment().subtract(30, "days")));
  }

  // Stats summary
  const totalVolume = filtered.reduce((a, s) => a + (s.total_volume || 0), 0);
  const totalSets = filtered.reduce((a, s) => a + (s.total_sets || 0), 0);
  const totalTime = filtered.reduce((a, s) => a + (s.duration_minutes || 0), 0);
  const avgDuration = filtered.length ? Math.round(totalTime / filtered.length) : 0;

  const stats = [
    ["Workouts", filtered.length],
    ["Total Volume", totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${Math.round(totalVolume)}kg`],
    ["Total Sets", totalSets],
    ["Avg Duration", `${avgDuration}m`],
  ];

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 50);
  doc.text("Summary", 15, y);
  y += 8;

  stats.forEach((s, i) => {
    const x = 15 + (i % 2) * 95;
    const row = Math.floor(i / 2);
    const ry = y + row * 22;
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(x, ry, 85, 18, 3, 3, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...gray);
    doc.text(String(s[0]), x + 5, ry + 7);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 50);
    doc.text(String(s[1]), x + 5, ry + 14);
  });
  y += 50;

  // Workouts list
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 50);
  doc.text("Workout Log", 15, y);
  y += 8;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...gray);
  doc.text("DATE", 15, y);
  doc.text("WORKOUT", 55, y);
  doc.text("SETS", 125, y);
  doc.text("VOLUME", 145, y);
  doc.text("DURATION", 170, y);
  y += 4;
  doc.setDrawColor(220, 220, 230);
  doc.line(15, y, 195, y);
  y += 5;

  filtered.slice(0, 25).forEach(s => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 70);
    doc.text(moment(s.completed_at || s.created_date).format("MMM D"), 15, y);
    doc.text((s.name || "").substring(0, 30), 55, y);
    doc.text(String(s.total_sets || 0), 125, y);
    const vol = s.total_volume || 0;
    doc.text(vol >= 1000 ? `${(vol / 1000).toFixed(1)}t` : `${Math.round(vol)}kg`, 145, y);
    doc.text(`${s.duration_minutes || 0}m`, 170, y);
    y += 7;
  });

  // Personal Records
  if (sets.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    y += 8;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 50);
    doc.text("Personal Records", 15, y);
    y += 8;

    const prs = {};
    sets.forEach(s => {
      if (!prs[s.exercise_name] || s.weight > prs[s.exercise_name]) {
        prs[s.exercise_name] = s.weight;
      }
    });
    const prList = Object.entries(prs).sort((a, b) => b[1] - a[1]).slice(0, 15);

    prList.forEach(([name, weight], i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      const x = 15 + (i % 2) * 95;
      if (i % 2 === 0 && i > 0) y += 12;
      else if (i === 0) {}
      else y -= 12;
      doc.setFillColor(240, 250, 245);
      doc.roundedRect(x, y, 85, 10, 2, 2, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 70);
      doc.text(name.substring(0, 20), x + 4, y + 6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...accent);
      doc.text(`${weight}kg`, x + 68, y + 6.5);
      if (i % 2 === 0) y += 0;
    });
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...gray);
    doc.text(`Generated by FitTrack · Page ${i} of ${pageCount}`, 15, 290);
  }

  return doc;
}

export default function Reports() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [sets, setSets] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);

  useEffect(() => {
    const load = async () => {
      const u = await db.auth.me();
      setUser(u);
      const [sess, allSets] = await Promise.all([
        db.entities.WorkoutSession.filter({ created_by_id: u.id }, "-created_date", 200),
        db.entities.WorkoutSet.filter({ created_by_id: u.id }, "-created_date", 1000),
      ]);
      setSessions(sess);
      setSets(allSets);
      setLoading(false);
    };
    load();
  }, []);

  const generate = async (type) => {
    setGenerating(type);
    await new Promise(r => setTimeout(r, 300));
    const doc = buildPDF(type, sessions, sets, user);
    const label = REPORT_TYPES.find(r => r.id === type)?.label || "Report";
    doc.save(`FitTrack_${label.replace(/ /g, "_")}_${moment().format("YYYY-MM-DD")}.pdf`);
    setGenerating(null);
  };

  const totalVolume = sessions.filter(s => s.completed).reduce((a, s) => a + (s.total_volume || 0), 0);
  const thisMonth = sessions.filter(s => s.completed && moment(s.completed_at || s.created_date).isSame(moment(), "month")).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-heading font-bold">PDF Reports</h1>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-2xl border border-border p-3 text-center">
          <p className="text-2xl font-heading font-bold text-primary">{sessions.filter(s => s.completed).length}</p>
          <p className="text-xs text-muted-foreground">total sessions</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-3 text-center">
          <p className="text-2xl font-heading font-bold">{thisMonth}</p>
          <p className="text-xs text-muted-foreground">this month</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-3 text-center">
          <p className="text-2xl font-heading font-bold">{totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${Math.round(totalVolume)}kg`}</p>
          <p className="text-xs text-muted-foreground">total volume</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">Choose a report type to download as a formatted PDF</p>

      <div className="space-y-3">
        {REPORT_TYPES.map(r => (
          <div key={r.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{r.label}</p>
              <p className="text-xs text-muted-foreground">{r.desc}</p>
            </div>
            <Button size="sm" onClick={() => generate(r.id)} disabled={generating === r.id}
              className="shrink-0 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
              {generating === r.id ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating...</>
              ) : (
                <><FileDown className="w-4 h-4 mr-1" /> Download</>
              )}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-card rounded-2xl border border-dashed border-border p-5 text-center">
        <p className="text-sm text-muted-foreground">Reports include workout logs, volume stats, and personal records formatted as a clean PDF document.</p>
      </div>
    </div>
  );
}