'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageSquare, Compass, User } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const NAV_ITEMS = [
    { icon: Compass, label: 'Discover', href: '/discover' },
    { icon: Home, label: 'Matches', href: '/matches' },
    { icon: MessageSquare, label: 'Chats', href: '/chats' },
    { icon: User, label: 'Profile', href: '/profile' },
  ];

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative overflow-hidden bg-background">
      <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 pb-20">
        {children}
      </main>

      {/* Floating Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[360px] glass rounded-full px-6 py-3 flex justify-between items-center z-50">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive ? 'text-primary scale-110' : 'text-text-muted hover:text-text'
              }`}
            >
              <div className={`p-2 rounded-full ${isActive ? 'bg-primary/10' : ''}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
