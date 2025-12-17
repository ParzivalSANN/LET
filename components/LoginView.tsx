import React, { useState } from 'react';
import { TrophyIcon, FireIcon } from '@heroicons/react/24/solid';

interface Props {
  onAuth: (u: string, p: string, isRegister: boolean) => void;
}

const LoginView: React.FC<Props> = ({ onAuth }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) onAuth(username, password, isRegister);
  };

  return (
    <div className="h-screen flex items-center justify-center p-4">
      <div className="bg-[#0f172a]/90 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
        
        <div className="text-center mb-10 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-bold tracking-widest uppercase mb-4 border border-amber-500/20">
            <FireIcon className="w-3 h-3" /> Season 1: Alpha
          </div>
          <h1 className="text-5xl font-black text-white mb-2 tracking-tighter">
            WebIn<span className="text-amber-500">Royale</span>
          </h1>
          <p className="text-gray-400 text-sm">Arenaya adım at ve en iyi linki sen paylaş!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Kullanıcı Adı</label>
            <input 
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder-gray-700"
              placeholder="Savaşçı Adın"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Gizli Şifre</label>
            <input 
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder-gray-700"
              placeholder="••••••••"
            />
          </div>

          <button className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-black py-4 rounded-2xl shadow-xl shadow-amber-500/10 transition-all transform active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2">
            {isRegister ? 'Arenaya Kaydol' : 'Savaşa Gir'}
            <TrophyIcon className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 text-center relative z-10">
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-gray-500 text-xs hover:text-white transition-colors underline underline-offset-4 decoration-gray-800"
          >
            {isRegister ? 'Zaten hesabın var mı? Giriş yap' : 'Hesabın yok mu? Yeni bir savaşçı yarat'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;