'use client';
import { useState } from 'react';

export default function CopyField({ label, value, masked=false }) {
  const [copied, setCopied] = useState(false);
  const text = value || '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="w-full">
      <label className="block text-sm text-white/80 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white/90 truncate">
          {masked ? '•'.repeat(Math.min(16, text.length || 0)) : text || '—'}
        </div>
        <button
          onClick={copy}
          className="shrink-0 rounded-lg px-3 py-2 bg-pink-600 hover:bg-pink-500 text-white text-sm transition"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
