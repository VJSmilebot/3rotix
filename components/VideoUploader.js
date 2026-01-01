// components/VideoUploader.js
'use client';

import { useRef, useState } from 'react';
import { Upload } from 'tus-js-client';
import { getSupabaseClient } from '../utils/supabase/client';

async function computeFileSha256(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}


function parseInit(payload) {
  return {
    assetId: payload?.assetId || null,
    tusUrl: payload?.tusUrl || null,
  };
}

export default function VideoUploader({ onFinished }) {
  const supabase = getSupabaseClient();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('idle');
  const uploadRef = useRef(null);

  const startUpload = async () => {
  if (!file) return alert('Pick a file first');

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return alert('You must be logged in.');

  // 0) Hash file BEFORE contacting Livepeer
  setPhase('hashing');
  let fingerprintSha256;
  try {
    fingerprintSha256 = await computeFileSha256(file);
    console.log('[Uploader] computed SHA-256:', fingerprintSha256);
  } catch (err) {
    console.error('[Uploader] hash error', err);
    alert('Could not compute file fingerprint. Please try again.');
    setPhase('error');
    return;
  }

  // 1) Ask our server for Livepeer upload info
  setPhase('requesting');
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
    alert(`Upload init failed (${res.status}): ${initPayload.error || 'unknown'}`);
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

  // 2) Insert a "pending" row using Prisma API
  setPhase('saving');
  const saveRes = await fetch('/api/videos/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      assetId,
      title: title || file.name,
      visibility,
      fingerprintSha256,    // 👈 NEW
    }),
  });

  if (!saveRes.ok) {
    const errData = await saveRes.json();
    console.error('[Uploader] create video error', errData);
    alert(`Could not save video: ${errData.error}`);
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
        setPhase('processing');
        await pollUntilReadyAndUpdate(assetId);
      },
    });
    uploadRef.current = upload;
    upload.start();
  };

  const pollUntilReadyAndUpdate = async (assetId) => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let i = 0; i < 60; i++) {
      try {
        const r = await fetch(`/api/livepeer/asset/${assetId}`);
        const j = await r.json();
        const status = j?.status;
        const playbackId = j?.playbackId;

        console.log(`[Poll ${i+1}/60] Status: ${status}, PlaybackId: ${playbackId}`);

        // Check for ready status - Livepeer uses 'ready' when processing is complete
        if (status === 'ready' && playbackId) {
          // Update via Prisma API
          await fetch('/api/videos/update-playback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assetId, playbackId }),
          });

          setPhase('done');
          if (onFinished) onFinished();
          return;
        }

        // If it's still uploading/waiting/processing, continue polling
        if (status === 'uploading' || status === 'waiting' || status === 'processing') {
          await sleep(5000); // Wait 5 seconds between polls (changed from 3s)
          continue;
        }

        // If status is something else (error, failed, etc), stop
        if (status === 'error' || status === 'failed') {
          setPhase('error');
          alert(`Processing failed: ${j.error || 'Unknown error'}`);
          return;
        }

      } catch (e) {
        console.warn('[Uploader] poll error', e);
      }
      await sleep(5000); // Default wait time
    }
    
    // Timeout after 60 attempts × 5 seconds = 5 minutes
    setPhase('error');
    alert('Processing took too long. The video may still be processing. Check back later or refresh the page.');
  };

   return (
    <div className="space-y-4 text-sm text-gray-100">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Upload Video</h2>
        <span className="text-[11px] uppercase tracking-wide text-gray-400">
          {phase}
        </span>
      </div>

      {phase === 'done' && (
        <div className="rounded-md border border-green-600/60 bg-green-900/30 px-3 py-2 text-xs text-green-200">
          Video processing complete!
        </div>
      )}

      {phase === 'error' && (
        <div className="rounded-md border border-red-600/60 bg-red-900/30 px-3 py-2 text-xs text-red-200">
          An error occurred. Please try again.
        </div>
      )}

      <div>
        <label className="block text-xs text-gray-300 mb-1">Video file</label>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full text-xs text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-pink-600 file:text-white hover:file:bg-pink-700"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-300 mb-1">Title</label>
        <input
          type="text"
          placeholder="Video title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-gray-700 bg-gray-900 text-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
        />
      </div>

      <div>
        <span className="block text-xs text-gray-300 mb-1">Visibility</span>
        <div className="flex items-center gap-4 text-xs">
          <label className="inline-flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              value="public"
              checked={visibility === 'public'}
              onChange={(e) => setVisibility(e.target.value)}
              className="accent-pink-500"
            />
            <span>Public</span>
          </label>
          <label className="inline-flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              value="private"
              checked={visibility === 'private'}
              onChange={(e) => setVisibility(e.target.value)}
              className="accent-pink-500"
            />
            <span>Private</span>
          </label>
        </div>
      </div>

      {phase === 'uploading' && (
        <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-pink-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="pt-1">
        <button
          onClick={startUpload}
          disabled={phase !== 'idle'}
          className="w-full inline-flex items-center justify-center rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {phase === 'uploading'
            ? `Uploading… ${progress}%`
            : phase === 'saving'
            ? 'Saving…'
            : phase === 'requesting'
            ? 'Contacting Livepeer…'
            : phase === 'hashing'
            ? 'Hashing file…'
            : 'Start upload'}

        </button>
      </div>
    </div>
  );
}