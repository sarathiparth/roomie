'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSwipeStore, type SwipeProfile } from '@/store/swipeStore';
import { api } from '@/lib/api';
import { SwipeDeck } from '@/components/swipe/SwipeDeck';
import { SceneWrapper } from '@/components/3d/SceneWrapper';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function DiscoverPage() {
  const { user } = useAuth(true); // Requires auth
  const router = useRouter();
  const { deck, deckIndex, setDeck } = useSwipeStore();
  const [loading, setLoading] = useState(true);

  // Check quiz status
  useEffect(() => {
    if (user && !user.quizCompleted) {
      router.replace('/quiz');
    }
  }, [user, router]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await api.get('/matches/discover?page=1');
        setDeck(res.data.data.items);
      } catch (err) {
        toast.error('Failed to load matches');
      } finally {
        setLoading(false);
      }
    };
    if (user?.quizCompleted) {
      fetchMatches();
    }
  }, [setDeck, user]);

  const handleSwipeResult = async (profileId: string, action: 'LIKE' | 'REJECT' | 'SUPER') => {
    // Optimistic UI updates handled by SwipeDeck component via useSwipeStore.nextCard()
    try {
      const res = await api.post('/swipes', { toId: profileId, action });
      if (res.data.data.matched) {
        toast.success("It's a Match! 🎉");
        // Could open a "Match Screen" modal here
      }
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const remainingDeck = deck.slice(deckIndex);

  if (!user || user.quizCompleted === false) {
    return null; // Let the hook redirect
  }

  return (
    <div className="h-[calc(100vh-80px)] w-full relative overflow-hidden flex flex-col items-center justify-center p-4">
      <SceneWrapper />
      
      {loading ? (
        <div className="flex flex-col items-center justify-center text-primary">
          <Loader2 size={40} className="animate-spin mb-4" />
          <p className="font-medium animate-pulse">Finding your perfect match...</p>
        </div>
      ) : remainingDeck.length > 0 ? (
        <SwipeDeck 
          profiles={remainingDeck} 
          onSwipe={handleSwipeResult}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-center max-w-[250px]">
          <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-6 shadow-xl border border-text/5">
            <span className="text-3xl">🏡</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">You reached the end</h2>
          <p className="text-text-muted text-sm">You&apos;ve seen everyone! We&apos;ll notify you when new profiles arrive.</p>
        </div>
      )}
    </div>
  );
}
