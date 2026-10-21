import React from 'react';
import { Youtube, Instagram, User, LogIn } from 'lucide-react';
import { SocialAccount, UserProfile } from '../types/shorts';

interface HeaderProps {
  user: UserProfile;
  connectedAccounts: SocialAccount[];
  onOpenAccounts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  connectedAccounts,
  onOpenAccounts,
}) => {
  const ytAccount = connectedAccounts.find(a => a.platform === 'youtube');
  const igAccount = connectedAccounts.find(a => a.platform === 'instagram');
  const isAnyConnected = ytAccount?.isConnected || igAccount?.isConnected;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="font-bold tracking-tight text-white text-lg font-['Plus_Jakarta_Sans']">
            ShortsCraft
          </span>
          <span className="text-xs text-zinc-500 hidden sm:inline">• YouTube to 9:16 Shorts</span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* User Sign In / Profile Quick Button */}
          <button
            onClick={onOpenAccounts}
            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors cursor-pointer"
            aria-label="User Account"
          >
            {user.isLoggedIn ? (
              <div className="flex items-center gap-1.5">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-4 w-4 rounded-full object-cover border border-zinc-700"
                />
                <span className="max-w-[90px] truncate hidden sm:inline">{user.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-zinc-400" />
                <span>Sign In</span>
              </div>
            )}
          </button>

          {/* Social Channels Button */}
          <button
            onClick={onOpenAccounts}
            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors cursor-pointer"
            aria-label="Manage YouTube and Instagram Accounts"
          >
            <div className="flex items-center gap-1.5">
              <Youtube className={`h-3.5 w-3.5 ${ytAccount?.isConnected ? 'text-red-500' : 'text-zinc-600'}`} />
              <Instagram className={`h-3.5 w-3.5 ${igAccount?.isConnected ? 'text-pink-500' : 'text-zinc-600'}`} />
            </div>
            <span className="hidden sm:inline">Channels</span>
            <span className={`h-1.5 w-1.5 rounded-full ${isAnyConnected ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
