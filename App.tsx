
import React, { useState, useEffect } from 'react';
import { User, Lobby } from './types';
import { loginUser, registerUser, getUserJoinedLobbies, createLobby, joinLobby } from './services/storageService';
import { generateAvatarImage } from './services/geminiService';
import { CHARACTER_POOL } from './data/characters';
import Dashboard from './components/Dashboard';
import LoginView from './components/LoginView';
import PersistentLobbyView from './components/PersistentLobbyView';
import { PowerIcon, Squares2X2Icon, TrophyIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeLobbyId, setActiveLobbyId] = useState<string | null>(null);
  const [joinedLobbies, setJoinedLobbies] = useState<Lobby[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('linkyaris_session');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setUser(u);
        refreshLobbies(u.joinedLobbyIds || []);
      } catch (e) {
        localStorage.removeItem('linkyaris_session');
      }
    }
    setLoading(false);
  }, []);

  const refreshLobbies = async (ids: string[]) => {
    if(!ids || ids.length === 0) return;
    const lobbies = await getUserJoinedLobbies(ids);
    setJoinedLobbies(lobbies);
  };

  const handleAuth = async (schoolNo: string, p: string, isRegister: boolean, realName?: string) => {
    try {
      let loggedUser;
      if (isRegister) {
        if(!realName) throw new Error("İsim alanı zorunludur!");
        setIsGenerating(true);
        
        const randomChar = CHARACTER_POOL[Math.floor(Math.random() * CHARACTER_POOL.length)];
        let aiAvatar = await generateAvatarImage(randomChar.name);
        
        // --- YEDEK MEKANİZMASI ---
        // Eğer AI görsel üretemezse, şık bir SVG placeholder oluşturuyoruz
        if (!aiAvatar) {
          const initials = realName.charAt(0).toUpperCase();
          const bgColor = randomChar.color.replace('bg-', '');
          aiAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23${bgColor === 'amber-500' ? 'f59e0b' : '3b82f6'}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="80" fill="white" font-weight="bold">${initials}</text></svg>`;
        }
        
        loggedUser = await registerUser(p, realName, schoolNo, aiAvatar, randomChar.color);
        loggedUser.nickname = randomChar.name;
        setIsGenerating(false);
      } else {
        loggedUser = await loginUser(schoolNo, p);
      }
      setUser(loggedUser);
      localStorage.setItem('linkyaris_session', JSON.stringify(loggedUser));
      refreshLobbies(loggedUser.joinedLobbyIds || []);
    } catch (e: any) {
      setIsGenerating(false);
      alert(e.message);
    }
  };

  const handleCreateLobby = async (name: string) => {
    if (!user) return;
    try {
      const lobbyId = await createLobby(user.id, name);
      await handleJoinLobby(lobbyId);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleJoinLobby = async (id: string) => {
    if (!user) return;
    try {
      await joinLobby(user.id, id);
      const updatedUser = { ...user, joinedLobbyIds: [...new Set([...(user.joinedLobbyIds || []), id])] };
      setUser(updatedUser);
      localStorage.setItem('linkyaris_session', JSON.stringify(updatedUser));
      setActiveLobbyId(id);
      refreshLobbies(updatedUser.joinedLobbyIds);
    } catch (e: any) {
      alert("Oda bulunamadı veya katılım başarısız.");
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen text-amber-500 font-black animate-pulse">ARENA YÜKLENİYOR...</div>;
  
  if (isGenerating) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#020617] text-white p-10 text-center">
        <div className="w-24 h-24 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(245,158,11,0.2)]"></div>
        <h2 className="text-4xl font-black mb-4 italic uppercase tracking-tighter">Karakterin Tasarlanıyor...</h2>
        <p className="text-gray-400 max-w-md font-medium leading-relaxed">Gemini AI senin için benzersiz bir savaşçı avatarı oluşturuyor. Bu işlem birkaç saniye sürebilir, lütfen ayrılma.</p>
    </div>
  );

  if (!user) return <LoginView onAuth={handleAuth} />;

  return (
    <div className="flex h-screen overflow-hidden bg-[#020617] text-white">
      <aside className="w-80 bg-[#0f172a] border-r border-white/5 flex flex-col relative shadow-2xl z-20">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center text-black font-black shadow-lg">W</div>
            <h1 className="text-xl font-black tracking-tighter uppercase">WebIn<span className="text-amber-500">Royale</span></h1>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-3 hover:border-white/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-gray-800 overflow-hidden border border-white/10 shadow-inner">
                {user.avatarImage ? (
                  <img src={user.avatarImage} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-amber-500">👤</div>
                )}
              </div>
              <div className="truncate">
                  <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest leading-none mb-1">{user.schoolNumber}</p>
                  <p className="text-sm font-bold truncate leading-tight text-white">{user.realName}</p>
              </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-6 space-y-2">
            <button onClick={() => setActiveLobbyId(null)} className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 font-bold ${!activeLobbyId ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'hover:bg-white/5 text-gray-400'}`}>
                <Squares2X2Icon className="w-5 h-5" /> Ana Ekran
            </button>
            {joinedLobbies.map(lobby => (
                <button key={lobby.id} onClick={() => setActiveLobbyId(lobby.id)} className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${activeLobbyId === lobby.id ? 'bg-white/10 text-amber-500 border border-amber-500/20' : 'hover:bg-white/5 text-gray-400'}`}>
                  <span className="font-bold truncate flex items-center gap-2"><TrophyIcon className="w-4 h-4" />{lobby.name}</span>
                </button>
            ))}
        </nav>
        <div className="p-6 border-t border-white/5">
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-4 text-xs font-black text-red-400 hover:bg-red-500/10 rounded-2xl transition-all flex items-center justify-center gap-2">
            <PowerIcon className="w-4 h-4" /> OTURUMU KAPAT
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-animated relative z-10">
        {activeLobbyId ? (
          <PersistentLobbyView lobbyId={activeLobbyId} user={user} onClose={() => setActiveLobbyId(null)} />
        ) : (
          <Dashboard onCreate={handleCreateLobby} onJoin={handleJoinLobby} />
        )}
      </main>
    </div>
  );
}; export default App;
