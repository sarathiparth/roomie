'use client';

import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import Link from 'next/link';
import { ChevronRight, Clock, MapPin, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MatchItem {
  id: string;
  score: number;
  createdAt: string;
  matchedUser: {
    id: string;
    name: string;
    avatarUrl: string;
    profession: string;
    city: string;
  };
  chatId: string;
  lastMessage: { content: string; createdAt: string } | null;
}

export default function MatchesPage() {
  const { user } = useAuth(true);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await api.get('/matches');
        setMatches(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchMatches();
  }, [user]);

  if (!user) return null;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 tracking-tight">Your Matches</h1>
      
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1,2,3].map(i => (
             <div key={i} className="h-24 bg-surface rounded-2xl border border-text/5" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <div className="bg-surface w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-text/10">
            <span className="text-2xl">👻</span>
          </div>
          <p>No matches yet.</p>
          <p className="text-sm mt-1">Keep swiping in Discover!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map(m => (
            <Link key={m.id} href={`/chats/${m.chatId}`} className="block">
              <div className="glass-card rounded-2xl p-4 flex items-center gap-4 transition-transform hover:-translate-y-1 hover:shadow-xl group">
                {/* Avatar */}
                <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-surface border-2 border-primary/20">
                  {m.matchedUser.avatarUrl ? (
                    <img src={m.matchedUser.avatarUrl} alt={m.matchedUser.name} className="w-full h-full object-cover" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                        <UserIcon size={24} />
                     </div>
                  )}
                  {/* Match Score Badge */}
                  <div className="absolute -bottom-1 -right-1 bg-primary text-black text-[10px] font-black px-1.5 py-0.5 rounded-full border border-surface">
                    {m.score}%
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">{m.matchedUser.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                    <span className="truncate">{m.matchedUser.profession || 'Professional'}</span>
                    {m.matchedUser.city && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-0.5">
                          <MapPin size={10} />
                          <span className="truncate">{m.matchedUser.city}</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Last Message Preview */}
                  {m.lastMessage ? (
                     <p className="text-sm text-text-muted truncate">
                       {m.lastMessage.content}
                     </p>
                  ) : (
                    <p className="text-sm text-primary/80 italic font-medium">New match! Say hello 👋</p>
                  )}
                </div>

                {/* Action arrow */}
                <div className="text-text-muted/50 group-hover:text-primary transition-colors">
                  <ChevronRight size={20} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
