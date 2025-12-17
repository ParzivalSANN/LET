import React, { useState, useEffect } from 'react';
import { User, Lobby } from './types';
import { loginUser, registerUser, getUserJoinedLobbies, createLobby, joinLobby } from './services/storageService';
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

  useEffect(() => {
    const saved = localStorage.getItem('linkyaris_session');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      refreshLobbies(u.joinedLobbyIds);
    }
    setLoading(false);
  }, []);

  const refreshLobbies = async (ids: string[]) => {
    const lobbies = await getUserJoinedLobbies(ids);
    setJoinedLobbies(lobbies);
  };

  const handleLogin = async (u: string, p: string, isRegister: boolean) => {
    try {
      let loggedUser;
      if (isRegister) {
        const randomChar = CHARACTER_POOL[Math.floor(Math.random() * CHARACTER_POOL.length)];
        loggedUser = await registerUser(u, p, randomChar.name, randomChar.image, randomChar.color);
      } else {
        loggedUser = await loginUser(u, p);
      }
      setUser(loggedUser);
      localStorage.setItem('linkyaris_session', JSON.stringify(loggedUser));
      refreshLobbies(loggedUser.joinedLobbyIds);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCreateLobby = async (name: string) => {
    if (!user) return;
    const id = await createLobby(user.id, name);
    setActiveLobbyId(id);
    const updatedUser = await loginUser(user.username, user.password!);
    setUser(updatedUser);
    refreshLobbies(updatedUser.joinedLobbyIds);
  };

  const handleJoinLobby = async (id: string) => {
    if (!user) return;
    try {
      await joinLobby(user.id, id);
      setActiveLobbyId(id);
      const updatedUser = await loginUser(user.username, user.password!);
      setUser(updatedUser);
      refreshLobbies(updatedUser.joinedLobbyIds);
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen text-amber-500 font-black animate-pulse">ARENA YÜKLENİYOR...</div>;

  if (!user) return <LoginView onAuth={handleLogin} />;

  return (
    <div className="flex h-screen overflow-hidden bg-royale-dark text-white">
      {/* Sidebar - Royale Edition */}
      <aside className="w-80 bg-[#0f172a] border-r border-white/5 flex flex-col relative shadow-2xl z-20">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center text-black font-black">W</div>
            <h1 className="text-xl font-black tracking-tighter uppercase">WebIn<span className="text-amber-500">Royale</span></h1>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-amber-500/30 transition-all">
            <div className={`w-12 h-12 rounded-xl ${user.characterColor} flex items-center justify-center shrink-0 shadow-lg`}>
              <img src={user.avatarImage} alt="Avatar" className="w-10 h-10" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest truncate">{user.username}</p>
              <p className="text-lg font-bold truncate leading-tight">{user.nickname}</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2 mb-4">Aktif Arenalarım</p>
            <div className="space-y-2">
              <button 
                onClick={() => setActiveLobbyId(null)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 font-bold ${!activeLobbyId ? 'bg-amber-500 text-black' : 'hover:bg-white/5 text-gray-400'}`}
              >
                <Squares2X2Icon className="w-5 h-5" /> Ana Ekran
              </button>
              
              {joinedLobbies.map(lobby => (
                <button 
                  key={lobby.id}
                  onClick={() => setActiveLobbyId(lobby.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${activeLobbyId === lobby.id ? 'bg-white/10 text-amber-500 border border-amber-500/20' : 'hover:bg-white/5 text-gray-400'}`}
                >
                  <span className="font-bold truncate flex items-center gap-2">
                    <TrophyIcon className={`w-4 h-4 ${activeLobbyId === lobby.id ? 'text-amber-500' : 'text-gray-600'}`} />
                    {lobby.name}
                  </span>
                  <span className="text-[10px] font-mono bg-black/40 px-2 py-1 rounded text-gray-500">#{lobby.id}</span>
                </button>
              ))}
              
              {joinedLobbies.length === 0 && <p className="text-xs text-gray-600 px-4 italic py-4">Henüz bir arenaya girmedin.</p>}
            </div>
          </div>
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <button 
            onClick={() => { localStorage.clear(); setUser(null); }}
            className="w-full py-4 px-4 text-xs font-black text-red-400 hover:bg-red-500/10 rounded-2xl transition-all flex items-center justify-center gap-2 border border-transparent hover:border-red-500/20"
          >
            <PowerIcon className="w-4 h-4" /> OTURUMU KAPAT
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-animated relative z-10">
        {activeLobbyId ? (
          <PersistentLobbyView 
            lobbyId={activeLobbyId} 
            user={user} 
            onClose={() => setActiveLobbyId(null)} 
          />
        ) : (
          <Dashboard 
            onCreate={handleCreateLobby} 
            onJoin={handleJoinLobby} 
          />
        )}
      </main>
    </div>
  );
};

export default App;