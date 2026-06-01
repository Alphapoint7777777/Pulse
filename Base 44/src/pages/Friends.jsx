const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, UserPlus, Trophy, Dumbbell, Check, X, Clock, Users } from "lucide-react";

const MEDAL = ["🥇", "🥈", "🥉"];

export default function Friends() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [friendships, setFriendships] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [tab, setTab] = useState("leaderboard");
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    const u = await db.auth.me();
    setUser(u);

    // Load friendships involving me
    const sent = await db.entities.Friendship.filter({ requester_id: u.id });
    const received = await db.entities.Friendship.filter({ recipient_email: u.email });
    setFriendships([...sent, ...received]);

    // Build leaderboard from accepted friends + self
    const accepted = [...sent, ...received].filter(f => f.status === "accepted");
    const friendIds = accepted.map(f => f.requester_id === u.id ? f.recipient_id : f.requester_id).filter(Boolean);
    const allIds = [u.id, ...friendIds];

    // Get sessions for all users
    const allSessions = await db.entities.WorkoutSession.filter({ completed: true }, "-created_date", 500);
    const myAndFriendSessions = allSessions.filter(s => allIds.includes(s.created_by_id));

    // Aggregate per user
    const stats = {};
    myAndFriendSessions.forEach(s => {
      if (!stats[s.created_by_id]) stats[s.created_by_id] = { volume: 0, sessions: 0, name: "Unknown" };
      stats[s.created_by_id].volume += s.total_volume || 0;
      stats[s.created_by_id].sessions += 1;
    });
    if (!stats[u.id]) stats[u.id] = { volume: 0, sessions: 0, name: u.full_name };
    stats[u.id].name = u.full_name;

    // Apply friend names
    accepted.forEach(f => {
      const fid = f.requester_id === u.id ? f.recipient_id : f.requester_id;
      const fname = f.requester_id === u.id ? f.recipient_name : f.requester_name;
      if (fid && stats[fid]) stats[fid].name = fname || stats[fid].name;
    });

    const board = Object.entries(stats)
      .map(([id, s]) => ({ id, ...s, isMe: id === u.id }))
      .sort((a, b) => b.volume - a.volume);
    setLeaderboard(board);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !user) return;
    setInviting(true);
    setMsg("");
    const existing = friendships.find(f =>
      (f.requester_email === user.email && f.recipient_email === inviteEmail) ||
      (f.recipient_email === user.email && f.requester_email === inviteEmail)
    );
    if (existing) { setMsg("Already sent or connected!"); setInviting(false); return; }
    await db.entities.Friendship.create({
      requester_id: user.id,
      requester_email: user.email,
      requester_name: user.full_name,
      recipient_email: inviteEmail.trim(),
      status: "pending",
    });
    // Note: email notification only works for existing app users
    try {
      await db.integrations.Core.SendEmail({
        to: inviteEmail.trim(),
        subject: `${user.full_name} sent you a friend request on FitTrack`,
        body: `Hey! ${user.full_name} (${user.email}) wants to be friends with you on FitTrack.\n\nOpen the app and go to Friends → Requests to accept or decline.`,
      });
    } catch (e) {
      // Recipient may not be in the app yet — request is still saved
    }
    setInviteEmail("");
    setMsg("Request sent! They'll receive an email notification.");
    setInviting(false);
    load();
  };

  const respond = async (fid, status) => {
    const f = friendships.find(fr => fr.id === fid);
    if (!f) return;
    const allSessions = await db.entities.WorkoutSession.filter({ completed: true, created_by_id: user.id }, "-created_date", 1);
    // Try to find recipient's user id from sessions
    await db.entities.Friendship.update(fid, {
      status,
      recipient_id: user.id,
      recipient_name: user.full_name,
    });
    load();
  };

  const pendingReceived = friendships.filter(f => f.recipient_email === user?.email && f.status === "pending");
  const accepted = friendships.filter(f => f.status === "accepted");
  const pendingSent = friendships.filter(f => f.requester_email === user?.email && f.status === "pending");

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
        <h1 className="text-2xl font-heading font-bold">Friends</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-5">
        {[["leaderboard", Trophy, "Leaderboard"], ["friends", Users, "Friends"], ["add", UserPlus, "Add"]].map(([t, Icon, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Leaderboard tab */}
      {tab === "leaderboard" && (
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <div className="bg-card rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground text-sm">
              Add friends to see the leaderboard
            </div>
          ) : leaderboard.map((entry, i) => (
            <div key={entry.id}
              className={`bg-card rounded-2xl border p-4 flex items-center gap-4 ${entry.isMe ? "border-primary/40 bg-primary/5" : "border-border"}`}>
              <div className="w-10 h-10 flex items-center justify-center text-2xl">
                {i < 3 ? MEDAL[i] : <span className="text-lg font-bold text-muted-foreground">#{i + 1}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{entry.name}{entry.isMe && " (you)"}</p>
                <p className="text-xs text-muted-foreground">{entry.sessions} workouts</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold font-heading text-primary">
                  {entry.volume >= 1000 ? `${(entry.volume / 1000).toFixed(1)}t` : `${Math.round(entry.volume)}kg`}
                </p>
                <p className="text-xs text-muted-foreground">total volume</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friends tab */}
      {tab === "friends" && (
        <div className="space-y-4">
          {/* Pending received */}
          {pendingReceived.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Requests ({pendingReceived.length})</p>
              <div className="space-y-2">
                {pendingReceived.map(f => (
                  <div key={f.id} className="bg-card rounded-xl border border-primary/30 p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {(f.requester_name?.[0] || "?").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{f.requester_name || f.requester_email}</p>
                      <p className="text-xs text-muted-foreground">{f.requester_email}</p>
                    </div>
                    <button onClick={() => respond(f.id, "accepted")}
                      className="h-8 w-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center hover:bg-accent/30 transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => respond(f.id, "rejected")}
                      className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accepted */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Friends ({accepted.length})</p>
            {accepted.length === 0 ? (
              <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
                No friends yet. Add some!
              </div>
            ) : (
              <div className="space-y-2">
                {accepted.map(f => {
                  const name = f.requester_email === user?.email ? f.recipient_name : f.requester_name;
                  const email = f.requester_email === user?.email ? f.recipient_email : f.requester_email;
                  return (
                    <div key={f.id} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                        {(name?.[0] || "?").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{name || email}</p>
                        <p className="text-xs text-muted-foreground">{email}</p>
                      </div>
                      <Dumbbell className="w-4 h-4 text-muted-foreground" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending sent */}
          {pendingSent.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sent Requests</p>
              <div className="space-y-2">
                {pendingSent.map(f => (
                  <div key={f.id} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{f.recipient_email}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <button onClick={async () => { await db.entities.Friendship.delete(f.id); load(); }}
                      className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add friends tab */}
      {tab === "add" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-5">
            <p className="font-semibold mb-1">Add by email</p>
            <p className="text-xs text-muted-foreground mb-4">Send a friend request to another user</p>
            <div className="flex gap-2">
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendInvite()}
                placeholder="friend@email.com"
                className="flex-1 h-11 px-3 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary/50" />
              <Button onClick={sendInvite} disabled={inviting || !inviteEmail.trim()} className="h-11 px-5">
                <UserPlus className="w-4 h-4 mr-1" /> Send
              </Button>
            </div>
            {msg && <p className={`text-xs mt-2 ${msg.includes("sent") ? "text-accent" : "text-destructive"}`}>{msg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}