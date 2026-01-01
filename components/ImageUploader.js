import { useState, useRef } from 'react';
import { getSupabaseClient } from '../utils/supabase/client';

export default function ImageUploader({ userId, onFinished }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public'); // ← Add this
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  const supabase = getSupabaseClient();

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file (jpg, png, gif, webp)');
      return;
    }

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(selectedFile);

    // Auto-fill title from filename
    if (!title) {
      const filename = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(filename);
    }
  };

  const handleUpload = async () => {
    if (!file || !userId) {
      setError('Missing file or user ID');
      return;
    }

    setUploading(true);
    setProgress(10);
    setError(null);

    try {
      // Generate unique storage key
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const fileExt = file.name.split('.').pop();
      const storageKey = `${userId}/${timestamp}-${randomStr}.${fileExt}`;

      setProgress(30);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('creator-images')
        .upload(storageKey, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setProgress(60);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('creator-images')
        .getPublicUrl(storageKey);

      const imageUrl = urlData.publicUrl;

      setProgress(80);

      // Save to database
      const saveRes = await fetch('/api/images/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          url: imageUrl,
          storageKey,
          title: title || file.name,
          description: description || null,
          visibility: visibility, // ← Use selected visibility
        }),
      });

      const saveData = await saveRes.json();

      if (!saveRes.ok) {
        throw new Error(saveData.error || 'Failed to save image metadata');
      }

      setProgress(100);

      // Success! Reset form
      setTimeout(() => {
        setFile(null);
        setPreview(null);
        setTitle('');
        setDescription('');
        setVisibility('public'); // ← Reset visibility
        setProgress(0);
        setUploading(false);
        if (onFinished) onFinished();
      }, 500);

    } catch (err) {
      console.error('[ImageUploader] error', err);
      setError(err.message || 'Upload failed');
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-3">
      {/* File Input */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {!file ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-pink-500/50 transition-colors"
          >
            <div className="text-gray-400 text-sm">
              <p className="mb-1">Click to select an image</p>
              <p className="text-xs text-gray-500">JPG, PNG, GIF, WEBP • Max 10MB</p>
            </div>
          </button>
        ) : (
          <div className="border border-gray-700 rounded-lg overflow-hidden">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-auto max-h-64 object-contain bg-black"  // ← Changed from object-cover to object-contain and h-48 to h-auto max-h-64
            />
            <div className="p-3 bg-gray-900 flex items-center justify-between">
              <span className="text-xs text-gray-400 truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Title Input */}
      {file && (
        <div>
          <label className="block text-xs text-gray-400 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your image a title..."
            className="w-full px-3 py-2 bg-black border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
          />
        </div>
      )}

      {/* Description Input */}
      {file && (
        <div>
          <label className="block text-xs text-gray-400 mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add context, tags, or notes..."
            rows={2}
            className="w-full px-3 py-2 bg-black border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:ring-1 focus:ring-pink-500 resize-none"
          />
        </div>
      )}

      {/* Visibility Selector */}
      {file && (
        <div>
          <label className="block text-xs text-gray-400 mb-1">Visibility</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium border ${
                visibility === 'public'
                  ? 'bg-green-900/20 border-green-500/60 text-green-300'
                  : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-gray-200'
              }`}
            >
              Public
            </button>
            <button
              type="button"
              onClick={() => setVisibility('private')}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium border ${
                visibility === 'private'
                  ? 'bg-red-900/20 border-red-500/60 text-red-300'
                  : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-gray-200'
              }`}
            >
              Private
            </button>
            <button
              type="button"
              onClick={() => setVisibility('unlisted')}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium border ${
                visibility === 'unlisted'
                  ? 'bg-yellow-900/20 border-yellow-500/60 text-yellow-300'
                  : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-gray-200'
              }`}
            >
              Unlisted
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-md text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Progress Bar */}
      {uploading && (
        <div className="space-y-1">
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-pink-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 text-center">Uploading... {progress}%</p>
        </div>
      )}

      {/* Upload Button */}
      {file && !uploading && (
        <button
          type="button"
          onClick={handleUpload}
          className="w-full px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-md text-sm font-medium text-white"
        >
          Upload Image
        </button>
      )}
    </div>
  );
}