'use client';

import { useAuth } from '@/hooks/useAuth';
import { LogOut, Settings, Bell, CircleUser, HelpCircle, UserIcon } from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  const { user, logout } = useAuth(true);

  if (!user) return null;

  return (
    <div className="p-6 pb-24 max-w-md mx-auto relative min-h-screen z-10">
      
      <div className="flex justify-between items-center mb-10 mt-4">
         <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
         <button className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-text/10 hover:border-primary transition-colors text-text">
            <Settings size={20} />
         </button>
      </div>
      
      {/* Auth Card */}
      <div className="glass-card rounded-[32px] p-8 flex flex-col items-center mb-8 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl -z-10 transition-transform group-hover:scale-125 duration-500" />
         
         <div className="w-28 h-28 rounded-full overflow-hidden bg-background border-4 border-primary/20 mb-4 shadow-xl">
           {user.avatarUrl ? (
             <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-primary/50 bg-primary/5">
                <CircleUser size={48} />
             </div>
           )}
         </div>

         <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
         <p className="text-text-muted font-medium tracking-wide text-sm">{user.profession || 'Roomy Member'}</p>
         
         <div className="flex gap-4 mt-8 w-full">
            <div className="flex-1 bg-background/50 border border-text/10 rounded-2xl py-3 px-4 text-center backdrop-blur-md">
               <span className="text-xs text-text-muted font-semibold block uppercase tracking-wider mb-1">Status</span>
               <span className="text-sm font-bold text-primary">Looking</span>
            </div>
            <div className="flex-1 bg-background/50 border border-text/10 rounded-2xl py-3 px-4 text-center backdrop-blur-md">
               <span className="text-xs text-text-muted font-semibold block uppercase tracking-wider mb-1">Compatibility</span>
               <span className="text-sm font-bold">100% setup</span>
            </div>
         </div>
      </div>

      <div className="space-y-3">
        {/* Menu Items */}
        <button className="w-full bg-surface border border-text/5 hover:border-text/10 rounded-2xl p-4 flex items-center gap-4 transition-all">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <UserIcon size={20} />
          </div>
          <span className="flex-1 text-left font-medium">Edit Preferences</span>
        </button>

        <button className="w-full bg-surface border border-text/5 hover:border-text/10 rounded-2xl p-4 flex items-center gap-4 transition-all">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Bell size={20} />
          </div>
          <span className="flex-1 text-left font-medium">Notifications</span>
        </button>
        
        <button className="w-full bg-surface border border-text/5 hover:border-text/10 rounded-2xl p-4 flex items-center gap-4 transition-all">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
            <HelpCircle size={20} />
          </div>
          <span className="flex-1 text-left font-medium">Help & Support</span>
        </button>

        <div className="my-6 h-px bg-text/5 w-full" />

        <button 
          onClick={() => logout()}
          className="w-full bg-surface border border-text/5 hover:bg-red-50 hover:border-red-200 hover:text-red-500 text-text rounded-2xl p-4 flex items-center justify-center gap-2 transition-all font-semibold shadow-sm"
        >
          <LogOut size={20} />
          Log Out
        </button>
      </div>

    </div>
  );
}
