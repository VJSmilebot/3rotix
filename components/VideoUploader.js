// components/VideoUploader.js
'use client';

import { useRef, useState } from 'react';
import { Upload } from 'tus-js-client';
import { getSupabaseClient } from '../utils/supabase/client';

function parseInit(payload) {
  // Normalize the request-upload response we get from our API
  return {
    assetId: payload?.assetId || null,
    tusUrl: payload?.tusUrl || null,
  };
}

export default function VideoUploader({ onFinished }) {
  const supabase = getSupabaseClient();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState('public'); // 'public' | 'private'
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | requesting | saving | uploading | processing | done | error
  const uploadRef = useRef(null);

  const startUpload = async () => {
    if (!file) return alert('Pick a file first');

    // Make sure user is logged in
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return alert('You must be logged in.');

    setPhase('requesting');

    // 1) Ask our server for Livepeer upload info
    const res = await fetch('/api/livepeer/request-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: title || file.name,
        playbackPolicy: visibility === 'private' ? 'jwt' : 'public',
      }),
    });

    const initPayload = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[Uploader] init failed', res.status, initPayload);
      alert(`Upload init failed (${res.status}): ${initPayload.error || 'unknown'}\n${initPayload.body || initPayload.detail || initPayload.hint || ''}`);
      setPhase('error');
      return;
    }

    const { assetId, tusUrl } = parseInit(initPayload);
    if (!assetId || !tusUrl) {
      console.error('[Uploader] unexpected init payload', initPayload);
      alert('Unexpected response from Livepeer (no assetId/tusUrl).');
      setPhase('error');
      return;
    }

    // 2) Insert a "pending" row immediately with the CORRECT asset_id
    setPhase('saving');
    const { error: insErr } = await supabase.from('videos').insert({
      user_id: user.id,
      asset_id: assetId,
      playback_id: null,
      title: title || file.name,
      description: null,
      visibility, // 'public' or 'private'
    });
    if (insErr) {
      console.error('[Uploader] supabase insert error', insErr);
      alert(`Could not save DB row: ${insErr.message}`);
      setPhase('error');
      return;
    }

    // 3) Upload the file to Livepeer via tus
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
        // 4) After upload completes, poll asset until "ready",
        //    then update the row with playback_id
        setPhase('processing');
        await pollUntilReadyAndUpdate(assetId);
      },
    });
    uploadRef.current = upload;
    upload.start();
  };

  const pollUntilReadyAndUpdate = async (assetId) => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let i = 0; i < 60; i++) { // up to ~3 minutes
      try {
        const r = await fetch(`/api/livepeer/asset/${assetId}`);
        const j = await r.json();
        const status = j?.status; // expect 'ready'
        const playbackId =
          j?.playbackId ||
          j?.asset?.playbackId ||
          j?.asset?.playback?.id ||
          null;

        if (status === 'ready' && playbackId) {
          const { error: updErr } = await supabase
            .from('videos')
            .update({ playback_id: playbackId })
            .eq('asset_id', assetId);

          if (updErr) console.error('[Uploader] update error', updErr);

          setPhase('done');
          if (onFinished) onFinished(); // let parent refresh the list
          return;
        }
      } catch (e) {
        console.warn('[Uploader] poll error', e);
      }
      await sleep(3000);
    }
    setPhase('error');
    alert('Processing took too long. Refresh later to check status.');
  };

  const disabled = ['requesting', 'saving', 'uploading', 'processing', 'done'].includes(phase);

  const field = {
    width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: 8,
    background: '#fff', color: '#000', marginBottom: 10,
  };

  return (
    <div style={{ border: '1px solid #2a2a2a', borderRadius: 12, padding: 14 }}>
      <h3 style={{ marginTop: 0 }}>Upload a video</h3>

      <input
        style={field}
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={disabled}
      />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={disabled}
        />
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          disabled={disabled}
          style={{ ...field, width: 180, marginBottom: 0 }}
        >
          <option value="public">Public</option>
          <option value="private">Private (JWT‑gated)</option>
        </select>
        <button onClick={startUpload} disabled={!file || disabled}>
          {phase === 'requesting' ? 'Starting…'
            : phase === 'saving' ? 'Saving…'
            : phase === 'uploading' ? `Uploading… ${progress}%`
            : phase === 'processing' ? 'Processing…'
            : 'Start upload'}
        </button>
      </div>

      {phase === 'uploading' && (
        <div style={{ height: 8, background: '#333', borderRadius: 4, overflow: 'hidden', marginTop: 10 }}>
          <div style={{ width: `${progress}%`, height: '100%', background: '#22c55e' }} />
        </div>
      )}
    </div>
  );
}
