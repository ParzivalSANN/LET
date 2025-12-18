
import React, { useState, useEffect } from 'react';
import { Lobby, User, Submission, LobbyStatus } from '../types';
import { subscribeToLobby, submitLink, castVote, closeLobby, startVoting, getFullUser } from '../services/storageService';
import { StarIcon, CheckCircleIcon, TrophyIcon, ArrowTopRightOnSquareIcon, PlusCircleIcon, FireIcon, UserGroupIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/solid';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeToLobby(lobbyId, (updatedLobby) => {
      setLobby(updatedLobby);
      if (updatedLobby) {
          Object.keys(updatedLobby.participants).forEach(async (pid) => {
              if (!participantsInfo[pid]) {
                const uInfo = await getFullUser(pid);
                if (uInfo) setParticipantsInfo(prev => ({ ...prev, [pid]: uInfo }));
              }
          });
      }
    });
    return () => unsub();
  }, [lobbyId]);

  if (!lobby) return <div className="p-10 text-amber-500 font-bold animate-pulse text-center">ARENA YÜKLENİYOR...</div>;

  const isCreator = lobby.creatorId === user.id;
  const submissions = Object.values(lobby.submissions || {}) as Submission[];
  const participantIds = Object.keys(lobby.participants).filter(id => id !== lobby.creatorId);
  
  const mySubmission = submissions.find(s => s.userId === user.id);
  const assignments = submissions.filter(s => s.assignedVoters?.includes(user.id));

  const handleAdd = async () => {
    if (!url || isSubmitting) return;
    try {
        setIsSubmitting(true);
        const submissionId = Math.random().toString(36).substr(2, 9);
        const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
        
        const newSub: Submission = {
          id: submissionId,
          userId: user.id,
          nickname: user.nickname || "Savaşçı",
          avatarImage: user.avatarImage || "",
          url: formattedUrl,
          description: desc,
          votes: {},
          assignedVoters: [],
          createdAt: Date.now()
        };
        
        await submitLink(lobbyId, newSub);
        setUrl('');
        setDesc('');
        setShowAdd(false);
    } catch (e) {
        alert("Link eklenirken bir hata oluştu.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const getStatusColor = (uid: string) => {
      const sub = submissions.find(s => s.userId === uid);
      if (!sub) return 'bg-red-500';
      if (lobby.status === LobbyStatus.VOTING) {
          const myAssignments = submissions.filter(s => s.assignedVoters?.includes(uid));
          const hasVotedAll = myAssignments.every(s => s.votes && s.votes[uid] !== undefined);
          return hasVotedAll ? 'bg-green-500' : 'bg-yellow-500';
      }
      return 'bg-blue-500';
  };

  const sortedResults = [...submissions].sort((a, b) => {
    const vA = Object.values(a.votes || {}) as number[];
    const vB = Object.values(b.votes || {}) as number[];
    const avgA = vA.length > 0 ? vA.reduce((s, v) => s + v, 0) / vA.length : 0;
    const avgB = vB.length > 0 ? vB.reduce((s, v) => s + v, 0) / vB.length : 0;
    return avgB - avgA;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20">
      <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
        <div>
          <h2 className="text-5xl font-black uppercase italic text-white leading-tight">{lobby.name}</h2>
          <div className="flex gap-4 mt-2">
            <span className="text-gray-500 font-mono bg-white/5 px-3 py-1 rounded-lg border border-white/5">Kod: #{lobbyId}</span>
            <span className="text-amber-500 font-bold bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/10">{submissions.length} Link Yarışıyor</span>
          </div>
        </div>
        <div className="flex gap-3">
            {isCreator && lobby.status === LobbyStatus.OPEN && (
                <button onClick={() => startVoting(lobbyId)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-lg uppercase tracking-widest text-sm">Oylamayı Başlat</button>
            )}
            {isCreator && lobby.status === LobbyStatus.VOTING && (
                <button onClick={() => closeLobby(lobbyId)} className="bg-amber-500 hover:bg-amber-400 text-black px-8 py-4 rounded-2xl font-black transition-all shadow-lg uppercase tracking-widest text-sm">Arenayı Bitir</button>
            )}
            <button onClick={onClose} className="bg-white/5 hover:bg-white/10 text-white px-6 py-4 rounded-2xl font-bold transition-all border border-white/10 uppercase text-xs">Ayrıl</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            {lobby.status === LobbyStatus.OPEN && !mySubmission && !isCreator && (
                <div className="bg-indigo-600/10 border border-indigo-500/30 p-16 rounded-[4rem] text-center space-y-6">
                    <div className="bg-indigo-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-2xl"><FireIcon className="w-12 h-12 text-indigo-500" /></div>
                    <h3 className="text-4xl font-black text-white italic">SAVAŞA HAZIR MISIN?</h3>
                    <p className="text-gray-400 max-w-md mx-auto">Linkini havuza bırak, sistem sana bir takma ad atasın ve rakiplerini alt et.</p>
                    <button onClick={() => setShowAdd(true)} className="bg-indigo-500 hover:bg-indigo-400 px-12 py-5 rounded-[2rem] font-black text-xl shadow-xl transition-all hover:scale-105 active:scale-95">LİNK EKLE</button>
                </div>
            )}

            {lobby.status === LobbyStatus.VOTING && !isCreator && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="bg-amber-500/20 p-3 rounded-2xl"><StarIcon className="w-8 h-8 text-amber-500" /></div>
                        <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">Sana Atanan Görevler</h3>
                    </div>
                    {assignments.map(sub => (
                        <div key={sub.id} className="bg-[#0f172a] p-10 rounded-[3rem] border border-white/5 space-y-6 transition-all hover:border-white/10">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <img src={sub.avatarImage} className="w-12 h-12 rounded-xl bg-white/5 p-1 object-cover" />
                                    <span className="text-amber-500 font-black uppercase tracking-widest text-lg">{sub.nickname}</span>
                                </div>
                                {sub.votes && sub.votes[user.id] !== undefined ? (
                                    <div className="bg-green-500/10 text-green-400 px-4 py-2 rounded-full text-xs font-black border border-green-500/20">PUANIN: {sub.votes[user.id]}</div>
                                ) : (
                                    <div className="bg-yellow-500/10 text-yellow-400 px-4 py-2 rounded-full text-xs font-black border border-yellow-500/20 animate-pulse">OY BEKLİYOR</div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-2xl font-black text-white truncate">{new URL(sub.url).hostname}</h4>
                                <p className="text-gray-400 italic font-medium">"{sub.description || 'Strateji belirtilmedi.'}"</p>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 pt-4">
                                <a href={sub.url} target="_blank" className="bg-white text-black p-5 rounded-2xl flex-1 text-center font-black uppercase tracking-widest hover:bg-gray-200 transition-colors">SİTEYİ AÇ</a>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(score => (
                                        <button 
                                            key={score}
                                            onClick={() => castVote(lobbyId, sub.id, user.id, score)}
                                            className={`w-14 h-14 rounded-2xl font-black text-xl transition-all hover:scale-110 ${sub.votes?.[user.id] === score ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                                        >
                                            {score}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                    {assignments.length === 0 && (
                        <div className="p-20 text-center bg-white/5 rounded-[4rem] border border-white/5 border-dashed italic text-gray-500">
                           Sana atanmış link bulunmuyor.
                        </div>
                    )}
                </div>
            )}

            {lobby.status === LobbyStatus.CLOSED && (
                <div className="space-y-12 animate-fade-in pb-10">
                    <div className="text-center space-y-4">
                        <TrophyIcon className="w-20 h-20 mx-auto text-amber-500 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]" />
                        <h2 className="text-6xl font-black uppercase italic text-white tracking-tighter">ARENA ŞAMPİYONLARI</h2>
                    </div>
                    <div className="flex flex-col md:flex-row items-end justify-center gap-4 pt-20">
                        {sortedResults[1] && (
                            <div className="flex-1 max-w-[250px] space-y-4 text-center order-1">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-3xl bg-slate-400 mx-auto mb-4 border-4 border-slate-300 shadow-2xl flex items-center justify-center text-4xl font-black text-slate-800">2</div>
                                    <img src={sortedResults[1].avatarImage} className="w-16 h-16 absolute -top-8 -right-4 rounded-xl border-2 border-slate-400 bg-gray-900 p-1 object-cover" />
                                </div>
                                <div className="bg-slate-500/10 p-4 rounded-2xl border border-slate-400/20">
                                    <h4 className="text-white font-black uppercase text-sm truncate">{participantsInfo[sortedResults[1].userId]?.realName || 'Gizli'}</h4>
                                    <p className="text-slate-400 text-[10px] font-bold">GÜMÜŞ MADALYA</p>
                                </div>
                                <div className="h-32 bg-gradient-to-t from-slate-900 to-slate-500/20 rounded-t-3xl border-x border-t border-slate-400/20"></div>
                            </div>
                        )}
                        {sortedResults[0] && (
                            <div className="flex-1 max-w-[300px] space-y-4 text-center order-2 -mt-10">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-[2.5rem] bg-amber-500 mx-auto mb-4 border-4 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.3)] flex items-center justify-center text-6xl font-black text-amber-900">1</div>
                                    <img src={sortedResults[0].avatarImage} className="w-20 h-20 absolute -top-10 -right-4 rounded-2xl border-4 border-amber-500 bg-gray-900 p-1 animate-bounce object-cover" />
                                </div>
                                <div className="bg-amber-500/10 p-6 rounded-[2rem] border border-amber-500/20 shadow-xl">
                                    <h4 className="text-amber-500 text-2xl font-black uppercase tracking-tight truncate">{participantsInfo[sortedResults[0].userId]?.realName || 'Gizli'}</h4>
                                    <p className="text-amber-600 text-xs font-black tracking-widest uppercase">ALTIN ŞAMPİYON</p>
                                </div>
                                <div className="h-48 bg-gradient-to-t from-amber-950/40 to-amber-500/20 rounded-t-[3rem] border-x border-t border-amber-500/30"></div>
                            </div>
                        )}
                        {sortedResults[2] && (
                            <div className="flex-1 max-w-[250px] space-y-4 text-center order-3">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-3xl bg-orange-700 mx-auto mb-4 border-4 border-orange-600 shadow-2xl flex items-center justify-center text-4xl font-black text-orange-200">3</div>
                                    <img src={sortedResults[2].avatarImage} className="w-16 h-16 absolute -top-8 -right-4 rounded-xl border-2 border-orange-700 bg-gray-900 p-1 object-cover" />
                                </div>
                                <div className="bg-orange-700/10 p-4 rounded-2xl border border-orange-700/20">
                                    <h4 className="text-white font-black uppercase text-sm truncate">{participantsInfo[sortedResults[2].userId]?.realName || 'Gizli'}</h4>
                                    <p className="text-orange-500 text-[10px] font-bold">BRONZ MADALYA</p>
                                </div>
                                <div className="h-24 bg-gradient-to-t from-orange-950/40 to-orange-700/20 rounded-t-3xl border-x border-t border-orange-700/20"></div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        <div className="bg-[#0f172a] p-8 rounded-[3rem] border border-white/5 h-fit sticky top-6 shadow-2xl">
            <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-white uppercase italic">
                <ShieldCheckIcon className="w-6 h-6 text-amber-500" />
                {isCreator ? 'Moderatör Kontrol' : 'Arena Durumu'}
            </h3>
            <div className="space-y-4">
                {participantIds.map(pid => (
                    <div key={pid} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5 group">
                        <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(pid)} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}></div>
                            <div className="flex items-center gap-2">
                                {participantsInfo[pid]?.avatarImage && <img src={participantsInfo[pid].avatarImage} className="w-6 h-6 rounded-md object-cover" />}
                                <div className="flex flex-col">
                                    <span className="font-bold text-white text-xs group-hover:text-amber-500 transition-colors">
                                        {isCreator ? (participantsInfo[pid]?.realName || '...') : 'Gizli Savaşçı'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
           <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-white/10 w-full max-w-lg space-y-6">
              <h3 className="text-3xl font-black text-white italic tracking-tight">LİNKİNİ GÖNDER</h3>
              <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Site URL (https://...)" 
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <textarea 
                    placeholder="Savaş notun..." 
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white h-32 resize-none outline-none focus:ring-2 focus:ring-amber-500"
                  />
              </div>
              <div className="flex gap-4">
                  <button onClick={() => setShowAdd(false)} className="flex-1 text-gray-500 font-bold hover:text-white transition-colors">VAZGEÇ</button>
                  <button 
                    onClick={handleAdd} 
                    disabled={!url || isSubmitting}
                    className="flex-[2] bg-amber-500 hover:bg-amber-400 text-black py-4 rounded-2xl font-black uppercase transition-all shadow-xl disabled:opacity-50"
                  >
                    {isSubmitting ? 'GÖNDERİLİYOR...' : 'SAVAŞA KATIL'}
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}; export default PersistentLobbyView;
