import { useState } from 'react';
import { getSupabaseClient } from '../utils/supabase/client';

export default function TestStoragePage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const supabase = getSupabaseClient();

  async function handleUpload() {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not logged in');
      }

      const fileName = `${user.id}/test-${Date.now()}-${file.name}`;

      // Upload file
      const { data, error: uploadError } = await supabase.storage
        .from('messages')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('messages')
        .getPublicUrl(fileName);

      setResult({
        uploadData: data,
        publicUrl,
        fileName,
      });

      console.log('✅ Upload successful!', { data, publicUrl });
    } catch (err) {
      console.error('❌ Upload failed:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!result?.fileName) return;

    try {
      const { error: deleteError } = await supabase.storage
        .from('messages')
        .remove([result.fileName]);

      if (deleteError) {
        throw deleteError;
      }

      alert('✅ File deleted successfully!');
      setResult(null);
      setFile(null);
    } catch (err) {
      alert('❌ Delete failed: ' + err.message);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 Storage Test Page</h1>

        {/* File Input */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Upload Test</h2>
          
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-sm text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-bold
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-700 file:cursor-pointer"
          />

          {file && (
            <div className="mt-4 text-sm text-gray-400">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-600/20 border border-red-600 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-red-400 mb-2">❌ Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Success Display */}
        {result && (
          <div className="bg-green-600/20 border border-green-600 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-green-400 mb-4">✅ Upload Successful!</h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <strong>File Path:</strong>
                <code className="block bg-black p-2 rounded mt-1 text-xs">
                  {result.fileName}
                </code>
              </div>

              <div>
                <strong>Public URL:</strong>
                <a
                  href={result.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-black p-2 rounded mt-1 text-xs text-blue-400 hover:underline break-all"
                >
                  {result.publicUrl}
                </a>
              </div>

              {result.publicUrl.includes('image') && (
                <div>
                  <strong>Preview:</strong>
                  <img
                    src={result.publicUrl}
                    alt="Uploaded"
                    className="mt-2 max-w-md rounded-lg"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleDelete}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold"
            >
              Delete File
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-6">
          <h3 className="font-bold text-blue-400 mb-3">📋 What this tests:</h3>
          <ul className="space-y-2 text-sm">
            <li>✅ File upload to "messages" bucket</li>
            <li>✅ Public URL generation</li>
            <li>✅ File deletion (cleanup)</li>
            <li>✅ Authentication with storage policies</li>
          </ul>

          <p className="mt-4 text-xs text-gray-500">
            💡 Make sure you're logged in before testing!
          </p>
        </div>
      </div>
    </div>
  );
}