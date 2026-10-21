import React from 'react';
import { Youtube, Instagram, Settings } from 'lucide-react';
import { SocialAccount } from '../types/shorts';

interface HeaderProps {
  connectedAccounts: SocialAccount[];
  onOpenAccounts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  connectedAccounts,
  onOpenAccounts,
}) => {
  const ytAccount = connectedAccounts.find(a => a.platform === 'youtube');
  const igAccount = connectedAccounts.find(a => a.platform === 'instagram');

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="font-bold tracking-tight text-white text-lg font-['Plus_Jakarta_Sans']">
            ShortsCraft
          </span>
          <span className="text-xs text-zinc-500 hidden sm:inline">• YouTube to 9:16 Shorts</span>
        </div>

        <button
          onClick={onOpenAccounts}
          className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors"
          aria-label="Manage YouTube and Instagram Accounts"
        >
          <div className="flex items-center gap-1.5">
            <Youtube className={`h-3.5 w-3.5 ${ytAccount?.isConnected ? 'text-red-500' : 'text-zinc-600'}`} />
            <Instagram className={`h-3.5 w-3.5 ${igAccount?.isConnected ? 'text-pink-500' : 'text-zinc-600'}`} />
          </div>
          <span>Connected Accounts</span>
          <span className={`h-1.5 w-1.5 rounded-full ${ytAccount?.isConnected || igAccount?.isConnected ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
        </button>
      </div>
    </header>
  );
};
