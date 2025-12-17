import React, { useState } from 'react';
import { PlusIcon, HashtagIcon, FireIcon } from '@heroicons/react/24/outline';

interface Props {
  onCreate: (name: string) => void;
  onJoin: (id: string) => void;
}

const Dashboard: React.FC<Props> = ({ onCreate, onJoin }) => {
  const [lobbyName, setLobbyName] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');

  return (
    <div className="p-12 max-w-6xl mx-auto space-y-16 pb-20">
      <div className="bg-gradient-to-br from-indigo-600/10 to-amber-500/10 p-16 rounded-[4rem] border border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-5">
           <FireIcon className="w-64 h-64 text-amber-500" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-12 h-0.5 bg-amber-500"></span>
            <span className="text-amber-500 font-black uppercase tracking-[0.4em] text-xs">Komuta Merkezi</span>
          </div>
          <h2 className="text-7xl font-black mb-4 tracking-tighter uppercase italic leading-none">Hoş Geldin <br/><span className="text-amber-500">Savaşçı!</span></h2>
          <p className="text-gray-400 text-xl font-medium max-w-2xl leading-relaxed">Yeni bir arena kurarak kuralları sen koy veya mevcut bir koda sahip arenaya sızarak linklerini yarıştır.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="bg-[#0f172a] p-12 rounded-[3.5rem] border border-white/5 space-y-8 relative group hover:border-indigo-500/30 transition-all duration-500 shadow-xl">
          <div className="bg-indigo-500/10 w-16 h-16 rounded-2xl flex items-center justify-center text-indigo-400 shadow-lg group-hover:scale-110 transition-transform">
            <PlusIcon className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-3xl font-black uppercase italic tracking-tight">Arena Oluştur</h3>
            <p className="text-gray-500 text-sm mt-2">Kendi turnuvanı başlat ve arkadaşlarını davet et.</p>
          </div>
          <input 
            type="text" 
            placeholder="Arena Adı (Örn: En İyi Portfolio)"
            value={lobbyName}
            onChange={e => setLobbyName(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 outline-none focus:ring-2 focus:ring-indigo-500 text-white font-medium"
          />
          <button 
            onClick={() => lobbyName && onCreate(lobbyName)}
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/10 hover:shadow-indigo-600/30"
          >
            ARENAYI KUR
          </button>
        </div>

        <div className="bg-[#0f172a] p-12 rounded-[3.5rem] border border-white/5 space-y-8 relative group hover:border-amber-500/30 transition-all duration-500 shadow-xl">
          <div className="bg-amber-500/10 w-16 h-16 rounded-2xl flex items-center justify-center text-amber-500 shadow-lg group-hover:scale-110 transition-transform">
            <HashtagIcon className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-3xl font-black uppercase italic tracking-tight">Arenaya Sız</h3>
            <p className="text-gray-500 text-sm mt-2">Arkadaşından aldığın 4 haneli kodu buraya gir.</p>
          </div>
          <input 
            type="text" 
            placeholder="Arena Kodu"
            maxLength={4}
            value={lobbyCode}
            onChange={e => setLobbyCode(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 outline-none focus:ring-2 focus:ring-amber-500 text-center text-4xl font-black tracking-[0.5em] text-amber-500 font-mono"
          />
          <button 
            onClick={() => lobbyCode && onJoin(lobbyCode)}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black py-5 rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-xl shadow-amber-500/10 hover:shadow-amber-500/30"
          >
            GİRİŞ YAP
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;