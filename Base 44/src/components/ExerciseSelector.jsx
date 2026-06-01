const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";

import { Input } from "@/components/ui/input";
import { Search, Plus, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ExerciseDetailModal from "@/components/ExerciseDetailModal";

export default function ExerciseSelector({ open, onClose, onSelect }) {
  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailExercise, setDetailExercise] = useState(null);

  useEffect(() => {
    if (open) {
      db.entities.Exercise.list("name", 200).then(ex => {
        setExercises(ex);
        setLoading(false);
      });
    }
  }, [open]);

  const filtered = exercises.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.muscle_group.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, e) => {
    const g = e.muscle_group;
    if (!acc[g]) acc[g] = [];
    acc[g].push(e);
    return acc;
  }, {});

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="bg-card border-border max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Exercise</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search exercises..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-secondary border-border" />
          </div>
          <div className="overflow-y-auto flex-1 space-y-4 mt-2">
            {loading ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Loading exercises...</p>
            ) : Object.entries(grouped).map(([group, exs]) => (
              <div key={group}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 capitalize">{group}</p>
                <div className="space-y-1">
                  {exs.map(e => (
                    <div key={e.id} className="flex items-center rounded-lg hover:bg-secondary transition-colors group">
                      <button onClick={() => { onSelect(e); onClose(); }}
                        className="flex-1 text-left px-3 py-2.5">
                        <p className="text-sm font-medium">{e.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{e.equipment || e.category}</p>
                      </button>
                      <button onClick={() => setDetailExercise(e)}
                        className="px-3 py-2.5 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!loading && filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">No exercises found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ExerciseDetailModal
        exercise={detailExercise}
        onClose={() => setDetailExercise(null)}
        onAdd={(e) => { onSelect(e); onClose(); }}
      />
    </>
  );
}