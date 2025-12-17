import React, { useState, useEffect, useRef } from 'react';
import { Submission, User, User as UserType } from '../types';
import { ArrowTopRightOnSquareIcon, SparklesIcon, ChevronRightIcon, StarIcon, ChatBubbleBottomCenterTextIcon, ShieldCheckIcon, ClockIcon, UserGroupIcon, CheckIcon } from '@heroicons/react/24/solid';
import { analyzeLink } from '../services/geminiService';
import { CHARACTER_POOL } from '../data/characters';

interface VotingViewProps {
  currentSubmission: Submission;
  isMod: boolean;
  currentUser: User;
  users: UserType[];
  onVote: (score: number) => void;
  onNext: () => void;
  onFinish: () => void;
  isLast: boolean;
  onUpdateAiComment: (submissionId: string, comment: string) => void;
  roundEndTime: number;
}

export const VotingView: React.FC<VotingViewProps> = ({
  currentSubmission,
  isMod,
  currentUser,
  users,
  onVote,
  onNext,
  onFinish,
  isLast,
  onUpdateAiComment,
  roundEndTime
}) => {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Helper function to resolve image URL
  // Using nickname as character identifier
  const getUserImage = (u: User) => {
      if (u.avatarImage) return u.avatarImage;
      const found = CHARACTER_POOL.find(c => c.name === u.nickname);
      return found ? found.image : null;
  };

  // CRITICAL GUARD: If data is corrupted
  if (!currentSubmission) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-2">Veri Hatası</h2>
            <p className="text-gray-400">Bu sıra için veri bulunamadı.</p>
            {isMod && (
                <button onClick={onNext} className="mt-4 bg-gray-700 px-4 py-2 rounded-lg">
                    Sonrakine Geç
                </button>
            )}
        </div>
      );
  }

  // Identify Roles
  const isOwner = currentUser.id === currentSubmission.userId;
  const currentVotes = currentSubmission.votes || {};

  // Calculate Eligible Voters (Exclude Mod and Owner)
  const eligibleVoters = users.filter(u => !u.isMod && u.id !== currentSubmission.userId);
  
  // Calculate Progress
  const validVotesCount = eligibleVoters.filter(u => currentVotes[u.id] !== undefined).length;
  const totalEligibleCount = eligibleVoters.length;
  const progressPercent = totalEligibleCount > 0 ? (validVotesCount / totalEligibleCount) * 100 : 0;
  
  const getHostname = (urlString: string) => {
    if (!urlString) return "Bilinmeyen Site";
    try {
      let safeUrl = urlString;
      if (!/^https?:\/\//i.test(safeUrl)) safeUrl = `https://${safeUrl}`;
      return new URL(safeUrl).hostname;
    } catch (e) {
      return urlString;
    }
  };

  // Sync state from server/props
  useEffect(() => {
    const existingVote = currentVotes[currentUser.id];
    if (existingVote !== undefined) {
      setSelectedScore(existingVote);
    } else {
      setSelectedScore(null);
    }
  }, [currentSubmission.id, currentUser.id, currentVotes]);

  // Countdown Logic
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((roundEndTime - now) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        setHasTimedOut(true);
        // Auto-vote 0 (Skip) if time is up, but ONLY for eligible voters who haven't voted
        const myVote = (currentSubmission.votes || {})[currentUser.id];
        if (myVote === undefined && !isMod && !isOwner) {
           handleVote(0);
        }
      } else {
        setHasTimedOut(false);
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [roundEndTime, currentSubmission.id, currentUser.id, isMod, isOwner, currentSubmission.votes]);

  const handleVote = (score: number) => {
    setSelectedScore(score);
    onVote(score);
  };

  const handleAiAnalysis = async () => {
    if (currentSubmission.aiCommentary) return;
    setIsAiLoading(true);
    const comment = await analyzeLink(currentSubmission.url, currentSubmission.description);
    onUpdateAiComment(currentSubmission.id, comment);
    setIsAiLoading(false);
  };

  // --- VIEW LOGIC ---

  // 1. OWNER VIEW (Waiting)
  if (isOwner && !isMod) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in text-center px-4">
              <div className="relative mb-8">
                  <div className="w-32 h-32 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">{timeLeft > 0 ? timeLeft : "0"}</span>
                  </div>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">Senin Sıran!</h2>
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-2xl max-w-lg mx-auto">
                 <p className="text-xl text-gray-300 font-medium">
                    Şu an senin linkin oylanıyor.
                 </p>
                 <p className="text-sm text-gray-500 mt-2">
                    Diğer kullanıcıların puan vermesini bekle. Kendine puan veremezsin.
                 </p>
              </div>
          </div>
      );
  }

  // 2. VOTER WAITING VIEW (Already voted)
  const isWaiting = (selectedScore !== null || hasTimedOut) && !isMod;
  if (isWaiting) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in text-center px-4">
              <div className="relative mb-8">
                  <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center ring-4 ring-green-500/20 mb-6">
                      <CheckIcon className="w-12 h-12 text-green-500" />
                  </div>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">Oyun Kaydedildi!</h2>
              <p className="text-xl text-gray-400 max-w-lg">
                  {timeLeft > 0 
                    ? "Sürenin bitmesi veya moderatörün devam etmesi bekleniyor..." 
                    : "Süre doldu. Sonraki tura geçiliyor..."}
              </p>
              {selectedScore !== null && selectedScore > 0 && (
                  <div className="mt-6 bg-gray-800/50 text-white px-6 py-3 rounded-xl border border-white/10 font-bold text-xl flex items-center gap-2">
                      <StarIcon className="w-6 h-6 text-yellow-400" />
                      Verdiğin Puan: {selectedScore}
                  </div>
              )}
          </div>
      );
  }

  // 3. MAIN INTERFACE
  return (
    <div className="max-w-7xl mx-auto flex flex-col min-h-[75vh]">
      {/* Header Info */}
      <div className="text-center mb-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent blur-xl opacity-70"></div>
        <div className="flex items-center justify-center gap-4 mb-4">
             <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-500/10 text-indigo-300 rounded-full text-[10px] font-bold border border-indigo-500/20 tracking-widest uppercase shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span> Canlı Oylama
            </span>
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border font-bold font-mono text-sm ${timeLeft <= 10 ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' : 'bg-gray-800 border-gray-700 text-gray-300'}`}>
                <ClockIcon className="w-4 h-4" />
                {timeLeft} sn
            </div>
        </div>
        <h2 className="text-5xl font-black text-white mb-2 drop-shadow-lg tracking-tight">
          {currentSubmission.nickname}<span className="text-gray-600 font-light">'in</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Seçimi</span>
        </h2>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Content Card (8 Cols) */}
        <div className="lg:col-span-8 bg-glass backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col relative group min-h-[400px]">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] -z-10 group-hover:bg-indigo-600/15 transition-colors duration-700"></div>
          
          <div className="p-10 flex-1 flex flex-col justify-center text-center relative z-10">
            <div className="mb-10 transform transition-transform duration-500 hover:scale-105">
              <a 
                href={currentSubmission.url} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex flex-col items-center gap-4 group/link"
              >
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-3xl border border-white/10 shadow-2xl group-hover/link:shadow-indigo-500/20 group-hover/link:border-indigo-500/30 transition-all relative overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover/link:opacity-100 transition-opacity"></div>
                    <ArrowTopRightOnSquareIcon className="w-16 h-16 text-indigo-400 group-hover/link:text-white transition-colors" />
                </div>
                <div className="flex flex-col">
                    <span className="text-3xl font-bold text-white mt-4 break-all px-4 tracking-tight">
                    {getHostname(currentSubmission.url)}
                    </span>
                    <span className="text-sm text-indigo-400 font-medium mt-1 opacity-0 translate-y-2 group-hover/link:opacity-100 group-hover/link:translate-y-0 transition-all">
                        Siteyi Ziyaret Et &rarr;
                    </span>
                </div>
              </a>
            </div>
            
            {currentSubmission.description && (
              <div className="bg-gray-800/30 backdrop-blur-sm p-8 rounded-3xl border border-white/5 mb-8 mx-auto max-w-2xl relative">
                <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-gray-600 absolute -top-4 -left-2 bg-gray-900 rounded-full p-1 border border-gray-700" />
                <p className="text-gray-200 text-lg italic font-medium leading-relaxed">"{currentSubmission.description}"</p>
              </div>
            )}

            {/* AI Section */}
            <div className="mt-auto max-w-3xl mx-auto w-full">
               {!currentSubmission.aiCommentary ? (
                 isMod ? (
                   <button 
                    onClick={handleAiAnalysis}
                    disabled={isAiLoading}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 hover:from-indigo-900/60 hover:to-purple-900/60 text-indigo-200 px-6 py-5 rounded-2xl transition-all border border-indigo-500/30 hover:shadow-[0_0_25px_rgba(99,102,241,0.2)] group/btn"
                   >
                     {isAiLoading ? (
                       <span className="animate-pulse flex items-center gap-2 font-bold"><SparklesIcon className="w-6 h-6" /> Yapay Zeka Düşünüyor...</span>
                     ) : (
                       <>
                        <SparklesIcon className="w-6 h-6 text-indigo-400 group-hover/btn:scale-110 transition-transform" />
                        <span className="font-bold">Gemini AI ile Yorumla</span>
                       </>
                     )}
                   </button>
                 ) : (
                   <div className="text-sm text-gray-500 flex items-center justify-center gap-3 bg-black/20 py-4 rounded-2xl border border-white/5">
                     Yapay zeka yorumu bekleniyor...
                   </div>
                 )
               ) : (
                 <div className="bg-gradient-to-br from-indigo-950/80 to-purple-950/80 border border-indigo-400/30 p-6 rounded-2xl relative shadow-xl text-left transform transition-all animate-fade-in">
                    <div className="absolute -top-3 left-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                      <SparklesIcon className="w-3.5 h-3.5" /> Gemini Yorumu
                    </div>
                    <p className="text-indigo-100 text-base leading-relaxed mt-2 font-medium">
                      {currentSubmission.aiCommentary}
                    </p>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Right: Interaction Panel (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-6 sticky top-4">
          
          {isMod ? (
             // --- MODERATOR PANEL ---
             <>
                <div className="bg-glass backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 shadow-xl flex flex-col max-h-[500px]">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                        <UserGroupIcon className="w-6 h-6 text-indigo-400" />
                        Oylama Durumu
                    </h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                        {eligibleVoters.length === 0 ? (
                            <div className="text-center text-gray-500 py-10 flex flex-col items-center gap-2">
                                <span className="bg-gray-800 p-3 rounded-full"><UserGroupIcon className="w-6 h-6" /></span>
                                Oy verecek başka katılımcı yok.
                            </div>
                        ) : (
                            eligibleVoters.map(voter => {
                                const hasVoted = currentVotes[voter.id] !== undefined;
                                const voteScore = currentVotes[voter.id]; 
                                const displayImage = getUserImage(voter);

                                return (
                                    <div key={voter.id} className="flex items-center justify-between bg-gray-800/40 p-3 rounded-xl border border-white/5 transition-all hover:bg-gray-800/60">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white shadow-sm overflow-hidden ${voter.characterColor || 'bg-gray-700'}`}>
                                                {displayImage ? (
                                                     <img 
                                                        src={displayImage} 
                                                        alt={voter.nickname} 
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                     />
                                                ) : (
                                                     voter.nickname || "👤"
                                                )}
                                                <div className="hidden text-sm">👤</div>
                                            </div>
                                            <span className="text-sm font-bold text-gray-300 truncate max-w-[100px]">{voter.nickname}</span>
                                        </div>
                                        {hasVoted ? (
                                            <div className="flex items-center gap-2 text-green-400 text-xs font-bold bg-green-900/20 px-2 py-1 rounded-lg border border-green-500/20">
                                                <CheckIcon className="w-4 h-4" />
                                                {voteScore === 0 ? 'Pas' : 'Verdi'}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold bg-yellow-900/20 px-2 py-1 rounded-lg border border-yellow-500/20 animate-pulse">
                                                <ClockIcon className="w-4 h-4" />
                                                Bekleniyor
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Mod Controls */}
                <div className="bg-gray-900/90 backdrop-blur-xl p-6 rounded-3xl border border-yellow-500/20 shadow-2xl shadow-black/50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-2">
                       <ShieldCheckIcon className="w-4 h-4" />
                       Moderatör Paneli
                    </h3>
                    <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg border border-white/5 font-mono">
                      {validVotesCount}/{totalEligibleCount} Oy
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-700 rounded-full h-2.5 mb-6 overflow-hidden">
                    <div 
                        className={`h-2.5 rounded-full transition-all duration-500 ${validVotesCount === totalEligibleCount && totalEligibleCount > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${Math.min(100, progressPercent)}%` }}
                    ></div>
                  </div>

                  <button
                    onClick={isLast ? onFinish : onNext}
                    className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold text-lg transition-all transform hover:translate-y-[-2px] active:translate-y-0 ${
                      isLast 
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg shadow-green-900/30' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/30'
                    }`}
                  >
                    {isLast ? "Oylamayı Bitir" : "Sıradaki Link"}
                    {isLast ? <StarIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
                  </button>
                </div>
             </>
          ) : (
             // --- USER VOTING PANEL ---
             <div className="bg-glass backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-xl flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                  <div className="bg-yellow-500/20 p-2 rounded-lg">
                    <StarIcon className="w-6 h-6 text-yellow-500" />
                  </div>
                  Puanın Kaç?
                </h3>
                
                <div className="grid grid-cols-2 gap-4 flex-1 content-start">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                    <button
                      key={score}
                      onClick={() => handleVote(score)}
                      disabled={timeLeft === 0}
                      className={`
                        h-14 rounded-xl font-black text-xl transition-all duration-200 transform hover:scale-[1.05] active:scale-95 flex items-center justify-center relative overflow-hidden group
                        ${selectedScore === score 
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg ring-2 ring-white/30' 
                          : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700 hover:text-white border border-white/5'
                        }
                        ${timeLeft === 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                      `}
                    >
                      <span className="relative z-10">{score}</span>
                      {selectedScore === score && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                    </button>
                  ))}
                </div>
                
                <div className="mt-8 pt-6 border-t border-white/5 text-center min-h-[60px]">
                   {selectedScore ? (
                     <div className="animate-bounce-short">
                        <span className="inline-flex items-center gap-2 text-white font-bold bg-indigo-600 px-6 py-2 rounded-full shadow-lg shadow-indigo-500/30">
                        <StarIcon className="w-5 h-5 text-yellow-300" /> {selectedScore} Puan!
                        </span>
                     </div>
                   ) : (
                     <span className="text-gray-500 text-sm font-medium">Henüz oy vermedin...</span>
                   )}
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};