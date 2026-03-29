'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import { Send, Image as ImageIcon, ArrowLeft, Loader2, Phone } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

export default function ChatRoomPage({ params }: { params: { chatId: string } }) {
  const { user } = useAuth(true);
  const socket = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/chats/${params.chatId}/messages`);
        setMessages(res.data.data.items);
      } catch (err) {
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchMessages();
  }, [params.chatId, user]);

  // Socket setup
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('chat:join', params.chatId);

    const handleNewMessage = (msg: Message) => {
      if (msg.chatId === params.chatId) {
        setMessages(prev => [...prev, msg]);
      }
    };

    socket.on('chat:message', handleNewMessage);

    return () => {
      socket.off('chat:message', handleNewMessage);
      socket.emit('chat:leave', params.chatId);
    };
  }, [socket, params.chatId, user]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    
    setSending(true);
    socket.emit('chat:message', {
      chatId: params.chatId,
      content: input.trim(),
      type: 'TEXT',
    });
    
    setInput('');
    setSending(false);
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background relative z-20">
      {/* Header */}
      <header className="glass sticky top-0 z-10 px-4 py-4 border-b border-text/10 flex items-center gap-4">
        <Link href="/matches" className="p-2 -ml-2 hover:bg-surface rounded-full transition-colors">
          <ArrowLeft size={24} className="text-text-muted" />
        </Link>
        <div className="flex-1">
          <h2 className="font-bold text-lg">Chat</h2>
          <span className="text-xs text-primary font-medium tracking-wide">MATCHED</span>
        </div>
         <button className="w-10 h-10 rounded-full flex items-center justify-center text-primary bg-primary/10 hover:bg-primary/20 transition-colors">
            <Phone size={20} className="fill-current" />
        </button>
      </header>

      {/* Messages View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === user.id;
            const showTime = i === 0 || new Date(msg.createdAt).getTime() - new Date(messages[i-1].createdAt).getTime() > 1000 * 60 * 5;
            
            return (
              <div key={msg.id} className="w-full flex flex-col">
                {showTime && (
                  <span className="text-[10px] text-text-muted/60 self-center my-2 font-medium tracking-wider">
                     {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </span>
                )}
                <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[75%] px-4 py-3 text-[15px] leading-relaxed relative ${
                      isMe 
                        ? 'bg-primary text-black rounded-2xl rounded-tr-[4px] shadow-sm' 
                        : 'bg-surface text-text rounded-2xl rounded-tl-[4px] border border-text/5'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-background border-t border-text/5 sticky bottom-0">
        <form onSubmit={sendMessage} className="flex gap-2 items-end">
          <button type="button" className="p-3 text-text-muted hover:text-primary transition-colors hover:bg-surface rounded-full flex-shrink-0">
            <ImageIcon size={22} />
          </button>
          <div className="flex-1 bg-surface border border-text/10 rounded-3xl pb-1 px-1 relative focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all shadow-sm">
             <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-transparent px-4 py-3 outline-none resize-none max-h-32 min-h-[44px] no-scrollbar text-[15px]"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
             />
          </div>
          <button 
            type="submit" 
            disabled={!input.trim() || sending}
            className="w-[46px] h-[46px] flex-shrink-0 rounded-full bg-primary text-black flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all shadow-sm transform active:scale-95"
          >
             <Send size={18} className="translate-x-[1px]" />
          </button>
        </form>
      </div>
    </div>
  );
}
