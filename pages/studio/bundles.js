import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../utils/supabase/client';
import Head from 'next/head';

export default function ManageBundles() {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [user, setUser] = useState(null);

  const supabase = getSupabaseClient();

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        loadBundles(session.user.id);
      } else {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function loadBundles(userId) {
    setLoading(true);
    try {
      const res = await fetch(`/api/bundles/by-creator/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setBundles(data);
      }
    } catch (err) {
      console.error('Error loading bundles:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Please log in to manage bundles.</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Manage Bundles - 3rotix</title>
      </Head>

      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">My Bundles</h1>
              <p className="text-gray-400 mt-1">Create and manage your content bundles</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-pink-600 hover:bg-pink-700 rounded-lg font-bold transition-all shadow-lg shadow-pink-500/30"
            >
              + Create Bundle
            </button>
          </div>

          {/* Bundles Grid */}
          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading bundles...</div>
          ) : bundles.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 mb-4">You haven't created any bundles yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-pink-600 hover:bg-pink-700 rounded-lg font-bold transition-all"
              >
                Create Your First Bundle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bundles.map((bundle) => (
                <BundleCard key={bundle.id} bundle={bundle} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Bundle Modal */}
      {showCreateModal && (
        <CreateBundleModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadBundles(user.id);
          }}
        />
      )}
    </>
  );
}

function BundleCard({ bundle }) {
  return (
    <div className="bg-[#0f0f0f] border border-gray-800 rounded-xl overflow-hidden hover:border-pink-600/30 transition-all">
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-pink-900/20 to-purple-900/20">
        {bundle.coverImage ? (
          <img
            src={bundle.coverImage}
            alt={bundle.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-6xl">
            📦
          </div>
        )}
        <div className="absolute top-3 right-3 px-3 py-1 bg-pink-600 rounded-full text-xs font-bold">
          {bundle.price} Lipz
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1">{bundle.title}</h3>
        {bundle.description && (
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{bundle.description}</p>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-500">
            {bundle.items?.length || 0} items • {bundle._count?.purchases || 0} sales
          </div>
          <div className={`px-2 py-1 rounded text-xs font-bold ${
            bundle.isActive ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'
          }`}>
            {bundle.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateBundleModal({ onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(50);
  const [type, setType] = useState('PHOTOSET');
  const [selectedItems, setSelectedItems] = useState([]);
  const [availableMedia, setAvailableMedia] = useState({ videos: [], images: [], audio: [] });
  const [loading, setLoading] = useState(false);
  const [mediaTab, setMediaTab] = useState('images');

  const supabase = getSupabaseClient();

  useEffect(() => {
    loadAvailableMedia();
  }, []);

  async function loadAvailableMedia() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [videosRes, imagesRes, audioRes] = await Promise.all([
        fetch(`/api/videos?userId=${session.user.id}`),
        fetch(`/api/images?userId=${session.user.id}`),
        fetch(`/api/audio?userId=${session.user.id}`),
      ]);

      const [videos, images, audio] = await Promise.all([
        videosRes.json(),
        imagesRes.json(),
        audioRes.json(),
      ]);

      setAvailableMedia({ videos: videos || [], images: images || [], audio: audio || [] });
    } catch (err) {
      console.error('Error loading media:', err);
    }
  }

  function toggleItem(mediaType, mediaId) {
    const exists = selectedItems.find(
      (item) => item.mediaType === mediaType && item.mediaId === mediaId
    );

    if (exists) {
      setSelectedItems(selectedItems.filter(
        (item) => !(item.mediaType === mediaType && item.mediaId === mediaId)
      ));
    } else {
      setSelectedItems([...selectedItems, { mediaType, mediaId }]);
    }
  }

  async function handleCreate() {
    if (!title || !price || selectedItems.length === 0) {
      return alert('Please fill in title, price, and select at least one item');
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in');
        return;
      }

      const res = await fetch('/api/bundles/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title,
          description,
          price: parseInt(price),
          type,
          items: selectedItems,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create bundle');
      }

      alert('Bundle created successfully! 🎉');
      onSuccess();
    } catch (err) {
      console.error('Error creating bundle:', err);
      alert(err.message || 'Failed to create bundle');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111] border border-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Create New Bundle</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Bundle Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Beach Photoshoot Collection"
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-pink-600 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what's included..."
              rows={3}
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-pink-600 outline-none resize-none"
            />
          </div>

          {/* Price & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Price (Lipz)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="1"
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-pink-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-pink-600 outline-none"
              >
                <option value="PHOTOSET">Photoset</option>
                <option value="VIDEO_PACK">Video Pack</option>
                <option value="MIXED">Mixed</option>
              </select>
            </div>
          </div>

          {/* Select Items */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Items ({selectedItems.length} selected)
            </label>

            {/* Media Type Tabs */}
            <div className="flex gap-2 mb-4">
              {['images', 'videos', 'audio'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMediaTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    mediaTab === tab
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Media Grid */}
            <div className="border border-gray-700 rounded-lg p-4 max-h-64 overflow-auto">
              <div className="grid grid-cols-3 gap-3">
                {mediaTab === 'images' && availableMedia.images.map((img) => (
                  <MediaItem
                    key={img.id}
                    item={img}
                    type="IMAGE"
                    selected={selectedItems.some(
                      (i) => i.mediaType === 'IMAGE' && i.mediaId === img.id
                    )}
                    onToggle={() => toggleItem('IMAGE', img.id)}
                  />
                ))}
                {mediaTab === 'videos' && availableMedia.videos.map((vid) => (
                  <MediaItem
                    key={vid.id}
                    item={vid}
                    type="VIDEO"
                    selected={selectedItems.some(
                      (i) => i.mediaType === 'VIDEO' && i.mediaId === vid.id
                    )}
                    onToggle={() => toggleItem('VIDEO', vid.id)}
                  />
                ))}
                {mediaTab === 'audio' && availableMedia.audio.map((aud) => (
                  <MediaItem
                    key={aud.id}
                    item={aud}
                    type="AUDIO"
                    selected={selectedItems.some(
                      (i) => i.mediaType === 'AUDIO' && i.mediaId === aud.id
                    )}
                    onToggle={() => toggleItem('AUDIO', aud.id)}
                  />
                ))}
              </div>

              {mediaTab === 'images' && availableMedia.images.length === 0 && (
                <p className="text-center text-gray-500 py-8">No images available</p>
              )}
              {mediaTab === 'videos' && availableMedia.videos.length === 0 && (
                <p className="text-center text-gray-500 py-8">No videos available</p>
              )}
              {mediaTab === 'audio' && availableMedia.audio.length === 0 && (
                <p className="text-center text-gray-500 py-8">No audio available</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !title || !price || selectedItems.length === 0}
            className="px-6 py-3 bg-pink-600 hover:bg-pink-700 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Bundle'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MediaItem({ item, type, selected, onToggle }) {
  return (
    <div
      onClick={onToggle}
      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
        selected ? 'border-pink-600' : 'border-transparent hover:border-gray-600'
      }`}
    >
      {type === 'IMAGE' && (
        <img src={item.url} alt={item.title} className="w-full h-24 object-cover" />
      )}
      {type === 'VIDEO' && (
        <div className="w-full h-24 bg-gray-900 flex items-center justify-center text-3xl">
          🎥
        </div>
      )}
      {type === 'AUDIO' && (
        <div className="w-full h-24 bg-gray-900 flex items-center justify-center text-3xl">
          🎵
        </div>
      )}
      
      {selected && (
        <div className="absolute top-1 right-1 w-6 h-6 bg-pink-600 rounded-full flex items-center justify-center text-xs">
          ✓
        </div>
      )}
    </div>
  );
}