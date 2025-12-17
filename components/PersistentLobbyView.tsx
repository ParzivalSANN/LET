
import React, { useState, useEffect } from 'react';
import { Lobby, User, Submission, LobbyStatus } from '../types';
import { subscribeToLobby, addSubmission, castVote, closeLobby } from '../services/storageService';
import { StarIcon, CheckCircleIcon, TrophyIcon, ArrowTopRightOnSquareIcon, PlusCircleIcon, FireIcon, UserGroupIcon } from '@heroicons/react/24/solid';

interface Props {
  lobbyId: string;
  user: User;
  onClose: () => void;
}

const PersistentLobbyView: React.FC<Props> = ({ lobbyId, user, onClose }) => {
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    const unsub = subscribeToLobby(lobbyId, (updatedLobby) => {
      // Firebase boş dizileri bazen null/undefined döndürdüğü için koruma ekliyoruz
      if (updatedLobby && !updatedLobby.submissions) {
        updatedLobby.submissions = [];
      }
      setLobby(updatedLobby);
    });
    return () => unsub();
  }, [lobbyId]);

  const handleAdd = async () => {
    if (!url || !lobby) return;
    const newSub: Submission = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      nickname: user.nickname,
      avatarImage: user.avatarImage,
      url: url.startsWith('http') ? url : `https://${url}`,
      description: desc,
      votes: {},
      createdAt: Date.now()
    };
    await addSubmission(lobbyId, newSub);
    setShowAdd(false);
    setUrl('');
    setDesc('');
  };

  if (!lobby) return <div className="p-10 text-amber-500 font-bold animate-pulse text-center">ARENA YÜKLENİYOR...</div>;

  const isCreator = lobby.creatorId === user.id;
  const safeSubmissions = lobby.submissions || [];
  const hasSubmitted = safeSubmissions.some(s => s.userId === user.id);

  // Sıralama Mantığı: En yüksek puanlılar en üstte
  const sortedSubmissions = [...safeSubmissions].sort((a, b) => {
    const avgA = (Object.values(a.votes || {}) as number[]).reduce((sum: number, v: number) => sum + v, 0) / (Object.values(a.votes || {}).length || 1);
    const avgB = (Object.values(b.votes || {}) as number[]).reduce((sum: number, v: number) => sum + v, 0) / (Object.values(b.votes || {}).length || 1);
    return avgB - avgA;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Royale Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-[#0f172a] p-12 rounded-[3rem] border border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/5 blur-[120px]"></div>
        
        <div className="relative z-10 text-center md:text-left">
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mb-4">
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${lobby.status === LobbyStatus.OPEN ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}>
              {lobby.status === LobbyStatus.OPEN ? '• ARENA AÇIK' : '• TAMAMLANDI'}
            </span>
            <span className="bg-white/5 px-4 py-1.5 rounded-full text-gray-400 font-mono text-xs border border-white/5">ARENA #{lobbyId}</span>
            <span className="flex items-center gap-2 text-gray-500 text-xs font-bold bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                <UserGroupIcon className="w-4 h-4" /> {safeSubmissions.length} YARIŞMACI
            </span>
          </div>
          <h2 className="text-6xl font-black tracking-tighter text-white uppercase italic">{lobby.name}</h2>
          <p className="text-gray-400 mt-4 max-w-xl font-medium">Bu arenada en yüksek puanı alan web sitesi şampiyonluğunu ilan eder. Adil oyla, en iyiyi seç!</p>
        </div>

        <div className="flex flex-col gap-4 relative z-10 w-full md:w-auto">
          {lobby.status === LobbyStatus.OPEN && !hasSubmitted && (
            <button 
              onClick={() => setShowAdd(true)}
              className="bg-amber-500 hover:bg-amber-400 text-black px-10 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(251,191,36,0.2)] hover:scale-105 active:scale-95 uppercase tracking-widest"
            >
              <PlusCircleIcon className="w-6 h-6" /> LİNKİNİ PAYLAŞ
            </button>
          )}
          {isCreator && lobby.status === LobbyStatus.OPEN && (
            <button 
              onClick={() => confirm('Arenayı sonlandırmak istediğine emin misin?') && closeLobby(lobbyId)}
              className="bg-transparent hover:bg-red-500/10 text-red-500 px-8 py-4 rounded-[1.5rem] font-bold border border-red-500/20 transition-all uppercase text-xs tracking-widest"
            >
              ARENAYI KAPAT
            </button>
          )}
        </div>
      </div>

      {/* Contestants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sortedSubmissions.map((sub, index) => {
          const votes = sub.votes || {};
          const myVote = votes[user.id];
          const totalVotes = Object.values(votes).length;
          const avgScore = totalVotes > 0 ? ((Object.values(votes) as number[]).reduce((a: number, b: number) => a + b, 0) / totalVotes).toFixed(1) : "0";

          return (
            <div key={sub.id} className={`
              bg-[#0f172a] border rounded-[2.5rem] p-10 flex flex-col group relative transition-all duration-500
              ${index === 0 && totalVotes > 0 ? 'border-amber-500/40 shadow-[0_0_40px_rgba(251,191,36,0.1)] ring-2 ring-amber-500/10' : 'border-white/5 hover:border-white/20'}
            `}>
              {/* Placement Badge */}
              <div className={`
                absolute -top-4 -left-4 w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-2xl z-20 border-2
                ${index === 0 && totalVotes > 0 ? 'bg-amber-500 text-black border-amber-400 rotate-[-12deg]' : 'bg-gray-800 text-white border-white/10'}
              `}>
                {index === 0 && totalVotes > 0 ? <TrophyIcon className="w-6 h-6" /> : `#${index + 1}`}
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className={`w-12 h-12 rounded-xl bg-white/5 p-1 flex items-center justify-center border border-white/10 group-hover:border-amber-500/30 transition-colors`}>
                  <img src={sub.avatarImage} alt="Avatar" className="w-10 h-10 object-contain" />
                </div>
                <div className="overflow-hidden">
                  <span className="font-black text-white block truncate uppercase tracking-tight">{sub.nickname}</span>
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">Yarışmacı</span>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="relative group/title inline-block">
                  <h4 className="text-2xl font-black text-white break-words leading-tight group-hover/title:text-amber-500 transition-colors">{new URL(sub.url).hostname}</h4>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 font-medium italic opacity-80 group-hover:opacity-100 transition-opacity">"{sub.description || 'Stratejik bir açıklama yapılmadı.'}"</p>
                <a 
                  href={sub.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 text-xs font-black uppercase tracking-widest pt-2 group/btn"
                >
                  SİTEYİ İNCELE <ArrowTopRightOnSquareIcon className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </a>
              </div>

              <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${index === 0 && totalVotes > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-white/5 text-gray-400'}`}>
                    <FireIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-3xl font-black text-white block leading-none">{avgScore}</span>
                    <span className="text-[10px] text-gray-500 uppercase font-black">{totalVotes} OY</span>
                  </div>
                </div>

                {lobby.status === LobbyStatus.OPEN && sub.userId !== user.id ? (
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button 
                        key={star}
                        onClick={() => castVote(lobbyId, sub.id, user.id, star)}
                        className={`p-1.5 transition-all duration-300 hover:scale-125 ${myVote && myVote >= star ? 'text-amber-500' : 'text-gray-700'}`}
                        title={`${star} Yıldız`}
                      >
                        <StarIcon className="w-6 h-6" />
                      </button>
                    ))}
                  </div>
                ) : (
                  myVote && (
                    <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                      <CheckCircleIcon className="w-4 h-4" /> OY VERİLDİ
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {safeSubmissions.length === 0 && (
        <div className="text-center py-40 bg-[#0f172a] rounded-[3rem] border border-dashed border-white/5 shadow-inner">
          <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FireIcon className="w-10 h-10 text-gray-600" />
          </div>
          <p className="text-gray-500 text-xl font-bold italic">Arena henüz sessiz. İlk linki sen paylaş ve savaşı başlat!</p>
        </div>
      )}

      {/* Add Submission Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0f172a] p-12 rounded-[3.5rem] border border-amber-500/20 w-full max-w-2xl shadow-[0_0_100px_rgba(251,191,36,0.1)] space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
            
            <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">Arenaya Giriş Yap</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Web Sitesi URL</label>
                <input 
                  type="text" 
                  placeholder="https://ornek-site.com"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Savaş Stratejisi (Açıklama)</label>
                <textarea 
                  placeholder="Bu site neden arenadaki en iyisi?"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-amber-500 h-40 resize-none transition-all font-medium"
                />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-5 text-gray-500 font-black uppercase tracking-widest hover:text-white transition-colors">İPTAL</button>
              <button 
                onClick={handleAdd} 
                disabled={!url}
                className="flex-[2] bg-amber-500 hover:bg-amber-400 text-black py-5 rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-xl shadow-amber-500/10 disabled:opacity-50"
              >
                PAYLAŞ VE YARIŞ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersistentLobbyView;
