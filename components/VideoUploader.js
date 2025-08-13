// components/VideoUploader.js
'use client';

import { useEffect, useRef, useState } from 'react';
import { getSupabaseClient } from '../utils/supabase/client';
import { Upload } from 'tus-js-client';

export default function VideoUploader({ onFinished }) {
  const supabase = getSupabaseClient();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState('public'); // or 'private'
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | requesting | uploading | processing | saving | done | error
  const uploadRef = useRef(null);

  const startUpload = async () => {
    if (!file) return alert('Pick a file first');
    setPhase('requesting');
    setProgress(0);

    // 1) ask our server for a tus endpoint + assetId
    const res = await fetch('/api/livepeer/request-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: title || file.name,
        playbackPolicy: visibility === 'private' ? 'jwt' : 'public',
      }),
    });
    const { assetId, tusUrl, error } = await res.json();
    if (!res.ok || error) {
      setPhase('error');
      return alert(`Upload init failed: ${error || res.statusText}`);
    }

    // 2) use tus to upload directly to Livepeer
    setPhase('uploading');
    const upload = new Upload(file, {
      endpoint: tusUrl,
      metadata: { filename: file.name, filetype: file.type },
      onError(err) {
        console.error('tus error', err);
        setPhase('error');
        alert('Upload failed. Try again.');
      },
      onProgress(bytesUploaded, bytesTotal) {
        setProgress(Math.round((bytesUploaded / bytesTotal) * 100));
      },
      onSuccess() {
        // 3) poll asset status until ready
        setPhase('processing');
        pollUntilReady(assetId);
      },
    });
    uploadRef.current = upload;
    upload.start();
  };

  const pollUntilReady = async (assetId) => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let i = 0; i < 60; i++) {
      const res = await fetch(`/api/livepeer/asset/${assetId}`);
      const json = await res.json();
      if (json?.status === 'ready') {
        // 4) save row in Supabase videos
        await saveVideoRow({ assetId, playbackId: json.playbackId });
        setPhase('done');
        if (onFinished) onFinished();
        return;
      }
      await sleep(3000); // wait 3s and try again
    }
    setPhase('error');
    alert('Processing took too long. Refresh to check again later.');
  };

  const saveVideoRow = async ({ assetId, playbackId }) => {
    setPhase('saving');
    // ensure user id
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) {
      setPhase('error');
      return alert('You must be logged in.');
    }
    const { error } = await supabase.from('videos').insert({
      user_id: user.id,
      asset_id: assetId,
      playback_id: playbackId,
      title: title || file.name,
      description: null,
      visibility,
    });
    if (error) {
      setPhase('error');
      alert(error.message);
    }
  };

  const disabled = phase === 'requesting' || phase === 'uploading' || phase === 'processing' || phase === 'saving';

  const input = {
    width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: 8,
    background: '#fff', color: '#000', marginBottom: 10,
  };

  return (
    <div style={{ border: '1px solid #2a2a2a', borderRadius: 12, padding: 14 }}>
      <h3 style={{ marginTop: 0 }}>Upload a video</h3>

      <input
        style={input}
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={disabled}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} disabled={disabled} style={{ ...input, width: 160, marginBottom: 0 }}>
            <option value="public">Public</option>
            <option value="private">Private (JWT‑gated)</option>
          </select>
        </label>
        <button onClick={startUpload} disabled={!file || disabled}>
          {phase === 'uploading' ? `Uploading… ${progress}%` :
           phase === 'processing' ? 'Processing…' :
           phase === 'saving' ? 'Saving…' :
           'Start upload'}
        </button>
      </div>

      {phase === 'uploading' && (
        <div style={{ height: 8, background: '#333', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: '#22c55e' }} />
        </div>
      )}
    </div>
  );
}
