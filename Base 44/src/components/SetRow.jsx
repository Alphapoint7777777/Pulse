import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Trophy } from "lucide-react";

export default function SetRow({ set, index, onChange, onDelete }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-6 text-center font-mono">{index + 1}</span>
      <Input type="number" placeholder="kg" value={set.weight || ""} onChange={e => onChange({ ...set, weight: e.target.value })}
        className="flex-1 h-9 bg-secondary border-border text-center text-sm" />
      <span className="text-muted-foreground text-xs">×</span>
      <Input type="number" placeholder="reps" value={set.reps || ""} onChange={e => onChange({ ...set, reps: e.target.value })}
        className="flex-1 h-9 bg-secondary border-border text-center text-sm" />
      {set.is_pr && <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />}
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}>
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}