import React from 'react';
import { SocialAccount } from '../types/shorts';
import { X, Youtube, Instagram, Check } from 'lucide-react';

interface AccountManagerModalProps {
  accounts: SocialAccount[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateAccounts: (accounts: SocialAccount[]) => void;
}

export const AccountManagerModal: React.FC<AccountManagerModalProps> = ({
  accounts,
  isOpen,
  onClose,
  onUpdateAccounts,
}) => {
  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    onUpdateAccounts(
      accounts.map((acc) =>
        acc.id === id ? { ...acc, isConnected: !acc.isConnected } : acc
      )
    );
  };

  const relevantAccounts = accounts.filter(
    (a) => a.platform === 'youtube' || a.platform === 'instagram'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="relative w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-base font-bold text-white">Publishing Accounts</h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          Connect your channels to enable direct 1-click publishing.
        </p>

        <div className="mt-4 space-y-2.5">
          {relevantAccounts.map((acc) => (
            <div
              key={acc.id}
              className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-950"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  {acc.platform === 'youtube' ? (
                    <Youtube className="h-4 w-4 text-red-500" />
                  ) : (
                    <Instagram className="h-4 w-4 text-pink-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white">{acc.accountName}</span>
                    {acc.isConnected && (
                      <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-medium">
                        <Check className="h-2.5 w-2.5" />
                        Connected
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-500">{acc.handle}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggle(acc.id)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  acc.isConnected
                    ? 'border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                    : 'bg-white text-zinc-950 hover:bg-zinc-200'
                }`}
              >
                {acc.isConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 rounded-lg bg-zinc-800 py-2 text-xs font-semibold text-white hover:bg-zinc-700 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};
