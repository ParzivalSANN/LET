import React, { useState, useEffect } from 'react';
import { User, Submission } from '../types';
import { CHARACTER_POOL, GameCharacter } from '../data/characters';
import { ShareIcon, UserGroupIcon, ShieldCheckIcon, ArrowRightIcon, ComputerDesktopIcon, ClockIcon, ClipboardDocumentIcon, SignalIcon, QrCodeIcon, CubeTransparentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface LobbyViewProps {
  roomId: string;
  currentUser: User | null;
  users: User[];
  submissions: Submission[];
  characterPool: GameCharacter[];
  onJoin: (roomInput: string, name: string, password?: string, isMod?: boolean, avatar?: string, characterColor?: string, avatarImage?: string) => any; 
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
  characterPool,
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
  
  // Random Identity State
  const [generatedIdentity, setGeneratedIdentity] = useState<GameCharacter | null>(null);
  
  const [isModLogin, setIsModLogin] = useState(false);
  const [showQr, setShowQr] = useState(false);
  
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
      const input = document.getElementById('share-link-input') as HTMLInputElement;
      if (input) {
        input.select();
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

  const handleRandomizeIdentity = () => {
    // 1. Get list of avatar names already taken
    // Using nickname since the character name is stored there for Users
    const takenNames = new Set(
        safeUsers
            .filter(u => !u.isMod) 
            .map(u => u.nickname)
    );
    
    // Filter the 88 character pool
    const availableCharacters = CHARACTER_POOL.filter(c => !takenNames.has(c.name));

    if (availableCharacters.length === 0) {
        setError('Oda tamamen dolu! (88/88) Boş karakter kalmadı.');
        return;
    }

    const randomIndex = Math.floor(Math.random() * availableCharacters.length);
    setGeneratedIdentity(availableCharacters[randomIndex]);
    setError('');
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
           onJoin(roomInput, 'Moderatör', adminPassword, true, '🛡️');
        } else {
           setError('Hatalı yönetici bilgileri!');
        }
    } else {
        // User Login
        if (!generatedIdentity) {
            setError('Lütfen önce bir kimlik oluştur!');
            return;
        }
        
        onJoin(
            roomInput, 
            generatedIdentity.name, 
            undefined, 
            false, 
            "👤", 
            generatedIdentity.color, 
            generatedIdentity.image 
        );
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

  // Helper function to resolve image URL for list display
  // Using nickname to find character identity
  const getUserImage = (u: User) => {
      if (u.avatarImage) return u.avatarImage;
      // Try to find it in the pool by matching the nickname (which stores the char name)
      const found = CHARACTER_POOL.find(c => c.name === u.nickname);
      return found ? found.image : null;
  };

  // 1. LOGIN SCREEN
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[90vh] animate-fade-in relative px-4">
        
        {/* Main Card */}
        <div className="bg-[#1e1b4b]/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-indigo-500/20 w-full max-w-[400px] relative overflow-hidden transition-all duration-500 ring-1 ring-white/10">
          
          <div className="text-center mb-8 relative z-10">
            <h1 className="text-5xl font-black text-white mb-2 tracking-tighter drop-shadow-lg">
              Link<span className="text-[#818cf8]">Yarış</span>
            </h1>
            <p className="text-gray-400 text-sm font-medium tracking-wide">
                {isModLogin ? 'Oda Kodu Belirle & Yönet' : 'Rastgele Karakter Ata ve Katıl!'}
            </p>
          </div>

          <div className="space-y-5 relative z-10">
            
            <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    {isModLogin ? 'ODA KODU (OLUŞTUR/GİR)' : 'ODA KODU'}
                </label>
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
                <div className="space-y-3 animate-fade-in">
                     <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">KİMLİK (Otomatik Atanır)</label>
                     
                     {generatedIdentity ? (
                         <div className={`
                            relative overflow-hidden rounded-2xl transition-all duration-300 transform border-2 border-white/20 shadow-2xl
                            ${generatedIdentity.color}
                         `}>
                             <div className="p-6 flex flex-col items-center justify-center text-center relative z-10 gap-2">
                                 <img 
                                    src={generatedIdentity.image} 
                                    alt={generatedIdentity.name} 
                                    className="w-24 h-24 object-contain drop-shadow-md transition-transform hover:scale-110 duration-300"
                                    onError={(e) => {
                                        // If image fails, show user emoji as fallback but keep space
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                 />
                                 <div className="hidden text-6xl drop-shadow-md filter">👤</div>
                                 
                                 <div className="bg-black/40 px-3 py-1 rounded-lg backdrop-blur-sm mt-2">
                                     <span className="text-white font-bold text-lg tracking-wide capitalize">{generatedIdentity.name}</span>
                                 </div>
                             </div>
                             <button 
                                onClick={handleRandomizeIdentity}
                                className="absolute top-2 right-2 bg-black/30 hover:bg-black/50 p-2 rounded-full transition-colors z-20"
                                title="Değiştir"
                             >
                                 <CubeTransparentIcon className="w-5 h-5 text-white" />
                             </button>
                             <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                         </div>
                     ) : (
                         <button 
                            onClick={handleRandomizeIdentity}
                            className="w-full bg-gray-800/60 border border-gray-600 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-gray-800 hover:border-indigo-500 hover:border-solid transition-all group"
                         >
                             <div className="bg-indigo-500/20 p-4 rounded-full group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
                                <CubeTransparentIcon className="w-10 h-10 text-indigo-400" />
                             </div>
                             <span className="text-gray-300 font-bold text-lg group-hover:text-white">
                                Rastgele Kimlik Ata 🎲
                             </span>
                             <span className="text-[10px] text-gray-500">88 özel karakterden biri sana gelir.</span>
                         </button>
                     )}
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center py-3 rounded-xl animate-bounce-short">
                    {error}
                </div>
            )}

            <button
              onClick={handleJoinClick}
              disabled={isLoading}
              className={`w-full text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-lg group mt-2 
                ${isModLogin 
                    ? 'bg-[#5b21b6] hover:bg-[#4c1d95] hover:shadow-[#5b21b6]/40' 
                    : generatedIdentity 
                        ? 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-600/40' 
                        : 'bg-gray-700 cursor-not-allowed opacity-50'
                }`}
            >
              {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                  <>
                    {isModLogin ? 'Yönetici Girişi' : 'Bu Kimlikle Katıl'} 
                    <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
              )}
            </button>
            
            <div className="text-center pt-4">
                <button 
                    onClick={() => { setIsModLogin(!isModLogin); setError(''); setGeneratedIdentity(null); }}
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
        
        <div className="lg:col-span-8">
            <div className="bg-glass backdrop-blur-md p-8 md:p-10 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-y-auto min-h-[500px] flex flex-col">
              
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
                        {isMod && (
                             <button 
                                onClick={() => setShowQr(!showQr)}
                                className={`p-2 rounded-xl border transition-colors ${showQr ? 'bg-white text-black border-white' : 'bg-black/40 text-gray-400 border-white/10 hover:text-white'}`}
                             >
                                 <QrCodeIcon className="w-6 h-6" />
                             </button>
                        )}
                     </div>

                     {showQr && isMod && (
                         <div className="absolute top-16 right-0 z-50 p-4 bg-white rounded-2xl shadow-2xl animate-fade-in border-4 border-indigo-500">
                             <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}&bgcolor=ffffff`}
                                alt="Room QR Code"
                                className="w-48 h-48"
                             />
                             <div className="text-center text-black font-bold mt-2 text-sm">Odaya Katıl</div>
                         </div>
                     )}

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
                     </div>
                     
                     {error && <span className="text-xs text-red-400 font-bold animate-fade-in mt-1">{error}</span>}
                </div>
              </div>
              
              {isMod ? (
                // MODERATOR VIEW
                <div className="flex flex-col h-full relative z-10 space-y-8">
                   
                   {/* 1. Quick Stats Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-gray-800/50 p-6 rounded-2xl border border-white/5">
                        <div className="text-gray-400 text-xs font-bold uppercase mb-2">Katılımcılar</div>
                        <div className="text-4xl font-black text-white">{safeUsers.length - 1}</div>
                     </div>
                     <div className="bg-gray-800/50 p-6 rounded-2xl border border-white/5">
                        <div className="text-gray-400 text-xs font-bold uppercase mb-2">Gelen Linkler</div>
                        <div className="text-4xl font-black text-white">{safeSubmissions.length}</div>
                     </div>
                  </div>

                  {/* 2. Game Settings & Start */}
                  <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-indigo-300 font-bold flex items-center gap-2">
                            <ClockIcon className="w-5 h-5" />
                            Oylama Süresi
                        </h3>
                        <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg font-bold font-mono">
                            {duration} sn
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
                    
                    <button
                        onClick={() => onStartGame(duration)}
                        disabled={safeSubmissions.length === 0}
                        className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 px-6 rounded-2xl transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 text-xl border-t border-white/10"
                    >
                        {safeSubmissions.length === 0 ? "Link Bekleniyor..." : "Oylamayı Başlat"}
                        {safeSubmissions.length > 0 && <ArrowRightIcon className="w-6 h-6" />}
                    </button>
                  </div>
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
                {safeUsers.map((u) => {
                    const displayImage = getUserImage(u);
                    
                    return (
                    <div key={u.id} className="flex items-center justify-between bg-gray-800/40 p-3 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl shadow-inner ${u.isMod ? 'bg-amber-600 text-white' : (u.characterColor || 'bg-gray-700')} text-white overflow-hidden`}>
                          {u.isMod ? (
                              <ShieldCheckIcon className="w-5 h-5" /> 
                          ) : (
                              displayImage ? (
                                  <img 
                                    src={displayImage} 
                                    alt={u.nickname} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // Hide image, show emoji fallback
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                              ) : (
                                  u.nickname || "👤"
                              )
                          )}
                          <div className="hidden text-xl">👤</div>
                        </div>
                        <span className={`font-bold text-sm ${u.id === currentUser.id ? "text-white" : "text-gray-300"}`}>
                            {u.nickname} {u.id === currentUser.id && "(Sen)"}
                        </span>
                      </div>
                      {safeSubmissions.some(s => s.userId === u.id) && !u.isMod && (
                          <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                      )}
                    </div>
                )})}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};