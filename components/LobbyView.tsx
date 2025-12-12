import React, { useState } from 'react';
import { User, Submission } from '../types';
import { ShareIcon, UserGroupIcon, ShieldCheckIcon, KeyIcon, ArrowRightIcon, ComputerDesktopIcon, QrCodeIcon, ClockIcon } from '@heroicons/react/24/outline';

interface LobbyViewProps {
  currentUser: User | null;
  users: User[];
  submissions: Submission[];
  onJoin: (name: string, password?: string, isMod?: boolean) => boolean; // Updated signature to return success status
  onSubmitLink: (url: string, desc: string) => void;
  onStartGame: (duration: number) => void;
  isMod: boolean;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  currentUser,
  users,
  submissions,
  onJoin,
  onSubmitLink,
  onStartGame,
  isMod
}) => {
  // Safety checks for arrays
  const safeUsers = users || [];
  const safeSubmissions = submissions || [];

  // Login States
  const [name, setName] = useState('');
  const [userPassword, setUserPassword] = useState(''); // New state for user password
  const [viewMode, setViewMode] = useState<'user' | 'admin'>('user'); // user or admin
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Settings State
  const [duration, setDuration] = useState(30);

  // Submission States
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');

  const hasSubmitted = currentUser && safeSubmissions.some(s => s.userId === currentUser.id);

  const handleModLogin = () => {
    if (email === 'berkay-34ist@hotmail.com' && password === '123321') {
      const success = onJoin('Moderatör', undefined, true);
      if (!success) setError("Giriş başarısız.");
    } else {
      setError('Hatalı e-posta veya şifre!');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUserLogin = () => {
    if (!name.trim() || !userPassword.trim()) {
        setError('Lütfen adını ve şifreni gir.');
        return;
    }
    const success = onJoin(name, userPassword, false);
    if (!success) {
        setError('Bu isim kullanılıyor ve şifre hatalı!');
        setTimeout(() => setError(''), 3000);
    }
  };

  const handleUrlSubmit = () => {
    let formattedUrl = url.trim();
    if (!formattedUrl) return;

    // Fix: Automatically add https:// if missing to prevent URL constructor errors
    if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
    }

    onSubmitLink(formattedUrl, desc);
  };

  // 1. EKRAN: GİRİŞ EKRANI (Login Screen)
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in relative px-4">
        {/* Main Card */}
        <div className="bg-glass backdrop-blur-2xl p-8 md:p-10 rounded-[2rem] shadow-2xl border border-white/10 w-full max-w-md relative overflow-hidden transition-all duration-500">
          
          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
              Link<span className="text-indigo-400">Yarış</span>
            </h1>
            <p className="text-gray-400 text-sm font-medium">Linkini paylaş, puanları topla!</p>
          </div>

          {/* Mode Tabs */}
          <div className="flex border-b border-white/10 mb-6 relative z-10">
            <button
              onClick={() => { setViewMode('user'); setError(''); }}
              className={`flex-1 pb-3 text-sm font-bold transition-all ${viewMode === 'user' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Katılımcı Girişi
            </button>
            <button
              onClick={() => { setViewMode('admin'); setError(''); }}
              className={`flex-1 pb-3 text-sm font-bold transition-all ${viewMode === 'admin' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Yönetici Girişi
            </button>
          </div>

          {/* Forms */}
          <div className="relative z-10">
            {viewMode === 'admin' ? (
              // Mod Login Form
              <div className="space-y-4 animate-fade-in">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Yönetici E-Posta"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Şifre"
                />
                {error && <div className="text-red-400 text-xs font-bold text-center">{error}</div>}
                <button
                  onClick={handleModLogin}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg"
                >
                  Panel Girişi
                </button>
              </div>
            ) : (
              // User Login Form (İsim ve Şifre)
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Takma Adın</label>
                    <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white text-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold placeholder-gray-600"
                    placeholder="Örn: Ahmet"
                    autoFocus
                    />
                </div>
                
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex justify-between">
                        <span>Giriş Şifresi</span>
                        <span className="text-[10px] text-gray-600 normal-case">(Tekrar giriş için gerekli)</span>
                    </label>
                    <input
                    type="password"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUserLogin()}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white text-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-600"
                    placeholder="****"
                    />
                </div>

                {error && <div className="text-red-400 text-xs font-bold text-center bg-red-500/10 py-2 rounded-lg">{error}</div>}

                <button
                  onClick={handleUserLogin}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25 flex items-center justify-center gap-2 mt-2"
                >
                  <span>Yarışmaya Katıl</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. EKRAN: LOBİ VE PANEL (Logged In)
  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        
        {/* Left Column: Main Action Area */}
        <div className="lg:col-span-8">
            <div className="bg-glass backdrop-blur-md p-8 md:p-10 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col">
              
              <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-4 relative z-10">
                {isMod ? (
                    <>
                        <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                            <ComputerDesktopIcon className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div>
                            <span>Yönetim Paneli</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                            <ShareIcon className="w-8 h-8 text-blue-400" />
                        </div>
                        <div>
                            <span>Link Gönderimi</span>
                        </div>
                    </>
                )}
              </h2>
              
              {isMod ? (
                // MODERATOR VIEW
                <div className="flex flex-col h-full relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                     <div className="bg-gray-800/50 p-6 rounded-2xl border border-white/5">
                        <div className="text-gray-400 text-xs font-bold uppercase mb-2">Katılımcılar</div>
                        <div className="text-4xl font-black text-white">{safeUsers.length - 1}</div>
                     </div>
                     <div className="bg-gray-800/50 p-6 rounded-2xl border border-white/5">
                        <div className="text-gray-400 text-xs font-bold uppercase mb-2">Gelen Linkler</div>
                        <div className="text-4xl font-black text-white">{safeSubmissions.length}</div>
                     </div>
                  </div>
                  
                  {/* Timer Settings */}
                  <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-2xl p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-indigo-300 font-bold flex items-center gap-2">
                            <ClockIcon className="w-5 h-5" />
                            Süre (Saniye)
                        </h3>
                        <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg font-bold font-mono">
                            {duration}
                        </span>
                    </div>
                    <input 
                        type="range" 
                        min="10" 
                        max="120" 
                        step="5"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <button
                    onClick={() => onStartGame(duration)}
                    disabled={safeSubmissions.length === 0}
                    className="mt-auto w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 px-6 rounded-2xl transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 text-xl"
                  >
                    {safeSubmissions.length === 0 ? "Link Bekleniyor..." : "Oylamayı Başlat"}
                    {safeSubmissions.length > 0 && <ArrowRightIcon className="w-6 h-6" />}
                  </button>
                </div>
              ) : (
                // USER SUBMISSION VIEW
                hasSubmitted ? (
                  <div className="flex flex-col items-center justify-center h-full text-center relative z-10">
                    <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-green-500/20">
                        <ShieldCheckIcon className="w-12 h-12 text-green-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-3">Linkin Alındı!</h3>
                    <p className="text-gray-400 max-w-md mx-auto">Yönetici yarışmayı başlattığında ekranın otomatik olarak değişecek.</p>
                  </div>
                ) : (
                  <div className="space-y-6 relative z-10 h-full flex flex-col justify-center">
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">Web Sitesi Linki</label>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://ornek-site.com"
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">Kısa Açıklama (İsteğe Bağlı)</label>
                      <textarea
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        placeholder="Bu site ne işe yarar?"
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none text-base"
                      />
                    </div>
                    <button
                      onClick={handleUrlSubmit}
                      disabled={!url.trim()}
                      className="w-full mt-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 px-6 rounded-2xl transition-all shadow-xl disabled:opacity-50 text-lg flex items-center justify-center gap-2"
                    >
                      <ShareIcon className="w-6 h-6" />
                      Gönder Gitsin
                    </button>
                  </div>
                )
              )}
            </div>
        </div>

        {/* Right Column: User List */}
        <div className="lg:col-span-4">
            <div className="bg-glass backdrop-blur-md p-6 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col h-[500px] lg:h-[600px]">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                   <UserGroupIcon className="w-5 h-5 text-gray-400" />
                   Lobi
                </h2>
                <div className="bg-gray-800/80 px-3 py-1 rounded-lg border border-white/5">
                    <span className="text-indigo-400 font-bold">{safeUsers.length}</span> Kişi
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {safeUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between bg-gray-800/40 p-3 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${u.isMod ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                          {u.isMod ? <ShieldCheckIcon className="w-5 h-5" /> : u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={`font-bold text-sm ${u.id === currentUser.id ? "text-white" : "text-gray-300"}`}>
                            {u.name} {u.id === currentUser.id && "(Sen)"}
                        </span>
                      </div>
                      {safeSubmissions.some(s => s.userId === u.id) && !u.isMod && (
                          <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                      )}
                    </div>
                ))}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};