import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../utils/supabase/client';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function MessagesInbox() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = getSupabaseClient();
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        loadConversations();
      } else {
        router.push('/login');
      }
    }
    init();
  }, []);

  async function loadConversations() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/messages/conversations', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  }

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  const filteredConversations = conversations.filter(conv => 
    conv.otherUser?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessagePreview?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Messages - 3rotix</title>
      </Head>

      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Messages 💬</h1>
              <p className="text-gray-400">
                {totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            <Link
              href="/settings/dm"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold transition-all"
            >
              ⚙️ DM Settings
            </Link>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full px-4 py-3 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:border-blue-600 outline-none"
            />
          </div>

          {/* Conversations List */}
          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-20 bg-[#0f0f0f] border border-gray-800 rounded-xl">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-gray-400 mb-6">
                {searchQuery ? 'No conversations found' : 'No messages yet'}
              </p>
              <Link
                href="/creators"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-all"
              >
                Explore Creators
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  currentUserId={user.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ConversationItem({ conversation, currentUserId }) {
  const router = useRouter();
  const otherUser = conversation.otherUser;

  if (!otherUser) return null;

  const timeAgo = getTimeAgo(new Date(conversation.lastMessageAt));

  return (
    <div
      onClick={() => router.push(`/messages/${conversation.id}`)}
      className="bg-[#0f0f0f] border border-gray-800 hover:border-blue-600/50 rounded-xl p-4 cursor-pointer transition-all group"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {otherUser.avatarUrl ? (
          <img
            src={otherUser.avatarUrl}
            alt={otherUser.displayName}
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-xl font-bold">
            {(otherUser.displayName || otherUser.username)[0].toUpperCase()}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="font-bold text-lg group-hover:text-blue-400 transition-colors">
                {otherUser.displayName || otherUser.username}
              </h3>
              <p className="text-sm text-gray-500">@{otherUser.username}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">{timeAgo}</div>
              {conversation.unreadCount > 0 && (
                <div className="mt-1 inline-block px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                  {conversation.unreadCount}
                </div>
              )}
            </div>
          </div>

          {/* Last Message Preview */}
          <p className={`text-sm truncate ${
            conversation.unreadCount > 0 ? 'text-white font-semibold' : 'text-gray-400'
          }`}>
            {conversation.lastMessagePreview || 'No messages yet'}
          </p>

          {/* Locked Indicator */}
          {!conversation.isUnlocked && conversation.unlockPrice && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
              <span className="text-xs font-bold text-yellow-400">
                🔒 Unlock for {conversation.unlockPrice} Lipz
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}