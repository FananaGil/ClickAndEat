'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { chatApi } from '@/lib/api';
import type { Mensaje } from '@/types';

export function useChat(pedidoId: string) {
  const [messages, setMessages] = useState<Mensaje[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await chatApi.getMessages(pedidoId);
        if (response.success && response.data) {
          setMessages(response.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching messages');
      } finally {
        setIsLoading(false);
      }
    };

    if (pedidoId) {
      fetchMessages();
    }
  }, [pedidoId]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!pedidoId) return;

    // Create realtime subscription
    const channel = supabase
      .channel(`chat-${pedidoId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `pedido_id=eq.${pedidoId}`,
        },
        (payload) => {
          const newMessage = payload.new as Mensaje;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [pedidoId]);

  const sendMessage = useCallback(
    async (contenido: string, tipo: 'texto' | 'imagen' | 'archivo' = 'texto') => {
      setIsSending(true);
      setError(null);
      try {
        const response = await chatApi.sendMessage(pedidoId, {
          contenido,
          tipo,
        });
        if (!response.success) {
          throw new Error(response.error || 'Error sending message');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error sending message');
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [pedidoId]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      setIsSending(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await chatApi.uploadFile(pedidoId, formData);
        if (!response.success) {
          throw new Error(response.error || 'Error uploading file');
        }
        return response.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error uploading file');
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [pedidoId]
  );

  const sendTextMessage = useCallback(
    (contenido: string) => sendMessage(contenido, 'texto'),
    [sendMessage]
  );

  const sendImageMessage = useCallback(
    async (file: File) => {
      const result = await uploadFile(file);
      if (result?.archivo_url) {
        await sendMessage(result.archivo_url, 'imagen');
      }
    },
    [uploadFile, sendMessage]
  );

  return {
    messages,
    isLoading,
    isSending,
    error,
    sendMessage: sendTextMessage,
    sendImageMessage,
    uploadFile,
  };
}
