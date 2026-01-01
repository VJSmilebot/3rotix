// components/ImpactBar.jsx or .tsx
import { useEffect, useState } from "react";

export default function ImpactBar() {
  const [month,setMonth]=useState(0);
  const [allTime,setAllTime]=useState(0);
  useEffect(()=>{ fetch("/api/impact").then(r=>r.json()).then(d=>{setMonth(d.month||0);setAllTime(d.allTime||0);}); },[]);
  const goal=100000; const pct=Math.min(100,Math.round((month/goal)*100));
  return(
    <a href="/impact" target="_blank" rel="noopener noreferrer" className="block w-full">
      <div className="px-4 py-2 bg-black/70 border border-white/10 rounded-xl">
        <div className="flex items-center justify-between text-sm text-white/80">
          <span>Community Impact</span><span>{pct}% of monthly goal</span>
        </div>
        <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-pink-500" style={{width:`${pct}%`}}/>
        </div>
        <div className="mt-1 text-xs text-white/60">
          This month: {month.toLocaleString()} XP • All-time: {allTime.toLocaleString()} XP
        </div>
      </div>
    </a>
  );
}
    