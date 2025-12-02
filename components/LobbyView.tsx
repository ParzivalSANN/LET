import React, { useState } from 'react';
import { User, Submission } from '../types';
import { ShareIcon, UserGroupIcon, ShieldCheckIcon, KeyIcon, ArrowRightIcon, ComputerDesktopIcon, QrCodeIcon } from '@heroicons/react/24/outline';

interface LobbyViewProps {
  currentUser: User | null;
  users: User[];
  submissions: Submission[];
  onJoin: (name: string, isMod: boolean) => void;
  onSubmitLink: (url: string, desc: string) => void;
  onStartGame: () => void;
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
  // Login States
  const [name, setName] = useState('');
  const [viewMode, setViewMode] = useState<'user' | 'admin'>('user'); // user or admin
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Submission States
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');

  const hasSubmitted = currentUser && submissions.some(s => s.userId === currentUser.id);

  const handleModLogin = () => {
    if (email === 'berkay-34ist@hotmail.com' && password === '123321') {
      onJoin('Moderatör', true);
    } else {
      setError('Hatalı e-posta veya şifre!');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in relative px-4">
        {/* Main Card */}
        <div className="bg-glass backdrop-blur-2xl p-8 md:p-10 rounded-[2rem] shadow-2xl border border-white/10 w-full max-w-md relative overflow-hidden transition-all duration-500">
          
          {/* Decorative Glows */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -z-10"></div>

          {/* Header */}
          <div className="text-center mb-10 relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30">
              <ShareIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
              Link<span className="text-indigo-400">Yarış</span>
            </h1>
            <p className="text-gray-400 text-sm font-medium">En iyi linki kim bulacak?</p>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-gray-900/60 p-1.5 rounded-2xl mb-8 relative z-10 border border-white/5">
            <button
              onClick={() => { setViewMode('user'); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${viewMode === 'user' ? 'bg-gray-700 text-white shadow-lg ring-1 ring-white/10' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <UserGroupIcon className="w-4 h-4" />
              Katılımcı
            </button>
            <button
              onClick={() => { setViewMode('admin'); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${viewMode === 'admin' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <ShieldCheckIcon className="w-4 h-4" />
              Yönetici
            </button>
          </div>

          {/* Forms */}
          <div className="relative z-10">
            {viewMode === 'admin' ? (
              // Mod Login Form
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider ml-1">Yönetici E-Posta</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-600 pl-10"
                      placeholder="admin@linkyaris.com"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      <ShieldCheckIcon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider ml-1">Güvenlik Şifresi</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-600 pl-10"
                      placeholder="••••••••"
                    />
                     <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      <KeyIcon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                {error && (
                  <div className="text-red-400 text-xs font-bold bg-red-900/20 p-3 rounded-xl text-center border border-red-500/20 animate-pulse">
                    ⚠️ {error}
                  </div>
                )}
                <button
                  onClick={handleModLogin}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 group active:scale-[0.98]"
                >
                  <span>Panel Girişi Yap</span>
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              // User Login Form
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Takma Adın</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && name.trim() && onJoin(name, false)}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-4 text-white text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-600 text-center font-bold"
                    placeholder="Örn: KralLinkçi"
                  />
                </div>
                <button
                  onClick={() => name.trim() && onJoin(name, false)}
                  disabled={!name.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-2 text-lg">
                    Oyuna Katıl
                    <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        
        {/* Left Column: Main Action Area */}
        <div className="lg:col-span-8">
            <div className="bg-glass backdrop-blur-md p-8 md:p-10 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col">
              
              {/* Background Decorations */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]"></div>
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]"></div>

              <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-4 relative z-10">
                {isMod ? (
                    <>
                        <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                            <ComputerDesktopIcon className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div>
                            <span>Yönetim Paneli</span>
                            <div className="text-sm font-normal text-indigo-300 mt-1">Yarışma Kontrol Merkezi</div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                            <ShareIcon className="w-8 h-8 text-blue-400" />
                        </div>
                        <div>
                            <span>Link Gönderimi</span>
                            <div className="text-sm font-normal text-blue-300 mt-1">Sıranı kap, linkini paylaş</div>
                        </div>
                    </>
                )}
              </h2>
              
              {isMod ? (
                <div className="flex flex-col h-full relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                     <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-indigo-500/30 transition-colors">
                        <div>
                            <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Aktif Katılımcılar</div>
                            <div className="text-4xl font-black text-white group-hover:text-indigo-400 transition-colors">{users.length - 1}</div>
                        </div>
                        <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all">
                            <UserGroupIcon className="w-6 h-6" />
                        </div>
                     </div>
                     <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-green-500/30 transition-colors">
                        <div>
                            <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Toplanan Linkler</div>
                            <div className="text-4xl font-black text-white group-hover:text-green-400 transition-colors">{submissions.length}</div>
                        </div>
                        <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-green-500/20 group-hover:text-green-400 transition-all">
                            <ShareIcon className="w-6 h-6" />
                        </div>
                     </div>
                  </div>
                  
                  <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-2xl p-6 mb-auto">
                    <h3 className="text-indigo-300 font-bold mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        Durum Raporu
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Şu an bekleme modundasınız. Tüm katılımcıların linklerini yüklemesini bekleyin. Herkes hazır olduğunda aşağıdaki butonu kullanarak oylama oturumunu başlatabilirsiniz.
                    </p>
                  </div>

                  <button
                    onClick={onStartGame}
                    disabled={submissions.length === 0}
                    className="mt-8 w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-5 px-6 rounded-2xl transition-all shadow-xl hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 text-xl group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    {submissions.length === 0 ? (
                      <span className="relative z-10 flex items-center gap-2">
                         <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                         Linkler Bekleniyor...
                      </span>
                    ) : (
                      <>
                        <span className="relative z-10">Oylamayı Başlat</span>
                        <ArrowRightIcon className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                hasSubmitted ? (
                  <div className="flex flex-col items-center justify-center h-full text-center relative z-10">
                    <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-green-500/20 animate-pulse-slow">
                        <ShieldCheckIcon className="w-12 h-12 text-green-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-3">Linkin Ulaştı!</h3>
                    <p className="text-gray-400 max-w-md mx-auto mb-8">Moderatör (Berkay) diğer katılımcıları bekliyor. Oylama başladığında ekranın otomatik olarak değişecek.</p>
                    
                    <div className="bg-gray-800/50 rounded-xl p-4 w-full max-w-sm border border-white/5">
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Senin Linkin</div>
                        <div className="text-indigo-300 font-mono text-sm truncate px-2">
                            {submissions.find(s => s.userId === currentUser.id)?.url}
                        </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 relative z-10 h-full flex flex-col justify-center">
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2 ml-1">Web Sitesi Linki</label>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg placeholder-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2 ml-1">
                        Kısa Açıklama 
                        <span className="text-gray-500 text-xs font-normal ml-2 bg-gray-800 px-2 py-0.5 rounded-full">İsteğe bağlı</span>
                      </label>
                      <textarea
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        placeholder="Bu siteyi neden seçtin? Bizi ikna et..."
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none h-40 resize-none text-base placeholder-gray-600"
                      />
                    </div>
                    <button
                      onClick={() => url.trim() && onSubmitLink(url, desc)}
                      disabled={!url.trim()}
                      className="w-full mt-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-5 px-6 rounded-2xl transition-all transform hover:scale-[1.01] shadow-xl hover:shadow-blue-500/25 disabled:opacity-50 disabled:scale-100 disabled:shadow-none text-lg flex items-center justify-center gap-2"
                    >
                      <ShareIcon className="w-6 h-6" />
                      Linkini Gönder
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
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5 text-gray-400" />
                    Lobi
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Katılımcı Listesi</p>
                </div>
                <div className="bg-gray-800/80 px-3 py-1 rounded-lg border border-white/5">
                    <span className="text-indigo-400 font-bold">{users.length}</span> Kişi
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {users.map((u) => {
                  const userSubmitted = submissions.some(s => s.userId === u.id);
                  return (
                    <div key={u.id} className="group flex items-center justify-between bg-gray-800/40 hover:bg-gray-800/60 p-3 rounded-2xl border border-white/5 transition-all duration-300 hover:border-white/10 hover:shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-inner transition-transform group-hover:scale-110 ${u.isMod ? 'bg-gradient-to-br from-yellow-500 to-amber-700 text-white shadow-amber-900/20' : 'bg-gray-700 text-gray-300'}`}>
                          {u.isMod ? <ShieldCheckIcon className="w-6 h-6" /> : u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-bold text-sm ${u.id === currentUser.id ? "text-white" : "text-gray-300"}`}>
                            {u.name} {u.id === currentUser.id && <span className="text-gray-500 font-normal">(Sen)</span>}
                          </span>
                          {u.isMod ? (
                              <span className="text-[10px] text-yellow-500 uppercase tracking-wide font-bold mt-0.5">Admin</span>
                          ) : (
                              <span className="text-[10px] text-gray-500">Katılımcı</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {userSubmitted && !u.isMod && (
                          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                            <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Dummy QR Code Area to simulate 'Live' feel */}
              <div className="mt-4 pt-4 border-t border-white/5 text-center">
                  <div className="bg-white/5 rounded-xl p-3 flex items-center justify-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-not-allowed">
                      <QrCodeIcon className="w-5 h-5 text-white" />
                      <span className="text-xs text-gray-300">Oda Kodu: <span className="font-mono font-bold text-white tracking-widest">LNK-2024</span></span>
                  </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};