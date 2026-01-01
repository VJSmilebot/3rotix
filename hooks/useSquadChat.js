import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function useSquadChat({ squadId, chatId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chatId) return;

    // Load initial messages
    loadMessages();

    // Subscribe to new messages using Supabase Realtime
    const channel = supabase
      .channel(`squad_chat:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'SquadChatMessage',
        filter: `chatId=eq.${chatId}`
      }, (payload) => {
        setMessages(current => [payload.new, ...current]);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'SquadChatMessage',
        filter: `chatId=eq.${chatId}`
      }, (payload) => {
        setMessages(current => current.filter(msg => msg.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

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
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }

  async function sendMessage(content) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

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
        .single();

      if (error) throw error;

      // Track XP via API
      const response = await fetch('/api/chat/track-xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          squadId,
          messageId: message.id
        })
      });

      const xpData = await response.json();

      return {
        message,
        xpGained: xpData.xp || 0,
        achievements: xpData.achievements || []
      };
    } catch (err) {
      setError(err);
      throw err;
    }
  }

  async function deleteMessage(messageId) {
    try {
      const { error } = await supabase
        .from('SquadChatMessage')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (err) {
      setError(err);
      throw err;
    }
  }

  return {
    messages,
    loading,
    error,
    sendMessage,
    deleteMessage
  };
}