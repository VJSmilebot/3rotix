import { useState, useRef, useEffect } from 'react';

export function ChatWindow({
  messages,
  onSendMessage,
  onDeleteMessage,
  loading,
  isLeader,
  chatOpen,
  chatPermissions
}) {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  }

  if (!chatOpen) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">Chat is currently closed</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Squad Chat</h2>
          <div className="text-sm text-gray-400">
            {chatPermissions.map(perm => (
              <span key={perm} className="ml-2">{perm.toLowerCase()}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-[500px] overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : (
          messages.map(message => (
            <div key={message.id} className="flex items-start gap-3 group">
              <img
                src={message.user?.image || '/default-avatar.png'}
                className="w-8 h-8 rounded-full"
                alt={message.user?.handle}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{message.user?.handle}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-300">{message.content}</p>
              </div>
              {isLeader && (
                <button
                  onClick={() => onDeleteMessage(message.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 text-sm px-2"
                >
                  Delete
                </button>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Send a message..."
            disabled={sending}
            className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function useSquadChat({ squadId, chatId }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Load initial messages
    loadMessages()

    // Subscribe to new messages using Supabase Realtime
    const channel = supabase
      .channel(`squad_chat:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'SquadChatMessage',
        filter: `chatId=eq.${chatId}`
      }, (payload) => {
        // Add new message to state
        setMessages(current => [payload.new, ...current])
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'SquadChatMessage',
        filter: `chatId=eq.${chatId}`
      }, (payload) => {
        // Remove deleted message
        setMessages(current => current.filter(msg => msg.id !== payload.old.id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatId])

  async function loadMessages() {
    try {
      const { data, error } = await supabase
        .from('SquadChatMessage')
        .select(`
          *,
          user:userId (
            handle,
            image,
            rank
          )
        `)
        .eq('chatId', chatId)
        .order('createdAt', { ascending: false })
        .limit(50)

      if (error) throw error
      setMessages(data || [])
      setLoading(false)
    } catch (err) {
      setError(err)
      setLoading(false)
    }
  }

  async function sendMessage(content) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Insert message
      const { data: message, error } = await supabase
        .from('SquadChatMessage')
        .insert({
          chatId,
          userId: user.id,
          content
        })
        .select(`
          *,
          user:userId (
            handle,
            image,
            rank
          )
        `)
        .single()

      if (error) throw error

      // Track XP via API
      const response = await fetch('/api/chat/track-xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          squadId,
          messageId: message.id
        })
      })

      const xpData = await response.json()

      return {
        message,
        xpGained: xpData.xp || 0,
        achievements: xpData.achievements || []
      }
    } catch (err) {
      setError(err)
      throw err
    }
  }

  async function deleteMessage(messageId) {
    try {
      const { error } = await supabase
        .from('SquadChatMessage')
        .delete()
        .eq('id', messageId)

      if (error) throw error
    } catch (err) {
      setError(err)
      throw err
    }
  }

  return {
    messages,
    loading,
    error,
    sendMessage,
    deleteMessage
  }
}