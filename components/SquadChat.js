import { useState, useEffect, useRef } from 'react';
import { getSupabaseClient } from '../utils/supabase/client';
import { useRouter } from 'next/router';
import { useSquadChat } from '../hooks/useSquadChat';

export default function SquadChat({ squadId, userId, userName, userImage, isModerator = false, isOwner = false }) {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [squadSettings, setSquadSettings] = useState(null);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [showDeletedMessages, setShowDeletedMessages] = useState(false);
  const [chatId, setChatId] = useState(null);
  const messagesEndRef = useRef(null);
  const prevMessageCountRef = useRef(0);
  const fileInputRef = useRef(null);
  const supabase = getSupabaseClient();

  // Use realtime hook
  const { sendMessage: sendRealtimeMessage } = useSquadChat({ squadId, chatId });

  const canModerate = isModerator || isOwner;

  useEffect(() => {
    loadChat();
    loadSquadSettings();
  }, [squadId]);

  // Realtime updates are handled by useSquadChat hook

  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      scrollToBottom();
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  async function loadChat() {
    try {
      // Get or create squad chat
      const res = await fetch(`/api/squads/${squadId}/chat/settings`);
      if (res.ok) {
        const chat = await res.json();
        setChatId(chat.id);
        loadMessages(chat.id);
      }
    } catch (error) {
      console.error('Load chat error:', error);
      setLoading(false);
    }
  }

  async function loadMessages(chatId) {
    try {
      const url = `/api/chat/${squadId}${showDeletedMessages ? '?includeDeleted=true' : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSquadSettings() {
    try {
      const res = await fetch(`/api/squads/${squadId}/settings`);
      if (res.ok) {
        const data = await res.json();
        setSquadSettings(data);
      }
    } catch (error) {
      console.error('Load squad settings error:', error);
    }
  }

  async function handleMediaUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if media is enabled
    if (!squadSettings?.mediaEnabled && !canModerate) {
      alert('Media uploads are currently disabled');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image (JPG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File must be less than 10MB');
      return;
    }

    setUploadingMedia(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `chat/${squadId}/${fileName}`;

      console.log('Uploading media to:', filePath);

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      console.log('Media uploaded:', data.publicUrl);

      // Set preview
      setMediaPreview({
        url: data.publicUrl,
        type: file.type.startsWith('image/gif') ? 'gif' : 'image',
      });

    } catch (error) {
      console.error('Media upload error:', error);
      alert(`Failed to upload media: ${error.message}`);
    } finally {
      setUploadingMedia(false);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if ((!newMessage.trim() && !mediaPreview) || sending) return;

    // Check slow mode
    if (squadSettings?.slowMode && !canModerate) {
      const now = Date.now();
      const timeSinceLastMessage = now - lastMessageTime;
      if (timeSinceLastMessage < squadSettings.slowMode * 1000) {
        const waitTime = Math.ceil((squadSettings.slowMode * 1000 - timeSinceLastMessage) / 1000);
        alert(`Slow mode: Wait ${waitTime} more seconds`);
        return;
      }
    }

    setSending(true);
    try {
      const res = await fetch(`/api/chat/${squadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          content: newMessage.trim() || (mediaPreview ? '[Media]' : ''),
          replyToId: replyTo?.id || null,
          mediaUrl: mediaPreview?.url || null,
          mediaType: mediaPreview?.type || null,
        }),
      });

      if (res.ok) {
        setNewMessage('');
        setReplyTo(null);
        setMediaPreview(null);
        setLastMessageTime(Date.now());
        loadMessages();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Send error:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  async function pinMessage(messageId) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        alert('You must be logged in');
        return;
      }
      
      const res = await fetch(`/api/squads/${squadId}/chat/moderate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include', // Important!
        body: JSON.stringify({
          action: 'PIN_MESSAGE',
          messageId,
        }),
      });

      if (res.ok) {
        loadMessages();
      } else {
        const error = await res.json();
        console.error('Pin error response:', error);
        alert(error.error || 'Failed to pin message');
      }
    } catch (error) {
      console.error('Pin error:', error);
      alert('Failed to pin message');
    }
  }

  async function deleteMessage(messageId) {
    if (!confirm('Delete this message?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        alert('You must be logged in');
        return;
      }

      const res = await fetch(`/api/squads/${squadId}/chat/moderate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'DELETE_MESSAGE',
          messageId,
          reason: 'Deleted by moderator',
        }),
      });

      if (res.ok) {
        loadMessages();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete message');
    }
  }

  async function editMessage(messageId, newContent) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        alert('You must be logged in');
        return;
      }

      const res = await fetch(`/api/chat/${squadId}/edit`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          messageId,
          content: newContent,
        }),
      });

      if (res.ok) {
        setEditingMessageId(null);
        setEditContent('');
        loadMessages();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to edit message');
      }
    } catch (error) {
      console.error('Edit error:', error);
      alert('Failed to edit message');
    }
  }

  async function muteUser(targetUserId, duration) {
    if (!confirm(`Mute this user for ${duration} minutes?`)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`/api/squads/${squadId}/chat/moderate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'MUTE_USER',
          targetUserId,
          duration,
        }),
      });

      if (res.ok) {
        alert('User muted');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to mute user');
      }
    } catch (error) {
      console.error('Mute error:', error);
      alert('Failed to mute user');
    }
  }

  async function toggleMediaEnabled() {
    try {
      const res = await fetch(`/api/squads/${squadId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaEnabled: !squadSettings.mediaEnabled,
        }),
      });

      if (res.ok) {
        loadSquadSettings();
        alert(`Media ${!squadSettings.mediaEnabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      console.error('Toggle media error:', error);
      alert('Failed to toggle media');
    }
  }

  async function addReaction(messageId, emoji) {
    try {
      const res = await fetch(`/api/chat/${squadId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          userId,
          emoji,
        }),
      });

      if (res.ok) {
        loadMessages();
      }
    } catch (error) {
      console.error('Reaction error:', error);
    }
  }

  async function exportChat() {
    try {
      const res = await fetch(`/api/squads/${squadId}/chat/export`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `squad-${squadId}-chat-${Date.now()}.json`;
        a.click();
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export chat');
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function formatTime(date) {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function formatFullTime(date) {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function getAvatarUrl(imageUrl) {
    if (!imageUrl || imageUrl.includes('supabase.co') && imageUrl.includes('select=*')) {
      return '/default-avatar.png';
    }
    return imageUrl;
  }

  function renderMessageContent(content) {
    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return (
          <span key={i} style={styles.mention} onClick={() => router.push(`/${part}`)}>
            @{part}
          </span>
        );
      }
      return part;
    });
  }

  const pinnedMessages = messages.filter(m => m.isPinned && !m.isDeleted);
  const visibleMessages = messages.filter(m => showDeletedMessages || !m.isDeleted);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading chat...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header with controls */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          {canModerate && (
            <>
              <button onClick={toggleMediaEnabled} style={styles.toggleBtn}>
                {squadSettings?.mediaEnabled ? '🖼️ Media On' : '🚫 Media Off'}
              </button>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={showDeletedMessages}
                  onChange={(e) => setShowDeletedMessages(e.target.checked)}
                />
                <span style={{ marginLeft: 6 }}>Show deleted</span>
              </label>
            </>
          )}
        </div>
        {canModerate && (
          <button onClick={exportChat} style={styles.exportBtn}>
            📥 Export
          </button>
        )}
      </div>

      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
        <div style={styles.pinnedSection}>
          <div style={styles.pinnedHeader}>📌 Pinned Messages</div>
          {pinnedMessages.map((msg) => (
            <div key={msg.id} style={styles.pinnedMessage}>
              <strong>@{msg.user?.handle}</strong>: {msg.content}
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={styles.messages}>
        {visibleMessages.length === 0 ? (
          <div style={styles.empty}>
            <p>💬</p>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          visibleMessages.map((msg) => (
            <div
              key={msg.id}
              style={{
                ...styles.message,
                ...(msg.userId === userId ? styles.myMessage : {}),
                ...(msg.isDeleted ? styles.deletedMessage : {}),
              }}
            >
              {msg.userId !== userId && (
                <img
                  src={getAvatarUrl(msg.user?.image)}
                  alt={msg.user?.name || 'User'}
                  style={{...styles.avatar, ...(msg.isDeleted ? { opacity: 0.3 } : {})}}
                  onError={(e) => { e.target.src = '/default-avatar.png'; }}
                />
              )}
              <div style={styles.messageContent}>
                {msg.userId !== userId && (
                  <div style={styles.messageHeader}>
                    <span 
                      style={styles.userName}
                      onClick={() => router.push(`/${msg.user?.handle}`)}
                    >
                      {msg.user?.name || msg.user?.handle || 'Unknown User'}
                    </span>
                    {msg.user?.handle && (
                      <span 
                        style={styles.userHandle}
                        onClick={() => router.push(`/${msg.user?.handle}`)}
                      >
                        @{msg.user.handle}
                      </span>
                    )}
                    {msg.user?.role && <span style={styles.userRole}>{msg.user.role}</span>}
                  </div>
                )}

                {/* Deleted indicator (mods only) */}
                {msg.isDeleted && (
                  <div style={styles.deletedBadge}>
                    🗑️ Deleted {msg.deletedAt ? `on ${formatTime(msg.deletedAt)}` : ''}
                    {msg.deletedBy && ` by moderator`}
                  </div>
                )}

                {/* Reply indicator */}
                {msg.replyTo && (
                  <div style={styles.replyIndicator}>
                    Replying to @{msg.replyTo.user?.handle}: {msg.replyTo.content.substring(0, 50)}...
                  </div>
                )}

                {/* Message media */}
                {msg.mediaUrl && (
                  <div style={styles.mediaContainer}>
                    <img 
                      src={msg.mediaUrl} 
                      alt="Uploaded media"
                      style={styles.media}
                      onClick={() => window.open(msg.mediaUrl, '_blank')}
                    />
                  </div>
                )}

                {/* Message text or edit mode */}
                {editingMessageId === msg.id ? (
                  <div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      style={styles.editTextarea}
                      maxLength={500}
                    />
                    <div style={styles.editActions}>
                      <button onClick={() => editMessage(msg.id)} style={styles.editSaveBtn}>Save</button>
                      <button onClick={() => setEditingMessageId(null)} style={styles.editCancelBtn}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{...styles.messageText, ...(msg.isDeleted ? { opacity: 0.5 } : {})}} title={formatFullTime(msg.createdAt)}>
                    {renderMessageContent(msg.content)}
                    {msg.isEdited && <span style={styles.editedBadge}>(edited)</span>}
                  </div>
                )}

                {/* Reactions */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div style={styles.reactions}>
                    {Object.entries(
                      msg.reactions.reduce((acc, r) => {
                        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([emoji, count]) => (
                      <span key={emoji} style={styles.reaction} onClick={() => addReaction(msg.id, emoji)}>
                        {emoji} {count}
                      </span>
                    ))}
                  </div>
                )}

                <div style={styles.messageFooter}>
                  <span style={styles.messageTime}>{formatTime(msg.createdAt)}</span>
                  
                  {/* Message actions */}
                  {!msg.isDeleted && (
                    <div style={styles.messageActions}>
                      <button onClick={() => setReplyTo(msg)} style={styles.actionBtn} title="Reply">↩️</button>
                      <button onClick={() => addReaction(msg.id, '👍')} style={styles.actionBtn}>👍</button>
                      <button onClick={() => addReaction(msg.id, '❤️')} style={styles.actionBtn}>❤️</button>
                      
                      {msg.userId === userId && (
                        <>
                          <button 
                            onClick={() => {
                              setEditingMessageId(msg.id);
                              setEditContent(msg.content);
                            }} 
                            style={styles.actionBtn}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button onClick={() => deleteMessage(msg.id)} style={styles.actionBtn} title="Delete">🗑️</button>
                        </>
                      )}
                      
                      {canModerate && msg.userId !== userId && (
                        <>
                          <button onClick={() => deleteMessage(msg.id)} style={styles.actionBtn} title="Delete (Mod)">🗑️</button>
                          <button onClick={() => pinMessage(msg.id)} style={styles.actionBtn} title="Pin">📌</button>
                          <button onClick={() => muteUser(msg.userId, 5)} style={styles.actionBtn} title="Mute 5min">🔇</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div style={styles.replyPreview}>
          <span>Replying to @{replyTo.user?.handle}</span>
          <button onClick={() => setReplyTo(null)} style={styles.cancelReplyBtn}>✕</button>
        </div>
      )}

      {/* Media preview */}
      {mediaPreview && (
        <div style={styles.mediaPreview}>
          <img src={mediaPreview.url} alt="Preview" style={styles.mediaPreviewImg} />
          <button onClick={() => setMediaPreview(null)} style={styles.removeMediaBtn}>✕</button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} style={styles.inputForm}>
        <div style={styles.inputWrapper}>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message... (@mention users)"
            style={styles.input}
            disabled={sending}
            maxLength={500}
            rows={2}
          />
          {(squadSettings?.mediaEnabled || canModerate) && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleMediaUpload}
                disabled={uploadingMedia}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingMedia}
                style={styles.mediaBtn}
                title="Upload image/GIF"
              >
                {uploadingMedia ? '...' : '🖼️'}
              </button>
            </>
          )}
        </div>
        <div style={styles.inputFooter}>
          <span style={styles.charCount}>{newMessage.length}/500</span>
          <button type="submit" disabled={(!newMessage.trim() && !mediaPreview) || sending} style={styles.sendBtn}>
            {sending ? '...' : '→'}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '600px',
    background: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    padding: 12,
    borderBottom: '1px solid #333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  toggleBtn: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: 6,
    padding: '6px 12px',
    color: '#fff',
    fontSize: 12,
    cursor: 'pointer',
  },
  toggleLabel: {
    fontSize: 12,
    color: '#999',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  exportBtn: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: 6,
    padding: '6px 12px',
    color: '#fff',
    fontSize: 12,
    cursor: 'pointer',
  },
  pinnedSection: {
    background: '#1a1a1a',
    borderBottom: '1px solid #333',
    padding: 12,
  },
  pinnedHeader: {
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 8,
    color: '#db2777',
  },
  pinnedMessage: {
    fontSize: 12,
    padding: 6,
    background: '#0a0a0a',
    borderRadius: 4,
    marginBottom: 4,
  },
  loading: {
    display: 'grid',
    placeItems: 'center',
    height: '100%',
    color: '#666',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  empty: {
    display: 'grid',
    placeItems: 'center',
    height: '100%',
    color: '#666',
    textAlign: 'center',
    fontSize: 40,
  },
  message: {
    display: 'flex',
    gap: 12,
    maxWidth: '70%',
    position: 'relative',
  },
  myMessage: {
    marginLeft: 'auto',
    flexDirection: 'row-reverse',
  },
  deletedMessage: {
    opacity: 0.6,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    objectFit: 'cover',
    flexShrink: 0,
    background: '#1a1a1a',
    cursor: 'pointer',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
  },
  userHandle: {
    fontSize: 12,
    color: '#666',
    cursor: 'pointer',
  },
  userRole: {
    fontSize: 11,
    color: '#db2777',
    textTransform: 'uppercase',
    padding: '2px 6px',
    background: 'rgba(219, 39, 119, 0.1)',
    borderRadius: 4,
  },
  deletedBadge: {
    fontSize: 11,
    color: '#ef4444',
    background: 'rgba(239, 68, 68, 0.1)',
    padding: '4px 8px',
    borderRadius: 4,
    marginBottom: 6,
    display: 'inline-block',
  },
  replyIndicator: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 4,
    paddingLeft: 8,
    borderLeft: '2px solid #666',
  },
  mediaContainer: {
    marginBottom: 8,
    maxWidth: 400,
  },
  media: {
    maxWidth: '100%',
    borderRadius: 8,
    cursor: 'pointer',
    border: '1px solid #333',
  },
  messageText: {
    background: '#1a1a1a',
    padding: '8px 12px',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    lineHeight: 1.4,
    wordBreak: 'break-word',
  },
  mention: {
    color: '#db2777',
    fontWeight: 600,
    cursor: 'pointer',
  },
  editedBadge: {
    fontSize: 11,
    color: '#666',
    marginLeft: 6,
  },
  reactions: {
    display: 'flex',
    gap: 6,
    marginTop: 6,
  },
  reaction: {
    background: '#1a1a1a',
    padding: '2px 8px',
    borderRadius: 12,
    fontSize: 12,
    cursor: 'pointer',
    border: '1px solid #333',
  },
  messageFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#666',
  },
  messageActions: {
    display: 'flex',
    gap: 6,
    opacity: 0.5,
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    fontSize: 12,
    cursor: 'pointer',
    padding: 2,
  },
  editTextarea: {
    width: '100%',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: 8,
    padding: 8,
    color: '#fff',
    fontSize: 14,
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  editActions: {
    display: 'flex',
    gap: 8,
    marginTop: 8,
  },
  editSaveBtn: {
    background: '#db2777',
    border: 'none',
    borderRadius: 6,
    padding: '4px 12px',
    color: '#fff',
    fontSize: 12,
    cursor: 'pointer',
  },
  editCancelBtn: {
    background: '#333',
    border: 'none',
    borderRadius: 6,
    padding: '4px 12px',
    color: '#fff',
    fontSize: 12,
    cursor: 'pointer',
  },
  replyPreview: {
    padding: 8,
    background: '#1a1a1a',
    borderTop: '1px solid #333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 12,
    color: '#666',
  },
  cancelReplyBtn: {
    background: 'none',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    fontSize: 16,
  },
  mediaPreview: {
    padding: 12,
    background: '#1a1a1a',
    borderTop: '1px solid #333',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  mediaPreviewImg: {
    maxHeight: 100,
    maxWidth: 150,
    borderRadius: 6,
    border: '1px solid #333',
  },
  removeMediaBtn: {
    background: '#ef4444',
    border: 'none',
    borderRadius: 6,
    padding: '6px 10px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 14,
  },
  inputForm: {
    padding: 16,
    borderTop: '1px solid #333',
    background: '#050505',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    width: '100%',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: 8,
    padding: '10px 50px 10px 14px',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'none',
  },
  mediaBtn: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    padding: 6,
  },
  inputFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  charCount: {
    fontSize: 11,
    color: '#666',
  },
  sendBtn: {
    background: '#db2777',
    border: 'none',
    borderRadius: 8,
    padding: '8px 20px',
    color: '#fff',
    fontSize: 18,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
};