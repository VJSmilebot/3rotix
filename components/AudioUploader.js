// components/AudioUploader.js
'use client';

import { useRef, useState } from 'react';
import { Upload } from 'tus-js-client';
import { getSupabaseClient } from '../utils/supabase/client';

function parseInit(payload) {
  return {
    assetId: payload?.assetId || null,
    tusUrl: payload?.tusUrl || null,
  };
}

export default function AudioUploader({ userId: userIdProp, onFinished }) {
  const supabase = getSupabaseClient();

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState('public'); // 'public' | 'private'
  const [phase, setPhase] = useState('idle'); // idle | requesting | saving | uploading | polling | done | error
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const uploadRef = useRef(null);

  const reset = () => {
    setFile(null);
    setTitle('');
    setVisibility('public');
    setPhase('idle');
    setProgress(0);
    setErrorMsg('');
    uploadRef.current = null;
  };

  const startUpload = async () => {
    try {
      setErrorMsg('');

      if (!file) {
        alert('Pick an audio file first.');
        return;
      }

      if (!title.trim()) {
        alert('Add a title for this audio drop.');
        return;
      }

      // 0) Resolve userId: prefer prop, fall back to supabase auth
      let userId = userIdProp || null;

      if (!userId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('You must be logged in to upload.');
        }

        userId = user.id;
      }

      // 1) Ask our API for a Livepeer upload slot
      setPhase('requesting');

      const reqRes = await fetch('/api/livepeer/request-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: title || file.name,
          playbackPolicy: visibility === 'private' ? 'jwt' : 'public',
        }),
      });

      const reqJson = await reqRes.json();
      if (!reqRes.ok) {
        console.error('[AudioUploader] request-upload error:', reqJson);
        throw new Error(reqJson.error || 'Failed to request upload slot from Livepeer');
      }

      const { assetId, tusUrl } = parseInit(reqJson);
      if (!assetId || !tusUrl) {
        console.error('[AudioUploader] unexpected init payload', reqJson);
        throw new Error('Unexpected response from Livepeer (no assetId/tusUrl).');
      }

      // 2) Insert pending row in Audio table
      setPhase('saving');

      const saveRes = await fetch('/api/audio/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          assetId,
          title: title || file.name,
          visibility,
        }),
      });

      const saveJson = await saveRes.json();
      if (!saveRes.ok) {
        console.error('[AudioUploader] /api/audio/create error:', saveJson);
        throw new Error(saveJson.error || 'Could not save audio record.');
      }

      // 3) Upload the actual file via tus
      setPhase('uploading');
      setProgress(0);

      await new Promise((resolve, reject) => {
        const upload = new Upload(file, {
          endpoint: tusUrl,
          retryDelays: [0, 3000, 5000, 10000],
          metadata: {
            filename: file.name,
            filetype: file.type || 'audio/mpeg',
            assetId,
          },
          onError(err) {
            console.error('[AudioUploader] tus error:', err);
            reject(err);
          },
          onProgress(bytesUploaded, bytesTotal) {
            if (!bytesTotal) return;
            const pct = Math.round((bytesUploaded / bytesTotal) * 100);
            setProgress(pct);
          },
          async onSuccess() {
            resolve();
          },
        });

        uploadRef.current = upload;
        upload.start();
      });

      // 4) Poll Livepeer asset until it’s ready & has a playbackId
      setPhase('polling');

      let playbackId = null;
      const maxTries = 30;
      const delayMs = 4000;

      for (let i = 0; i < maxTries; i++) {
        const statusRes = await fetch(`/api/livepeer/asset/${assetId}`);
        const statusJson = await statusRes.json();

        if (!statusRes.ok) {
          console.error('[AudioUploader] asset status error:', statusJson);
          throw new Error(statusJson.error || 'Failed checking asset status.');
        }

        const phaseStatus =
          statusJson.status ||
          statusJson.asset?.status?.phase ||
          statusJson.asset?.status?.phase;

        playbackId =
          statusJson.playbackId ||
          statusJson.asset?.playbackId ||
          statusJson.asset?.playback?.id ||
          null;

        console.log('[AudioUploader] poll', i, phaseStatus, playbackId);

        if (phaseStatus === 'ready' && playbackId) {
          break;
        }

        await new Promise((r) => setTimeout(r, delayMs));
      }

      if (playbackId) {
        // 5) Update Audio row with playbackId
        const updRes = await fetch('/api/audio/update-playback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assetId, playbackId }),
        });

        const updJson = await updRes.json();
        if (!updRes.ok) {
          console.error('[AudioUploader] /api/audio/update-playback error:', updJson);
          throw new Error(updJson.error || 'Failed to update playbackId.');
        }
      } else {
        console.warn('[AudioUploader] Asset never reported playbackId; continuing anyway');
      }

      setPhase('done');
      if (onFinished) onFinished();
      reset();
    } catch (err) {
      console.error('[AudioUploader] error:', err);
      setPhase('error');
      setErrorMsg(err.message || 'Something went wrong during upload.');
    }
  };

  const disabled = phase !== 'idle';

  return (
    <div className="space-y-4 text-sm">
      {errorMsg && (
        <div className="rounded-md border border-red-500/60 bg-red-900/30 px-3 py-2 text-xs text-red-200">
          {errorMsg || 'An error occurred. Please try again.'}
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-xs text-gray-400">Audio file</label>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-xs text-gray-300 file:mr-3 file:rounded-md file:border-0 file:bg-pink-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-pink-700"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs text-gray-400">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Name this drop"
          className="w-full rounded-md bg-black border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
        />
      </div>

      <div className="space-y-1">
        <span className="block text-xs text-gray-400 mb-1">Visibility</span>
        <div className="flex gap-4 text-xs text-gray-300">
          <label className="inline-flex items-center gap-1">
            <input
              type="radio"
              name="audio-visibility"
              value="public"
              checked={visibility === 'public'}
              onChange={(e) => setVisibility(e.target.value)}
              className="h-3 w-3 text-pink-500 focus:ring-pink-500 border-gray-600 bg-black"
            />
            Public
          </label>
          <label className="inline-flex items-center gap-1">
            <input
              type="radio"
              name="audio-visibility"
              value="private"
              checked={visibility === 'private'}
              onChange={(e) => setVisibility(e.target.value)}
              className="h-3 w-3 text-pink-500 focus:ring-pink-500 border-gray-600 bg-black"
            />
            Private
          </label>
        </div>
      </div>

      {phase === 'uploading' && (
        <div className="mt-2">
          <div className="flex justify-between text-[11px] text-gray-400 mb-1">
            <span>Uploading audio…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-pink-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {phase === 'polling' && (
        <p className="text-[11px] text-gray-400">
          Finalizing with Livepeer… waiting for playback to be ready.
        </p>
      )}

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={startUpload}
          disabled={disabled}
          className="inline-flex items-center justify-center rounded-md bg-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-pink-500/30 hover:bg-pink-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {phase === 'uploading'
            ? `Uploading… ${progress}%`
            : phase === 'saving'
            ? 'Saving…'
            : phase === 'requesting'
            ? 'Contacting Livepeer…'
            : phase === 'polling'
            ? 'Finalizing…'
            : 'Start upload'}
        </button>
      </div>
    </div>
  );
}
