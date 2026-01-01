// components/MissionCard.tsx
// ------------------------------------------------------
import React from "react";
 type Props = { title: string; rewardXp: number; cta: string; onAction?: () => void };
 export const MissionCard: React.FC<Props> = ({ title, rewardXp, cta, onAction }) => (
 <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
 <div className="text-white font-semibold">{title}</div>
 <div className="text-white/70 text-sm mt-1">Reward: {rewardXp} XP</div>
 <button onClick={onAction} className="mt-3 px-4 py-2 rounded-xl bg-pink-500 text-white">{cta}</button>
 </div>
 );