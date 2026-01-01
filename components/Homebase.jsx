import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../utils/supabase/client';
import io from 'socket.io-client';
import { ChatSettings } from './ChatSettings';
import { MessageModMenu } from './MessageModMenu';
import { ProfilePeekCard } from './ProfilePeekCard';
import XpToast from './XpToast';
import RankUpToast from './RankUpToast';
import BadgeToast from './BadgeToast';

// SSR-safe: only create supabase in the browser
let supabase = null;
if (typeof window !== 'undefined') {
  supabase = getSupabaseClient();
}

export default function Homebase({ squadId, currentUser, squads, onSelectSquad }) {
    const [stats, setStats] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [showXp, setShowXp] = useState({ amount: 0, action: '' });
    const [socket, setSocket] = useState(null);
    const [showCreateJoin, setShowCreateJoin] = useState(false);
    const isLeader = currentUser.id === stats?.info.ownerId;
    const canModerate = isLeader || stats?.info.chat.moderators?.includes(currentUser.id);

    useEffect(() => {
        loadHomebase();
    }, [squadId]);

    useEffect(() => {
      const setupSocket = async () => {
        if (!supabase) return;
  
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
  
        const newSocket = io({
          auth: { token: session.access_token }
        });
  
        newSocket.on('connect', () => {
          console.log('Connected to chat');
          newSocket.emit('join-squad', squadId);
        });
  
        newSocket.on('new-message', ({ message, rewards }) => {
          setMessages(prev => [message, ...prev]);
          if (rewards?.xp?.total > 0) {
            setShowXp({ amount: rewards.xp.total, action: 'Chat Message' });
          }
        });
  
        newSocket.on('delete-message', ({ messageId }) => {
          setMessages(prev => prev.filter(msg => msg.id !== messageId));
        });
  
        setSocket(newSocket);
  
        return () => {
          newSocket.emit('leave-squad', squadId);
          newSocket.disconnect();
        };
      };
  
      const cleanupPromise = setupSocket();
      return () => {
        if (cleanupPromise && typeof cleanupPromise.then === 'function') {
          cleanupPromise.then(cleanup => cleanup && cleanup());
        }
      };
    }, [squadId]);

    useEffect(() => {
      if (!supabase) return;
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') {
          socket?.disconnect();
          setMessages([]);
          setStats(null);
        }
      });
  
      return () => subscription.unsubscribe();
    }, [socket]);

    async function loadHomebase() {
      try {
        setLoading(true);
  
        const [squadStats, chatHistory] = await Promise.all([
          fetch(`/api/squads/${squadId}`).then(r => r.json()),
          fetch(`/api/chat/${squadId}`).then(r => r.json())
        ]);
  
        setStats(squadStats);
        setMessages(Array.isArray(chatHistory) ? chatHistory : []);
      } catch (error) {
        console.error('Failed to load homebase:', error);
      } finally {
        setLoading(false);
      }
    }

    async function sendMessage(e) {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const result = await fetch(`/api/chat/${squadId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage })
            }).then(r => r.json());

            console.log("CHAT REWARDS", result.rewards);

            setMessages(prev => [result.message, ...prev]);
            setNewMessage('');

            // Show XP gain toast
            if (result.rewards.xp.total > 0) {
                setShowXp({
                    amount: result.rewards.xp.total,
                    action: 'Chat Message'
                });
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }

    async function handleDeleteMessage(messageId) {
        try {
            await fetch(`/api/chat/${squadId}/edit`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageId })
            });
            setMessages(prev => prev.filter(msg => msg.id !== messageId));
        } catch (error) {
            console.error('Failed to delete message:', error);
        }
    }

    async function handleMuteUser(userId) {
        try {
            await fetch(`/api/chat/${squadId}/moderate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'mute', userId, duration: 3600 })
            });
            loadHomebase(); // Refresh chat state
        } catch (error) {
            console.error('Failed to mute user:', error);
        }
    }

    // Update the message rendering in the chat section
    const renderMessage = (msg) => (
        <div key={msg.id} className="flex gap-2 group">
            <img
                src={msg.user.image || '/default-avatar.png'}
                className="w-8 h-8 rounded-full"
                alt={msg.user.handle}
            />
            <div className="flex-1">
                <div className="flex items-baseline gap-2">
                    <ProfilePeekCard user={msg.user}>
                        <span className="font-medium cursor-pointer">{msg.user.handle}</span>
                    </ProfilePeekCard>
                    <span className="text-xs text-gray-500">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                </div>
                <p className="text-gray-700">{msg.content}</p>
                <div className="flex gap-2 mt-1 text-xs text-gray-500">
                    <button className="hover:text-gray-700">Reply</button>
                    <button className="hover:text-gray-700">React</button>
                    <button className="opacity-50 cursor-not-allowed">Tip</button>
                    <button className="hover:text-gray-700">Share</button>
                </div>
            </div>
            {canModerate && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MessageModMenu
                        message={msg}
                        onDelete={handleDeleteMessage}
                        onMuteUser={handleMuteUser}
                    />
                </div>
            )}
        </div>
    );

    if (loading) return <div>Loading...</div>;

    return (
        <div className="grid grid-cols-12 gap-4 p-4">
            {/* Squad List */}
            <div className="col-span-12 lg:col-span-3">
                <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-lg font-semibold mb-4">My Squads</h2>
                    <div className="space-y-2">
                        {squads.map(squad => (
                            <div
                                key={squad.id}
                                onClick={() => onSelectSquad(squad.id)}
                                className={`p-2 rounded cursor-pointer ${squad.id === squadId ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                            >
                                <div className="font-medium">{squad.name}</div>
                                <div className="text-sm text-gray-500">{squad.memberCount} members</div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setShowCreateJoin(true)} className="mt-4 w-full bg-pink-600 text-white py-2 rounded">Create/Join Squad</button>
                </div>
            </div>

            {/* Chat Section */}
            <div className="col-span-12 lg:col-span-6">
                <div className="bg-white rounded-lg shadow">
                    {!stats.info.chat.isOpen ? (
                        <div className="h-[500px] flex items-center justify-center text-gray-500">
                            Chat is currently closed by moderator
                        </div>
                    ) : (
                        <div className="h-[500px] flex flex-col">
                            <div className="p-4 space-y-2 border-b">
                                <div className="bg-yellow-100 p-2 rounded text-sm">📜 Rules: Be respectful and have fun!</div>
                                <div className="bg-blue-100 p-2 rounded text-sm">🎁 Featured offer: Check out our merch</div>
                                <div className="bg-green-100 p-2 rounded text-sm">🔗 Squad link: https://3rotix.com/squad/{squadId}</div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map(renderMessage)}
                            </div>
                            <form onSubmit={sendMessage} className="p-4 border-t">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder={
                                            stats.info.chat.mutedUntil > new Date()
                                                ? "You are muted"
                                                : "Send a message..."
                                        }
                                        disabled={stats.info.chat.mutedUntil > new Date()}
                                        className="flex-1 rounded-lg border p-2"
                                    />
                                    <button
                                        type="submit"
                                        disabled={stats.info.chat.mutedUntil > new Date()}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                                    >
                                        Send
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Squad Info Panel */}
            <div className="col-span-12 lg:col-span-3">
                <div className="space-y-4">
                    {/* Squad Info */}
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold">{stats.info.name}</h1>
                            {isLeader && (
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="text-gray-600 hover:text-gray-800"
                                >
                                    ⚙️ Settings
                                </button>
                            )}
                        </div>
                        <div className="mt-2">
                            <div className="text-sm">Level {stats.levelProgress.current}</div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    style={{ width: `${(stats.levelProgress.xpInLevel / 1000) * 100}%` }}
                                ></div>
                            </div>
                            <div className="text-xs text-gray-500">
                                {stats.levelProgress.xpToNextLevel} XP to next level
                            </div>
                        </div>
                    </div>
                    {showSettings && (
                        <ChatSettings
                            squadId={squadId}
                            isLeader={isLeader}
                        />
                    )}

                    {/* Top Contributors */}
                    <div className="bg-white rounded-lg shadow p-4">
                        <h2 className="text-lg font-semibold mb-4">Top Contributors</h2>
                        <div className="space-y-2">
                            {stats.topContributors.map(member => (
                                <div key={member.id} className="flex items-center gap-2">
                                    <img
                                        src={member.user.image || '/default-avatar.png'}
                                        className="w-8 h-8 rounded-full"
                                        alt={member.user.handle}
                                    />
                                    <div>
                                        <div className="font-medium">{member.user.handle}</div>
                                        <div className="text-sm text-gray-500">
                                            {member.contributionXp.toLocaleString()} XP
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Achievements */}
                    <div className="bg-white rounded-lg shadow p-4">
                        <h2 className="text-lg font-semibold mb-4">Recent Achievements</h2>
                        <div className="space-y-4">
                            {stats.recentAchievements.map(achievement => (
                                <div key={achievement.id} className="flex items-center gap-2">
                                    <div className="bg-yellow-100 p-2 rounded-lg">
                                        🏆
                                    </div>
                                    <div>
                                        <div className="font-medium">{achievement.achievement.name}</div>
                                        <div className="text-sm text-gray-500">
                                            {achievement.achievement.xpReward} XP earned
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <XpToast
                xp={showXp.amount}
                action={showXp.action}
                onClose={() => setShowXp({ amount: 0, action: '' })}
            />

            {showCreateJoin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Create or Join Squad</h2>
                        <div className="space-y-4">
                            <button className="w-full bg-pink-600 text-white py-2 rounded">Create New Squad</button>
                            <div>
                                <input type="text" placeholder="Enter squad code to join" className="w-full border p-2 rounded" />
                                <button className="w-full bg-blue-600 text-white py-2 rounded mt-2">Join Squad</button>
                            </div>
                        </div>
                        <button onClick={() => setShowCreateJoin(false)} className="mt-4 text-gray-600">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}