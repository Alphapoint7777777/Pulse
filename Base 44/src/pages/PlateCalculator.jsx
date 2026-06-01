import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PLATE_COLORS = {
  25: "bg-red-500",
  20: "bg-blue-500",
  15: "bg-yellow-400",
  10: "bg-green-500",
  5: "bg-white",
  2.5: "bg-slate-400",
  1.25: "bg-slate-600",
};

const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

function calculatePlates(targetKg, barWeight) {
  let remaining = (targetKg - barWeight) / 2;
  const result = [];
  for (const plate of PLATES) {
    const count = Math.floor(remaining / plate);
    if (count > 0) {
      result.push({ weight: plate, count });
      remaining -= count * plate;
      remaining = Math.round(remaining * 1000) / 1000;
    }
  }
  return result;
}

export default function PlateCalculator() {
  const navigate = useNavigate();
  const [target, setTarget] = useState("");
  const [barWeight, setBarWeight] = useState(20);
  const [unit, setUnit] = useState("kg");

  const targetNum = parseFloat(target) || 0;
  const barW = parseFloat(barWeight) || 20;
  const plates = targetNum > barW ? calculatePlates(targetNum, barW) : [];
  const actualTotal = barW + plates.reduce((sum, p) => sum + p.weight * p.count * 2, 0);

  const commonWeights = [60, 80, 100, 120, 140, 160];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-heading font-bold">Plate Calculator</h1>
      </div>

      {/* Bar weight selector */}
      <div className="bg-card rounded-2xl border border-border p-4 mb-4">
        <p className="text-sm text-muted-foreground mb-3">Bar Weight</p>
        <div className="flex gap-2">
          {[15, 20].map(w => (
            <button key={w} onClick={() => setBarWeight(w)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${barWeight === w ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground"}`}>
              {w}kg Standard {w === 20 ? "(Olympic)" : ""}
            </button>
          ))}
          <input type="number" value={barWeight} onChange={e => setBarWeight(e.target.value)}
            className="w-20 text-center bg-secondary border border-border rounded-xl text-sm font-mono outline-none focus:border-primary/50 px-2"
            placeholder="kg" />
        </div>
      </div>

      {/* Target weight input */}
      <div className="bg-card rounded-2xl border border-border p-4 mb-4">
        <p className="text-sm text-muted-foreground mb-3">Target Weight ({unit})</p>
        <div className="flex gap-2 items-center mb-3">
          <input
            type="number"
            value={target}
            onChange={e => setTarget(e.target.value)}
            placeholder="e.g. 100"
            className="flex-1 h-14 text-center text-2xl font-heading font-bold bg-secondary border border-border rounded-xl outline-none focus:border-primary/50"
          />
          <div className="flex flex-col gap-1">
            {["kg", "lbs"].map(u => (
              <button key={u} onClick={() => setUnit(u)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${unit === u ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground"}`}>
                {u}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {commonWeights.map(w => (
            <button key={w} onClick={() => setTarget(w)}
              className="px-3 py-1.5 bg-secondary rounded-lg text-xs font-mono text-muted-foreground hover:text-foreground border border-border hover:border-primary/40 transition-all">
              {w}kg
            </button>
          ))}
        </div>
      </div>

      {/* Barbell visualization */}
      {plates.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">Load Per Side</p>
            <span className="text-xs text-muted-foreground">Total: {actualTotal}kg</span>
          </div>

          {/* Visual barbell */}
          <div className="flex items-center justify-center gap-0.5 mb-5 overflow-x-auto py-2">
            {/* Left plates (mirrored) */}
            {[...plates].reverse().map((p, i) =>
              Array(p.count).fill(0).map((_, j) => {
                const h = Math.max(32, Math.min(72, p.weight * 2 + 20));
                return (
                  <div key={`l-${i}-${j}`}
                    className={`${PLATE_COLORS[p.weight] || "bg-slate-500"} rounded-sm border border-black/20 flex items-center justify-center`}
                    style={{ width: 14, height: h }}>
                  </div>
                );
              })
            )}
            {/* Bar */}
            <div className="h-4 w-16 bg-slate-400 rounded-full border border-slate-500 shrink-0" />
            <div className="h-6 w-8 bg-slate-500 rounded border border-slate-600 flex items-center justify-center shrink-0">
              <span className="text-[9px] font-bold text-white">{barW}</span>
            </div>
            <div className="h-4 w-16 bg-slate-400 rounded-full border border-slate-500 shrink-0" />
            {/* Right plates */}
            {plates.map((p, i) =>
              Array(p.count).fill(0).map((_, j) => {
                const h = Math.max(32, Math.min(72, p.weight * 2 + 20));
                return (
                  <div key={`r-${i}-${j}`}
                    className={`${PLATE_COLORS[p.weight] || "bg-slate-500"} rounded-sm border border-black/20`}
                    style={{ width: 14, height: h }} />
                );
              })
            )}
          </div>

          {/* Plate list */}
          <div className="space-y-2">
            {plates.map(p => (
              <div key={p.weight} className="flex items-center gap-3 p-2.5 bg-secondary rounded-xl border border-border">
                <div className={`w-8 h-8 rounded-lg ${PLATE_COLORS[p.weight] || "bg-slate-500"} border border-black/20`} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{p.weight}kg plates</p>
                  <p className="text-xs text-muted-foreground">{p.count * 2} total ({p.count} per side)</p>
                </div>
                <span className="text-sm font-mono font-bold text-primary">×{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {targetNum > 0 && targetNum <= barW && (
        <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
          Target weight must be greater than bar weight ({barW}kg)
        </div>
      )}

      {!target && (
        <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
          Enter a target weight to calculate plate setup
        </div>
      )}
    </div>
  );
}