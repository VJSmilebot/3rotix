// pages/messages/[conversationId].js
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext"; // <-- use your context
import { uploadMessageMedia, uploadVoiceNote, getMediaType } from "../../utils/uploadMedia";
import VoiceRecorder from "../../components/VoiceRecorder";
import MediaPreview from "../../components/MediaPreview";
import Head from "next/head";
import Link from "next/link";

export default function ChatPage() {
  const router = useRouter();
  const { conversationId } = router.query;

  const { supabase, user, ready, isAuthed } = useAuth();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReactions, setShowReactions] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const channelRef = useRef(null);

  // Auth gate (SSR-safe)
  useEffect(() => {
    if (!ready) return;
    if (!isAuthed) router.push("/login");
  }, [ready, isAuthed, router]);

  // Load + realtime
  useEffect(() => {
    if (!ready || !supabase || !user || !conversationId) return;

    loadConversation();
    loadMessages();
    setupRealtime();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, supabase, user, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  }

  async function loadConversation() {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const res = await fetch(`/api/messages/conversation/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const data = await res.json();
      setConversation(data);

      const otherUserId =
        data.participant1Id === user.id ? data.participant2Id : data.participant1Id;

      const profileRes = await fetch(`/api/profile/by-id/${otherUserId}`);
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setOtherUser(profile);
      }
    } catch (err) {
      console.error("Error loading conversation:", err);
    }
  }

  async function loadMessages() {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) return;

      const res = await fetch(`/api/messages/list/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  }

  function setupRealtime() {
    const channel = supabase.channel(`dm-${conversationId}`);
    channelRef.current = channel;

    channel.on("broadcast", { event: "new-message" }, (payload) => {
      const message = payload.payload;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    });

    channel.on("broadcast", { event: "message-update" }, (payload) => {
      const updated = payload.payload;
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    });

    channel.subscribe();
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files);

    if (selectedFiles.length + files.length > 5) {
      alert("Maximum 5 files allowed");
      return;
    }

    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        alert(`${file.name} is too large. Max 50MB per file.`);
        return;
      }
    }

    setSelectedFiles((prev) => [...prev, ...files]);
  }

  function removeFile(index) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleVoiceNoteComplete(audioBlob) {
    setUploading(true);
    try {
      const voiceUrl = await uploadVoiceNote(audioBlob, user.id);
      await sendMessage(null, [voiceUrl], "audio");
    } catch (err) {
      alert("Failed to upload voice note");
    } finally {
      setUploading(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if ((!newMessage.trim() && selectedFiles.length === 0) || sending || !supabase) return;

    setSending(true);
    setUploading(true);

    try {
      let mediaUrls = [];
      let mediaType = null;

      if (selectedFiles.length > 0) {
        const uploads = await Promise.all(selectedFiles.map((f) => uploadMessageMedia(f, user.id)));
        mediaUrls = uploads.map((u) => u.url);
        mediaType = getMediaType(selectedFiles[0].type);
      }

      await sendMessage(newMessage.trim() || null, mediaUrls, mediaType);

      setNewMessage("");
      setSelectedFiles([]);
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
      setUploading(false);
    }
  }

  async function sendMessage(content, mediaUrls = [], mediaType = null) {
    const token = await getAccessToken();
    if (!token) throw new Error("Not authenticated");

    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ conversationId, content, mediaUrls, mediaType }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.requiresUnlock) {
        if (confirm(`This conversation requires ${data.unlockPrice} Lipz to unlock. Unlock now?`)) {
          await handleUnlock();
        }
      } else {
        throw new Error(data.error || "Failed to send message");
      }
    }
  }

  async function handleUnlock() {
    setUnlocking(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/messages/unlock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to unlock");

      alert("Conversation unlocked! 🎉");
      loadConversation();
    } catch (err) {
      alert(err.message);
    } finally {
      setUnlocking(false);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  // SSR-safe: don’t explode while auth loads
  if (!ready || !isAuthed || !supabase) return null;
  if (!otherUser) return null;

  return (
    <>
      <Head>
        <title>Chat with {otherUser.displayName || otherUser.username} - 3rotix</title>
      </Head>

      {/* --- keep your existing UI below this line --- */}
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Header */}
        <div className="bg-[#0f0f0f] border-b border-gray-800 p-4 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-2xl">
                ←
              </button>

              {otherUser.avatarUrl ? (
                <img src={otherUser.avatarUrl} alt={otherUser.displayName} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-lg font-bold">
                  {(otherUser.displayName || otherUser.username)[0].toUpperCase()}
                </div>
              )}

              <div>
                <h2 className="font-bold text-lg">{otherUser.displayName || otherUser.username}</h2>
                <Link href={`/${otherUser.username}`} className="text-sm text-gray-400 hover:text-blue-400">
                  @{otherUser.username}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Unlock Banner */}
        {conversation && !conversation.isUnlocked && conversation.unlockPrice && (
          <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-b border-yellow-600/30 p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div>
                <h3 className="font-bold text-yellow-400 mb-1">🔒 Locked Conversation</h3>
                <p className="text-sm text-gray-300">Unlock this conversation to send messages</p>
              </div>
              <button
                onClick={handleUnlock}
                disabled={unlocking}
                className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-bold transition-all disabled:opacity-50"
              >
                {unlocking ? "Unlocking..." : `Unlock for ${conversation.unlockPrice} Lipz`}
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {loading ? (
              <div className="text-center py-20 text-gray-500">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-gray-400">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === user.id}
                  currentUserId={user.id}
                  otherUser={otherUser}
                  showReactions={showReactions === message.id}
                  onToggleReactions={(id) => setShowReactions(showReactions === id ? null : id)}
                  getAccessToken={getAccessToken}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="bg-[#0f0f0f] border-t border-gray-800 p-4 sticky bottom-0">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto space-y-3">
            {selectedFiles.length > 0 && <MediaPreview files={selectedFiles} onRemove={removeFile} />}

            {uploading && (
              <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg px-4 py-2">
                <div className="text-sm text-blue-400">Uploading...</div>
              </div>
            )}

            <div className="flex items-end gap-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 hover:bg-gray-800 rounded-lg transition-all text-xl" title="Upload image or video">
                📎
              </button>

              <VoiceRecorder onRecordingComplete={handleVoiceNoteComplete} onCancel={() => {}} />

              <div className="flex-1 bg-black border border-gray-700 rounded-lg focus-within:border-blue-600 transition-all">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  className="w-full px-4 py-3 bg-transparent outline-none resize-none"
                  style={{ maxHeight: "150px" }}
                />
              </div>

              <button
                type="submit"
                disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending || uploading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? "..." : "➤"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function MessageBubble({ message, isOwn, currentUserId, otherUser, showReactions, onToggleReactions, getAccessToken }) {
  const [reacting, setReacting] = useState(false);
  const commonEmojis = ["❤️", "👍", "😂", "😮", "😢", "🔥", "🎉", "👏"];

  async function handleReaction(emoji) {
    setReacting(true);
    try {
      const token = await getAccessToken();
      if (!token) return;

      const hasReacted = message.reactions?.[emoji]?.includes(currentUserId);

      const res = await fetch("/api/messages/react", {
        method: hasReacted ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messageId: message.id, emoji }),
      });

      if (!res.ok) throw new Error("Failed to react");
    } catch (err) {
      console.error("Reaction error:", err);
    } finally {
      setReacting(false);
    }
  }

  const reactions = message.reactions || {};
  const hasReactions = Object.keys(reactions).length > 0;

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} gap-3 group`}>
      {!isOwn && (
        <div className="flex-shrink-0">
          {otherUser.avatarUrl ? (
            <img src={otherUser.avatarUrl} alt={otherUser.displayName} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-xs font-bold">
              {(otherUser.displayName || otherUser.username)[0].toUpperCase()}
            </div>
          )}
        </div>
      )}

      <div className={`max-w-lg ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1 relative`}>
        <div className={`px-4 py-2 rounded-2xl relative ${isOwn ? "bg-blue-600 text-white rounded-br-none" : "bg-gray-800 text-white rounded-bl-none"}`}>
          {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}

          {message.mediaUrls && message.mediaUrls.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.mediaUrls.map((url, i) => {
                if (message.mediaType === "image")
                  return <img key={i} src={url} alt="Message media" className="max-w-xs rounded-lg cursor-pointer hover:opacity-90" onClick={() => window.open(url, "_blank")} />;
                if (message.mediaType === "video") return <video key={i} src={url} controls className="max-w-xs rounded-lg" />;
                if (message.mediaType === "audio") return <audio key={i} src={url} controls className="max-w-xs" />;
                return null;
              })}
            </div>
          )}

          <button onClick={() => onToggleReactions(message.id)} className="absolute -bottom-2 right-2 w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-all">
            ➕
          </button>
        </div>

        {showReactions && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 flex gap-1 shadow-lg animate-in fade-in zoom-in duration-200">
            {commonEmojis.map((emoji) => (
              <button key={emoji} onClick={() => handleReaction(emoji)} disabled={reacting} className="text-xl hover:scale-125 transition-transform p-1">
                {emoji}
              </button>
            ))}
          </div>
        )}

        {hasReactions && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(reactions).map(([emoji, userIds]) => {
              if (!userIds?.length) return null;
              const hasUserReacted = userIds.includes(currentUserId);

              return (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className={`px-2 py-1 rounded-full text-xs font-bold transition-all ${hasUserReacted ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
                >
                  {emoji} {userIds.length}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          {isOwn && message.isRead && <span className="text-blue-400">✓✓</span>}
        </div>
      </div>
    </div>
  );
}
