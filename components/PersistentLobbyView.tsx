
import React, { useState, useEffect } from 'react';
import { Lobby, User, Submission, LobbyStatus } from '../types';
import { subscribeToLobby, submitLink, castVote, closeLobby, startVoting, getFullUser, getUserJoinedLobbies } from '../services/storageService';
import { StarIcon, CheckCircleIcon, TrophyIcon, ArrowTopRightOnSquareIcon, PlusCircleIcon, FireIcon, UserGroupIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/solid';
import { CHARACTER_POOL } from '../data/characters';

interface Props {
  lobbyId: string;
  user: User;
  onClose: () => void;
}

const PersistentLobbyView: React.FC<Props> = ({ lobbyId, user, onClose }) => {
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [participantsInfo, setParticipantsInfo] = useState<Record<string, User>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    const unsub = subscribeToLobby(lobbyId, (updatedLobby) => {
      setLobby(updatedLobby);
      // If mod, fetch real names
      if (updatedLobby && updatedLobby.creatorId === user.id) {
          Object.keys(updatedLobby.participants).forEach(async (pid) => {
              const uInfo = await getFullUser(pid);
              if (uInfo) setParticipantsInfo(prev => ({ ...prev, [pid]: uInfo }));
          });
      }
    });
    return () => unsub();
  }, [lobbyId]);

  if (!lobby) return <div className="p-10 text-amber-500 font-bold animate-pulse text-center">ARENA YÜKLENİYOR...</div>;

  const isCreator = lobby.creatorId === user.id;
  // Type cast Object.values to Submission[] to fix unknown property errors
  const submissions = Object.values(lobby.submissions || {}) as Submission[];
  const participantIds = Object.keys(lobby.participants).filter(id => id !== lobby.creatorId);
  
  // My Submissions
  const mySubmission = submissions.find(s => s.userId === user.id);
  
  // Submissions I need to vote on (Fair distribution)
  const assignments = submissions.filter(s => s.assignedVoters?.includes(user.id));

  const handleAdd = async () => {
    if (!url) return;
    const randomChar = CHARACTER_POOL[Math.floor(Math.random() * CHARACTER_POOL.length)];
    const newSub: Submission = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      nickname: randomChar.name, // Anonymous per lobby
      avatarImage: randomChar.image,
      url: url.startsWith('http') ? url : `https://${url}`,
      description: desc,
      votes: {},
      assignedVoters: [],
      createdAt: Date.now()
    };
    await submitLink(lobbyId, newSub);
    setShowAdd(false);
  };

  const getStatusColor = (uid: string) => {
      const sub = submissions.find(s => s.userId === uid);
      if (!sub) return 'bg-red-500'; // No link
      if (lobby.status === LobbyStatus.VOTING) {
          // Check if voted all assignments
          const myAssignments = submissions.filter(s => s.assignedVoters?.includes(uid));
          const hasVotedAll = myAssignments.every(s => s.votes && s.votes[uid]);
          return hasVotedAll ? 'bg-green-500' : 'bg-yellow-500';
      }
      return 'bg-blue-500'; // Link submitted, waiting
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-5xl font-black uppercase italic text-white">{lobby.name}</h2>
          <div className="flex gap-4 mt-2">
            <span className="text-gray-500 font-mono">Kod: #{lobbyId}</span>
            <span className="text-amber-500 font-bold">{submissions.length} Link Havuzda</span>
          </div>
        </div>
        
        {isCreator && lobby.status === LobbyStatus.OPEN && (
            <button 
                onClick={() => startVoting(lobbyId)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-lg"
            >
                DAĞITIMI BAŞLAT VE OYLA
            </button>
        )}
        
        {isCreator && lobby.status === LobbyStatus.VOTING && (
            <button 
                onClick={() => closeLobby(lobbyId)}
                className="bg-amber-500 hover:bg-amber-400 text-black px-8 py-4 rounded-2xl font-black transition-all shadow-lg"
            >
                ARENAYI SONLANDIR
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
            {lobby.status === LobbyStatus.OPEN && !mySubmission && !isCreator && (
                <div className="bg-indigo-600/10 border border-indigo-500/30 p-10 rounded-[3rem] text-center">
                    <FireIcon className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-4">Henüz linkini paylaşmadın!</h3>
                    <button onClick={() => setShowAdd(true)} className="bg-indigo-500 px-8 py-4 rounded-2xl font-bold">Link Ekle</button>
                </div>
            )}

            {lobby.status === LobbyStatus.VOTING && assignments.length > 0 && !isCreator && (
                <div className="space-y-6">
                    <h3 className="text-2xl font-black text-white uppercase italic">Sana Atanan Linkler ({assignments.length})</h3>
                    {assignments.map(sub => (
                        <div key={sub.id} className="bg-[#0f172a] p-8 rounded-[2.5rem] border border-white/5 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-amber-500 font-bold uppercase tracking-widest">{sub.nickname}</span>
                                {sub.votes && sub.votes[user.id] ? (
                                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">Oylandı: {sub.votes[user.id]}</span>
                                ) : (
                                    <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">Oylama Bekliyor</span>
                                )}
                            </div>
                            <h4 className="text-xl font-bold">{new URL(sub.url).hostname}</h4>
                            <p className="text-gray-400 italic">"{sub.description || 'Açıklama yok'}"</p>
                            <div className="flex gap-4">
                                <a href={sub.url} target="_blank" className="bg-white/5 border border-white/10 p-4 rounded-xl flex-1 text-center font-bold hover:bg-white/10">Sitede Gezin</a>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(score => (
                                        <button 
                                            key={score}
                                            onClick={() => castVote(lobbyId, sub.id, user.id, score)}
                                            className={`w-12 h-12 rounded-xl font-bold transition-all ${sub.votes?.[user.id] === score ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                                        >
                                            {score}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {lobby.status === LobbyStatus.CLOSED && (
                <div className="bg-amber-500 p-10 rounded-[3rem] text-black text-center">
                    <TrophyIcon className="w-20 h-20 mx-auto mb-4" />
                    <h2 className="text-4xl font-black">SONUÇLAR AÇIKLANDI!</h2>
                    {/* Simplified: Show Top 1 */}
                    {submissions.sort((a,b) => {
                         const votesA = Object.values(a.votes || {}) as number[];
                         const votesB = Object.values(b.votes || {}) as number[];
                         const avgA = votesA.reduce((s,v)=>s+v,0) / (votesA.length || 1);
                         const avgB = votesB.reduce((s,v)=>s+v,0) / (votesB.length || 1);
                         return avgB - avgA;
                    }).slice(0, 1).map(winner => {
                        const winnerVotes = Object.values(winner.votes || {}) as number[];
                        const avg = winnerVotes.reduce((s,v)=>s+v,0) / (winnerVotes.length || 1);
                        return (
                            <div key={winner.id} className="mt-6">
                                <p className="text-2xl font-bold">Şampiyon: {winner.nickname}</p>
                                <p className="text-lg">Ortalama Puan: {avg.toFixed(1)}</p>
                                <p className="text-sm mt-4 opacity-50">Sistem sahibi moderatör gerçek isimleri panosundan görebilir.</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Sidebar: Participants/Moderator Panel */}
        <div className="bg-[#0f172a] p-8 rounded-[2.5rem] border border-white/5 h-fit">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-gray-500" />
                {isCreator ? 'Moderatör Takip Paneli' : 'Savaşçılar'}
            </h3>
            <div className="space-y-4">
                {participantIds.map(pid => (
                    <div key={pid} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(pid)} shadow-lg shadow-current/20`}></div>
                            <div className="flex flex-col">
                                <span className="font-bold text-white text-sm">
                                    {isCreator ? (participantsInfo[pid]?.realName || 'Yükleniyor...') : 'Gizli Savaşçı'}
                                </span>
                                {isCreator && <span className="text-[10px] text-gray-500">Okul No: {participantsInfo[pid]?.schoolNumber}</span>}
                            </div>
                        </div>
                        {isCreator && submissions.find(s => s.userId === pid) && (
                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        )}
                    </div>
                ))}
            </div>
            {isCreator && (
                <div className="mt-8 text-[10px] text-gray-600 border-t border-white/5 pt-4">
                    <p>🔴 Link Bekleniyor</p>
                    <p>🟡 Oylama Bekleniyor (Link Paylaştı)</p>
                    <p>🟢 Tüm Görevleri Tamamladı</p>
                </div>
            )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-amber-500/20 w-full max-w-xl space-y-6">
            <h3 className="text-3xl font-black text-white italic">Linkini Havuza Bırak</h3>
            <input 
              type="text" 
              placeholder="URL (https://...)"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white"
            />
            <textarea 
              placeholder="Kısa bir açıklama"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white h-32"
            />
            <div className="flex gap-4">
                <button onClick={() => setShowAdd(false)} className="flex-1 text-gray-500 font-bold">İptal</button>
                <button onClick={handleAdd} className="flex-2 bg-amber-500 text-black py-4 rounded-2xl font-black">Link Paylaş</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; export default PersistentLobbyView;
