// /components/RecentXP.jsx
import React from "react";

function formatDate(d) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

export default function RecentXP({ logs = [] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-semibold">Recent Activity</h3>
        <span className="text-white/60 text-xs">Last {logs.length} events</span>
      </div>
      <div className="space-y-2">
        {logs.length === 0 ? (
          <div className="text-white/50 text-sm">No activity yet.</div>
        ) : logs.map((log) => (
          <div key={log.id} className="flex items-center justify-between rounded-xl bg-black/30 border border-white/10 px-3 py-2">
            <div className="text-white/90 text-sm">
              <span className="font-medium">{log.actionType}</span>
              {log.refId ? <span className="text-white/50"> · {log.refId}</span> : null}
              <div className="text-[11px] text-white/50">{formatDate(log.createdAt)}</div>
            </div>
            <div className="text-pink-400 font-semibold tabular-nums">+{log.xpValue} XP</div>
          </div>
        ))}
      </div>
    </div>
  );
}
