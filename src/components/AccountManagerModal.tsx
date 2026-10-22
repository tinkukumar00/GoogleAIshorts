import React, { useState, useEffect } from 'react';
import { SocialAccount, UserProfile } from '../types/shorts';
import {
  X,
  Youtube,
  Instagram,
  Check,
  User,
  KeyRound,
  ExternalLink,
  AlertCircle,
  Copy,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface AccountManagerModalProps {
  user: UserProfile;
  accounts: SocialAccount[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (user: UserProfile) => void;
  onUpdateAccounts: (accounts: SocialAccount[]) => void;
}

export const AccountManagerModal: React.FC<AccountManagerModalProps> = ({
  user,
  accounts,
  isOpen,
  onClose,
  onUpdateUser,
  onUpdateAccounts,
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'token' | 'developer' | 'login'>('accounts');
  const USER_GOOGLE_CLIENT_ID = '639179892582-74utu55u0e94bmo1var7a27k02c8jhhn.apps.googleusercontent.com';
  const [googleClientId, setGoogleClientId] = useState(() => localStorage.getItem('google_client_id') || USER_GOOGLE_CLIENT_ID);
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [cookiesInput, setCookiesInput] = useState(() => localStorage.getItem('youtube_cookies') || '');
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [copiedCallback, setCopiedCallback] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const callbackUrl = `${window.location.origin}/auth/callback`;

  // Verify and save real YouTube token with YouTube Data API v3
  const handleSaveAndVerifyToken = async (token: string) => {
    setIsVerifying(true);
    setOauthError(null);
    setSuccessNotice(null);

    try {
      const setRes = await fetch('/api/youtube/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token }),
      });

      const resText = await setRes.text();
      let resData: any = {};
      try {
        resData = JSON.parse(resText);
      } catch {
        resData = { success: false, error: resText.length > 200 ? 'Server returned an invalid response' : resText };
      }

      if (!resData.success) {
        throw new Error(resData.error || 'YouTube API rejected the token.');
      }

      const channel = resData.channel;
      localStorage.setItem('youtube_access_token', token);

      // Update connected accounts
      onUpdateAccounts(
        accounts.map((acc) => {
          if (acc.platform === 'youtube') {
            return {
              ...acc,
              isConnected: true,
              accountName: channel.name,
              handle: channel.handle,
              avatar: channel.avatar,
              followerCount: channel.subscribers,
              lastSync: 'Live YouTube Account Verified & Connected',
            };
          }
          return acc;
        })
      );

      // Update user profile with real creator info
      onUpdateUser({
        name: channel.name,
        email: user.email || 'connected-creator@youtube.com',
        avatar: channel.avatar,
        isLoggedIn: true,
      });

      setSuccessNotice(`Connected to real YouTube channel: ${channel.name} (${channel.handle})`);
      setManualTokenInput('');
    } catch (err: any) {
      console.error('Token verification failed:', err);
      setOauthError(err.message || 'Failed to verify token with YouTube Data API.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Listen for OAuth success popup messages
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const platform = event.data.platform || 'youtube';
        const accessToken = event.data.accessToken;
        const err = event.data.error;

        if (err) {
          setOauthError(`Google OAuth returned: ${err}`);
          return;
        }

        if (platform === 'youtube' && accessToken) {
          await handleSaveAndVerifyToken(accessToken);
        } else if (platform === 'youtube' && event.data.code && event.data.code !== 'authorized') {
          // If code flow was used, attempt code exchange
          try {
            const tokenRes = await fetch('/api/youtube/exchange-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: event.data.code, redirectUri: callbackUrl }),
            });
            const text = await tokenRes.text();
            let resData: any = {};
            try {
              resData = JSON.parse(text);
            } catch {
              resData = { success: false, error: 'Invalid response from server' };
            }
            if (resData.success && resData.channel) {
              if (resData.accessToken) {
                localStorage.setItem('youtube_access_token', resData.accessToken);
              }
              onUpdateAccounts(
                accounts.map((acc) =>
                  acc.platform === 'youtube'
                    ? {
                        ...acc,
                        isConnected: true,
                        accountName: resData.channel.name,
                        handle: resData.channel.handle,
                        avatar: resData.channel.avatar,
                        followerCount: resData.channel.subscribers,
                        lastSync: 'Live YouTube Synced',
                      }
                    : acc
                )
              );
              setSuccessNotice(`Connected to real YouTube channel: ${resData.channel.name}`);
            } else {
              setOauthError(resData.error || 'Failed to exchange Google OAuth code.');
            }
          } catch (codeErr: any) {
            setOauthError(codeErr.message || 'OAuth code exchange failed.');
          }
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [accounts, callbackUrl]);

  if (!isOpen) return null;

  const ytAccount = accounts.find((a) => a.platform === 'youtube');
  const igAccount = accounts.find((a) => a.platform === 'instagram');

  // Trigger Google OAuth Sign-in (GIS Client or Popup)
  const handleConnectGoogle = async () => {
    setOauthError(null);
    setSuccessNotice(null);

    try {
      const customId = localStorage.getItem('google_client_id') || '';
      const res = await fetch(
        `/api/auth/url?platform=youtube&response_type=token&redirect_uri=${encodeURIComponent(callbackUrl)}${customId ? `&client_id=${encodeURIComponent(customId)}` : ''}`
      );
      const data = await res.json();

      if (!data.configured || !data.url) {
        setOauthError(data.error || 'Google OAuth is not configured.');
        return;
      }

      // 1. Try Google Identity Services (GIS) Token Client if available in browser
      const win = window as any;
      if (win.google?.accounts?.oauth2 && data.clientId) {
        try {
          const client = win.google.accounts.oauth2.initTokenClient({
            client_id: data.clientId,
            scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube email profile',
            callback: async (resp: any) => {
              if (resp.error) {
                setOauthError(`Google authorization failed: ${resp.error_description || resp.error}`);
                return;
              }
              if (resp.access_token) {
                await handleSaveAndVerifyToken(resp.access_token);
              }
            },
          });
          client.requestAccessToken({ prompt: 'consent' });
          return;
        } catch (gisErr) {
          console.warn('GIS Token client init warning:', gisErr);
        }
      }

      // 2. Open standard Google OAuth Popup
      const popup = window.open(data.url, 'oauth_popup', 'width=600,height=700');
      if (!popup) {
        setOauthError('Browser blocked the OAuth popup. Please allow popups or use "Paste Access Token" tab.');
      }
    } catch (err: any) {
      setOauthError(err.message || 'Failed to open Google OAuth dialog.');
    }
  };

  const handleDisconnect = (platform: 'youtube' | 'instagram') => {
    if (platform === 'youtube') {
      localStorage.removeItem('youtube_access_token');
    }
    onUpdateAccounts(
      accounts.map((acc) =>
        acc.platform === platform
          ? {
              ...acc,
              isConnected: false,
              accountName: platform === 'youtube' ? 'YouTube Channel' : 'Instagram Account',
              handle: '@NotConnected',
              followerCount: 'Not Connected',
              lastSync: undefined,
            }
          : acc
      )
    );
    setSuccessNotice(`Disconnected ${platform} account.`);
  };

  const handleCopyCallback = () => {
    navigator.clipboard?.writeText(callbackUrl);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2000);
  };

  const handleSaveDeveloperKeys = () => {
    localStorage.setItem('google_client_id', googleClientId.trim());
    setOauthError(null);
    setSuccessNotice('Saved Google Client ID.');
    setActiveTab('accounts');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Tab navigation */}
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-3 mb-5 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`transition-colors cursor-pointer pb-3 -mb-3 shrink-0 ${
              activeTab === 'accounts' ? 'text-white border-b-2 border-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Connected Channels
          </button>
          <button
            onClick={() => setActiveTab('token')}
            className={`transition-colors cursor-pointer flex items-center gap-1 pb-3 -mb-3 shrink-0 ${
              activeTab === 'token' ? 'text-white border-b-2 border-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Direct Token / Playground</span>
          </button>
          <button
            onClick={() => setActiveTab('developer')}
            className={`transition-colors cursor-pointer flex items-center gap-1 pb-3 -mb-3 shrink-0 ${
              activeTab === 'developer' ? 'text-white border-b-2 border-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Google Client ID</span>
          </button>
          <button
            onClick={() => setActiveTab('login')}
            className={`transition-colors cursor-pointer flex items-center gap-1 pb-3 -mb-3 shrink-0 ${
              activeTab === 'login' ? 'text-white border-b-2 border-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Profile</span>
          </button>
        </div>

        {/* Success Banner */}
        {successNotice && (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{successNotice}</p>
          </div>
        )}

        {/* Error Banner */}
        {oauthError && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="block font-semibold text-rose-100">YouTube Connection Notice:</strong>
              <p>{oauthError}</p>
            </div>
          </div>
        )}

        {activeTab === 'accounts' ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">YouTube Channel Connection</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Connect your real YouTube channel with Google OAuth to upload 9:16 Shorts directly to YouTube.
              </p>
            </div>

            {/* YouTube Section */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {ytAccount?.isConnected && ytAccount.avatar ? (
                    <img
                      src={ytAccount.avatar}
                      alt={ytAccount.accountName}
                      className="h-9 w-9 rounded-full object-cover border border-red-500/30"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-red-600/10 flex items-center justify-center text-red-500 border border-red-500/20">
                      <Youtube className="h-5 w-5" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">YouTube Shorts Channel</span>
                      {ytAccount?.isConnected ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                          <Check className="h-2.5 w-2.5" />
                          Live Connected
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500 font-medium">Not Connected</span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400 block">
                      {ytAccount?.isConnected
                        ? `${ytAccount.accountName} (${ytAccount.handle}) • ${ytAccount.followerCount}`
                        : 'Requires Google Account with YouTube Channel'}
                    </span>
                  </div>
                </div>

                {ytAccount?.isConnected ? (
                  <button
                    type="button"
                    onClick={() => handleDisconnect('youtube')}
                    className="text-xs text-zinc-400 hover:text-rose-400 px-2.5 py-1 rounded border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                  >
                    Disconnect
                  </button>
                ) : null}
              </div>

              {!ytAccount?.isConnected ? (
                <div className="space-y-3 pt-2 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={handleConnectGoogle}
                    disabled={isVerifying}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-semibold text-white transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying Channel with YouTube...</span>
                      </>
                    ) : (
                      <>
                        <Youtube className="h-4 w-4" />
                        <span>Connect with Google (YouTube OAuth)</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                    <span>Have an OAuth token from Playground?</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('token')}
                      className="text-red-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <span>Direct Token Entry</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-2.5 text-xs text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Real channel verified for 1-click video uploads.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const token = localStorage.getItem('youtube_access_token');
                      if (token) handleSaveAndVerifyToken(token);
                    }}
                    className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    title="Refresh channel info from YouTube"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Re-check</span>
                  </button>
                </div>
              )}
            </div>

            {/* Instagram Section (Informative) */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-2 opacity-80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-pink-600/10 flex items-center justify-center text-pink-500 border border-pink-500/20">
                    <Instagram className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Instagram Reels</span>
                    <span className="text-[10px] text-zinc-400">Meta Graph API requires Instagram Business / Creator Account</span>
                  </div>
                </div>
                <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  Optional
                </span>
              </div>
            </div>
          </div>
        ) : activeTab === 'token' ? (
          /* Direct Token / Google OAuth Playground Tab */
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Direct OAuth Access Token</h3>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                If your browser blocks popups or you want an instant 100% verified connection, you can generate an access token via Google OAuth Playground and paste it here.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-3 text-xs text-zinc-300">
              <strong className="block text-white font-semibold">How to get a live token in 30 seconds:</strong>
              <ol className="list-decimal list-inside space-y-1 text-zinc-400 text-[11px]">
                <li>Open <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noreferrer" className="text-red-400 hover:underline font-medium inline-flex items-center gap-0.5">Google OAuth 2.0 Playground <ExternalLink className="h-2.5 w-2.5" /></a></li>
                <li>In Step 1: Select <strong>YouTube Data API v3</strong> &gt; <code>https://www.googleapis.com/auth/youtube.upload</code></li>
                <li>Click <strong>Authorize APIs</strong> and choose your Google Account</li>
                <li>In Step 2: Click <strong>Exchange authorization code for tokens</strong></li>
                <li>Copy the <strong>Access token</strong> (starts with <code>ya29.</code>) and paste it below:</li>
              </ol>

              <div className="pt-1 space-y-2">
                <input
                  type="password"
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                  placeholder="Paste ya29.a0... access token here"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-red-500"
                />

                <button
                  type="button"
                  onClick={() => handleSaveAndVerifyToken(manualTokenInput.trim())}
                  disabled={!manualTokenInput.trim() || isVerifying}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 hover:bg-red-500 py-2 text-xs font-semibold text-white transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Validating with YouTube API...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Validate &amp; Connect Channel</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Optional YouTube Cookies / Bot Bypass Box */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-2 text-xs text-zinc-300">
              <div className="flex items-center justify-between">
                <strong className="text-white font-semibold flex items-center gap-1.5">
                  <span>YouTube Cookies (Optional Bot Bypass)</span>
                </strong>
                {localStorage.getItem('youtube_cookies') && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Cookies Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Some protected videos (such as official trailers, age-restricted content, or high-security clips) require session cookies to bypass YouTube datacenter bot verification. Paste exported Netscape cookies or header string below:
              </p>
              <textarea
                rows={3}
                value={cookiesInput}
                onChange={(e) => setCookiesInput(e.target.value)}
                placeholder="Paste cookies.txt content or cookie string here (optional)..."
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-[11px] text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-red-500"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('youtube_cookies', cookiesInput.trim());
                    setSuccessNotice('Saved YouTube session cookies. Protected videos will authenticate directly.');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  Save Cookies
                </button>
                {cookiesInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setCookiesInput('');
                      localStorage.removeItem('youtube_cookies');
                      setSuccessNotice('Cleared YouTube session cookies.');
                    }}
                    className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white text-xs transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'developer' ? (
          /* Developer Keys Tab */
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Google OAuth Client ID</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Configured with your registered Google Cloud Console Web Application credentials.
              </p>
            </div>

            {/* Callback URL Box */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-1.5">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Authorized Redirect Callback URI
              </span>
              <div className="flex items-center justify-between bg-zinc-900 rounded-lg p-2 border border-zinc-800">
                <code className="text-xs text-zinc-300 font-mono truncate mr-2 select-all">
                  {callbackUrl}
                </code>
                <button
                  type="button"
                  onClick={handleCopyCallback}
                  className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white shrink-0 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 cursor-pointer"
                >
                  {copiedCallback ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedCallback ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[10px] text-zinc-500">
                Ensure this URI and your domain origin are added to &quot;Authorized redirect URIs&quot; and &quot;Authorized JavaScript origins&quot; in Google Cloud Console.
              </p>
            </div>

            {/* Google Client ID */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Google OAuth Client ID</label>
              <input
                type="text"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                placeholder="e.g. 123456789-xyz.apps.googleusercontent.com"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none font-mono"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveDeveloperKeys}
              className="w-full rounded-lg bg-white py-2 text-xs font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Save Credentials
            </button>
          </div>
        ) : (
          /* User Login Tab */
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Creator Profile</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Active YouTube profile linked to video processing and uploads.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-10 w-10 rounded-full object-cover border border-zinc-700"
                />
                <div>
                  <span className="text-xs font-bold text-white block">{user.name}</span>
                  <span className="text-[11px] text-zinc-400">{user.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
                <Check className="h-3 w-3" />
                <span>{user.isLoggedIn ? 'Active' : 'Guest'}</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-5 rounded-lg bg-zinc-800 py-2 text-xs font-semibold text-white hover:bg-zinc-700 transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
