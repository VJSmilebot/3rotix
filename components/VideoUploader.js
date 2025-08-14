// components/VideoUploader.js
'use client';

import { useRef, useState } from 'react';
import { getSupabaseClient } from '../utils/supabase/client';
import { Upload } from 'tus-js-client';

function parseRequestUpload(json) {
  // Different Studio accounts/versions sometimes nest differently.
  // Try several paths for safety.
  const assetId =
    json?.asset?.id ||
    json?.asset?.assetId ||
    json?.id ||
    json?.task?.outputAssetId ||
    null;

  const tusUrl =
    json?.tusEndpoint ||
    json?.tus?.url ||
    json?.upload?.tusEndpoint ||
    null;

  return { assetId, tusUrl };
}

export default function VideoUploader({ onFinished }) {
  const supabase = getSupabaseClient();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState('public'); // 'public' | 'private'
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | requesting | uploading | processing | saving | done | error
  const uploadRef = useRef(null);

  const startUpload = async () => {
    if (!file) return alert('Pick a file first');
    setPhase('requesting');
    setProgress(0);

    // 0) get current user id (so we can insert a row early)
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return alert('You must be logged in.');

    // 1) ask our server for a tus endpoint + assetId
    const res = await fetch('/api/livepeer/request-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: title || file.name,
        playbackPolicy: visibility === 'private' ? 'jwt' : 'public',
      }),
    });

    const raw = await res.json().catch(() => ({}));
    if (!res.ok || raw?.error) {
      console.error('[Uploader] init error:', res.status, raw);
      setPhase('error');
      return alert(`Upload init failed: ${raw?.error || res.statusText}`);
    }

    const { assetId, tusUrl } = parseRequestUpload(raw);
    if (!assetId || !tusUrl) {
      console.error('[Uploader] unexpected init payload:', raw);
      setPhase('error');
      return alert('Unexpected response from Livepeer (no assetId/tusUrl).');
    }

    // 2) Insert a "pending" row immediately (no playback_id yet)
    //    So it shows up in your list as "Processing…"
    setPhase('saving');
    const { error: insertErr } = await supabase.from('videos').insert({
      user_id: user.id,
      asset_id: assetId,
      playback_id: null,             // will be filled in later
      title: title || file.name,
      description: null,
      visibility,
    });
    if (insertErr) {
      console.error('[Uploader] supabase insert error:', insertErr);
      setPhase('error');
      return alert('Could not save video row. Check policies / table.');
    }

    // 3) use tus to upload directly to Livepeer
    setPhase('uploading');
    const upload = new Upload(file, {
      endpoint: tusUrl,
      metadata: { filename: file.name, filetype: file.type },
      onError(err) {
        console.error('[Uploader] tus error', err);
        setPhase('error');
        alert('Upload failed. Try again.');
      },
      onProgress(bytesUploaded, bytesTotal) {
        setProgress(Math.round((bytesUploaded / bytesTotal) * 100));
      },
      async onSuccess() {
        // 4) poll asset status until ready, then update playback_id
        setPhase('processing');
        await pollUntilReadyAndUpdate(assetId);
      },
    });
    uploadRef.current = upload;
    upload.start();
  };

  const pollUntilReadyAndUpdate = async (assetId) => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let i = 0; i < 80; i++) {
      try {
        const res = await fetch(`/api/livepeer/asset/${assetId}`);
        const json = await res.json();

        const status = json?.status; // expect 'ready'
        const playbackId =
          json?.playbackId ||
          json?.asset?.playbackId ||
          json?.asset?.playback?.id ||
          null;

        if (status === 'ready' && playbackId) {
          // Update the row to fill in playback_id
          setPhase('saving');
          const { error } = await supabase
            .from('videos')
            .update({ playback_id: playbackId })
            .eq('asset_id', assetId);
          if (error) {
            console.error('[Uploader] supabase update error:', error);
          }
          setPhase('done');
          if (onFinished) onFinished();
          return;
        }
      } catch (e) {
        console.error('[Uploader] poll error:', e);
      }
      await sleep(3000); // 3s
    }
    setPhase('error');
    alert('Processing took too long. Refresh later to check status.');
  };

  const disabled =
    phase === 'requesting' ||
    phase === 'uploading' ||
    phase === 'processing' ||
    phase === 'saving';

  const input = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: 8,
    background: '#fff',
    color: '#000',
    marginBottom: 10,
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
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            disabled={disabled}
            style={{ ...input, width: 180, marginBottom: 0 }}
          >
            <option value="public">Public</option>
            <option value="private">Private (JWT‑gated)</option>
          </select>
        </label>
        <button onClick={startUpload} disabled={!file || disabled}>
          {phase === 'uploading'
            ? `Uploading… ${progress}%`
            : phase === 'processing'
            ? 'Processing…'
            : phase === 'saving'
            ? 'Saving…'
            : 'Start upload'}
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
