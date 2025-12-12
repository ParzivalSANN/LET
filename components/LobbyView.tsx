import React, { useState, useEffect } from 'react';
import { User, Submission } from '../types';
import { ShareIcon, UserGroupIcon, ShieldCheckIcon, ArrowRightIcon, ComputerDesktopIcon, ClockIcon, LinkIcon, CheckIcon, ExclamationCircleIcon, ClipboardDocumentIcon, SignalIcon } from '@heroicons/react/24/outline';

interface LobbyViewProps {
  roomId: string;
  currentUser: User | null;
  users: User[];
  submissions: Submission[];
  onJoin: (name: string, password?: string, isMod?: boolean, roomInput?: string) => any; 
  onSubmitLink: (url: string, desc: string) => void;
  onStartGame: (duration: number) => void;
  isMod: boolean;
  externalError?: string;
  isLoading?: boolean;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomId,
  currentUser,
  users,
  submissions,
  onJoin,
  onSubmitLink,
  onStartGame,
  isMod,
  externalError,
  isLoading
}) => {
  const safeUsers = users || [];
  const safeSubmissions = submissions || [];

  // Login States
  const [roomInput, setRoomInput] = useState(roomId || '');
  const [name, setName] = useState('');
  const [userPassword, setUserPassword] = useState(''); 
  const [isModLogin, setIsModLogin] = useState(false); // Toggle between User/Mod
  
  // Mod Specifics
  const [email, setEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Game Settings States
  const [duration, setDuration] = useState(30);
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');

  const hasSubmitted = currentUser && safeSubmissions.some(s => s.userId === currentUser.id);

  // Sync prop roomId to local input if it changes from URL
  useEffect(() => {
    if (roomId) setRoomInput(roomId);
  }, [roomId]);

  useEffect(() => {
    if (externalError) {
        setError(externalError);
        setTimeout(() => setError(''), 4000);
    }
  }, [externalError]);

  const handleCopyLink = async () => {
    const currentUrl = window.location.href.replace('https://', 'http://');
    
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for HTTP/Mobile where clipboard API might be blocked
      const input = document.getElementById('share-link-input') as HTMLInputElement;
      if (input) {
        input.select();
        input.setSelectionRange(0, 99999); // For mobile devices
        try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            setError('Lütfen linki manuel kopyala.');
        }
      }
    }
  };

  const handleJoinClick = () => {
    setError('');
    
    if (!roomInput.trim()) {
        setError('Oda kodunu girmelisin.');
        return;
    }

    if (isModLogin) {
        // Moderator Login
        const cleanEmail = email.trim().toLowerCase();
        if (cleanEmail === 'berkay-34ist@hotmail.com' && adminPassword === '123321') {
           onJoin('Moderatör', "", true, roomInput);
        } else {
           setError('Hatalı yönetici bilgileri!');
        }
    } else {
        // User Login
        if (!name.trim()) {
            setError('İsmini girmelisin.');
            return;
        }
        if (name.length > 12) {
            setError('İsim çok uzun.');
            return;
        }
        if (!userPassword.trim() || userPassword.length < 4) {
             setError('Şifre en az 4 karakter olmalı.');
             return;
        }
        onJoin(name, userPassword, false, roomInput);
    }
  };

  const handleUrlSubmit = () => {
    let formattedUrl = url.trim();
    if (!formattedUrl) return;
    if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
    }
    onSubmitLink(formattedUrl, desc);
  };

  // 1. LOGIN SCREEN
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[90vh] animate-fade-in relative px-4">
        
        {/* Main Card */}
        <div className="bg-[#1e1b4b]/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-indigo-500/20 w-full max-w-[400px] relative overflow-hidden transition-all duration-500 ring-1 ring-white/10">
          
          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <h1 className="text-5xl font-black text-white mb-2 tracking-tighter drop-shadow-lg">
              Link<span className="text-[#818cf8]">Yarış</span>
            </h1>
            <p className="text-gray-400 text-sm font-medium tracking-wide">Oda kodunu gir ve katıl!</p>
          </div>

          <div className="space-y-5 relative z-10">
            
            {/* Room Code Field */}
            <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">ODA KODU</label>
                <input
                    type="text"
                    inputMode="numeric"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value)}
                    className="w-full bg-[#0f172a]/60 border border-indigo-500/30 rounded-xl py-4 text-center text-3xl font-black text-white focus:ring-2 focus:ring-[#6366f1] focus:border-transparent outline-none tracking-[0.5em] placeholder-gray-700 transition-all font-mono shadow-inner"
                    placeholder="0000"
                    maxLength={4}
                />
            </div>

            {isModLogin ? (
                 // Mod Fields
                 <>
                    <div className="space-y-1.5 animate-fade-in">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">E-POSTA</label>
                        <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#0f172a]/60 border border-gray-700/50 rounded-xl px-4 py-4 text-white text-lg focus:ring-2 focus:ring-[#6366f1] outline-none font-medium placeholder-gray-600 transition-all"
                        placeholder="admin@mail.com"
                        />
                    </div>
                    <div className="space-y-1.5 animate-fade-in">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">ŞİFRE</label>
                        <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full bg-[#0f172a]/60 border border-gray-700/50 rounded-xl px-4 py-4 text-white text-lg focus:ring-2 focus:ring-[#6366f1] outline-none tracking-widest placeholder-gray-600 transition-all"
                        placeholder="••••"
                        />
                    </div>
                 </>
            ) : (
                // User Fields
                <>
                    <div className="space-y-1.5 animate-fade-in">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">İSMİN</label>
                        <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#0f172a]/60 border border-gray-700/50 rounded-xl px-4 py-4 text-white text-lg focus:ring-2 focus:ring-[#6366f1] outline-none font-medium placeholder-gray-600 transition-all"
                        placeholder="Ali"
                        />
                    </div>
                    
                    <div className="space-y-1.5 animate-fade-in">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">ŞİFRE</label>
                        <input
                        type="password"
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleJoinClick()}
                        className="w-full bg-[#0f172a]/60 border border-gray-700/50 rounded-xl px-4 py-4 text-white text-lg focus:ring-2 focus:ring-[#6366f1] outline-none tracking-widest placeholder-gray-600 transition-all"
                        placeholder="••••"
                        />
                        <div className="text-[10px] text-gray-500 text-right pr-1">Min. 4 karakter</div>
                    </div>
                </>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center py-3 rounded-xl animate-bounce-short">
                    {error}
                </div>
            )}

            <button
              onClick={handleJoinClick}
              disabled={isLoading}
              className="w-full bg-[#5b21b6] hover:bg-[#4c1d95] text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-[#5b21b6]/40 flex items-center justify-center gap-2 text-lg group mt-2"
            >
              {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                  <>
                    {isModLogin ? 'Yönetici Girişi' : 'Odaya Katıl'} 
                    <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
              )}
            </button>
            
            <div className="text-center pt-4">
                <button 
                    onClick={() => { setIsModLogin(!isModLogin); setError(''); }}
                    className="text-gray-500 text-xs font-bold hover:text-indigo-400 transition-colors underline decoration-gray-700 underline-offset-4 hover:decoration-indigo-500"
                >
                    {isModLogin ? 'Katılımcı Girişine Dön' : 'Yönetici Girişi'}
                </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // 2. LOBBY INTERFACE (Logged In)
  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        
        {/* Left Column */}
        <div className="lg:col-span-8">
            <div className="bg-glass backdrop-blur-md p-8 md:p-10 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col">
              
              <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
                <h2 className="text-3xl font-bold text-white flex items-center gap-4 relative z-10">
                    {isMod ? (
                        <>
                            <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                                <ComputerDesktopIcon className="w-8 h-8 text-indigo-400" />
                            </div>
                            <span>Yönetim Paneli</span>
                        </>
                    ) : (
                        <>
                            <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                                <ShareIcon className="w-8 h-8 text-blue-400" />
                            </div>
                            <span>Link Gönderimi</span>
                        </>
                    )}
                </h2>
                
                {/* Room ID and Link Share */}
                <div className="flex flex-col items-end gap-2 w-full md:w-auto relative z-20">
                     <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-white/10 w-full md:w-auto">
                           <span className="text-gray-400 text-xs font-bold select-none">ODA:</span>
                           <span className="font-mono font-bold text-xl text-white tracking-widest">{roomId}</span>
                        </div>
                     </div>

                     <div className="bg-indigo-900/40 border border-indigo-500/30 rounded-xl p-3 w-full md:w-80">
                         <div className="flex items-center gap-2 mb-2">
                             <SignalIcon className="w-4 h-4 text-indigo-400" />
                             <span className="text-[10px] font-bold text-indigo-200 uppercase">IP Linki (Manuel Kopyala)</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <input 
                               id="share-link-input"
                               readOnly
                               value={window.location.href.replace('https://', 'http://')}
                               className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-3 text-sm text-gray-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 select-all cursor-text"
                               onClick={(e) => e.currentTarget.select()}
                             />
                             <button 
                                onClick={handleCopyLink}
                                className="bg-indigo-600 hover:bg-indigo-500 p-3 rounded-lg text-white transition-colors shrink-0"
                                title="Kopyala"
                             >
                                {copied ? <CheckIcon className="w-5 h-5" /> : <ClipboardDocumentIcon className="w-5 h-5" />}
                             </button>
                         </div>
                         <div className="mt-2 flex items-start gap-1.5 text-[10px] text-orange-300/80 leading-relaxed">
                            <ExclamationCircleIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>
                                <strong>DİKKAT:</strong> Telefondan girerken linkin başında <strong>sadece http://</strong> olduğuna emin olun.
                            </span>
                         </div>
                     </div>
                     
                     {error && <span className="text-xs text-red-400 font-bold animate-fade-in mt-1">{error}</span>}
                </div>
              </div>
              
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
                // USER VIEW
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