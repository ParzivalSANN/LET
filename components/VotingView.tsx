import React, { useState, useEffect } from 'react';
import { Submission, User } from '../types';
import { ArrowTopRightOnSquareIcon, SparklesIcon, StarIcon, ChatBubbleBottomCenterTextIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/solid';
import { analyzeLink } from '../services/geminiService';

interface VotingViewProps {
  currentSubmission: Submission;
  isMod: boolean;
  currentUser: User;
  allSubmissions: Submission[]; // Tüm submissions listesi
  onVote: (score: number) => void;
  onNext: () => void;
  onFinish: () => void;
  isLast: boolean;
  onUpdateAiComment: (submissionId: string, comment: string) => void;
}

export const VotingView: React.FC<VotingViewProps> = ({
  currentSubmission,
  isMod,
  currentUser,
  allSubmissions,
  onVote,
  onNext,
  onFinish,
  isLast,
  onUpdateAiComment
}) => {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [hasVotedAll, setHasVotedAll] = useState(false);

  // Check if user has voted on all submissions (except their own)
  useEffect(() => {
    if (isMod) return; // Moderator doesn't vote

    const submissionsToVote = allSubmissions.filter(s => s.userId !== currentUser.id);
    const votedCount = submissionsToVote.filter(s => (s.votes || {})[currentUser.id] !== undefined).length;
    setHasVotedAll(votedCount === submissionsToVote.length);
  }, [allSubmissions, currentUser.id, isMod]);

  // Reset local state when submission changes
  useEffect(() => {
    setSelectedScore((currentSubmission.votes || {})[currentUser.id] || null);
  }, [currentSubmission.id, currentUser.id, currentSubmission.votes]);

  // Auto-advance after voting (for users)
  useEffect(() => {
    if (isMod) return; // Moderators don't auto-advance
    if (currentSubmission.userId === currentUser.id) {
      // Skip own submission
      setTimeout(() => onNext(), 500);
      return;
    }

    const hasVoted = (currentSubmission.votes || {})[currentUser.id] !== undefined;
    if (hasVoted && !isLast) {
      // Auto-advance after 1.5 seconds
      const timer = setTimeout(() => {
        onNext();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentSubmission.id, selectedScore, isMod, isLast, currentUser.id, currentSubmission.userId]);

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

  // If user has voted all submissions, show waiting screen
  if (!isMod && hasVotedAll) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="bg-glass backdrop-blur-2xl p-12 rounded-3xl border border-white/10">
          <ClockIcon className="w-20 h-20 text-indigo-400 mx-auto mb-6 animate-pulse" />
          <h2 className="text-4xl font-bold text-white mb-4">Tüm Oyları Verdin! ✅</h2>
          <p className="text-gray-400 text-lg mb-6">
            Moderatör yarışmayı bitirene kadar bekle...
          </p>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-white/5">
            <p className="text-sm text-gray-500">Oy verdiğin link sayısı:</p>
            <p className="text-3xl font-bold text-white mt-2">
              {allSubmissions.filter(s => s.userId !== currentUser.id).length}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If this is user's own submission, skip it
  if (!isMod && currentSubmission.userId === currentUser.id) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="bg-glass backdrop-blur-2xl p-12 rounded-3xl border border-white/10">
          <div className="text-6xl mb-4">⏭️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Kendi Linkin</h2>
          <p className="text-gray-400">Geçiliyor...</p>
        </div>
      </div>
    );
  }

  const totalVotes = Object.keys(currentSubmission.votes || {}).length;
  const hasUserVoted = (currentSubmission.votes || {})[currentUser.id] !== undefined;

  return (
    <div className="max-w-7xl mx-auto flex flex-col min-h-[75vh]">
      {/* Header */}
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-500/10 text-indigo-300 rounded-full text-[10px] font-bold mb-4 border border-indigo-500/20 tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span> Canlı Oylama
        </span>
        <h2 className="text-5xl font-black text-white mb-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Yarışmacının</span>
        </h2>
        <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-indigo-500">
          Link Seçimi
        </h2>
        {!isMod && <p className="text-gray-400 text-sm mt-4">Bu linke kaç puan veriyorsun?</p>}
        {isMod && <p className="text-yellow-400 text-sm mt-4 font-bold">👑 Moderatör İzleme Modu</p>}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Content Card */}
        <div className="lg:col-span-8 bg-glass backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl p-10 flex flex-col">

          {/* Link Display */}
          <div className="mb-10 text-center">
            <a
              href={currentSubmission.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-col items-center gap-4 group/link"
            >
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-3xl border border-white/10 shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-500/30 transition-all">
                <ArrowTopRightOnSquareIcon className="w-16 h-16 text-indigo-400 group-hover/link:text-white transition-colors" />
              </div>
              <span className="text-3xl font-bold text-white break-all px-4">
                {new URL(currentSubmission.url).hostname}
              </span>
              <span className="text-sm text-indigo-400 font-medium">
                Siteyi Ziyaret Et &rarr;
              </span>
            </a>
          </div>

          {/* Description */}
          {currentSubmission.description && (
            <div className="mb-8 bg-gray-800/40 rounded-2xl p-6 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-gray-400" />
                <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Açıklama</span>
              </div>
              <p className="text-gray-300 leading-relaxed">{currentSubmission.description}</p>
            </div>
          )}

          {/* AI Commentary */}
          {isMod && (
            <div className="mt-auto">
              {currentSubmission.aiCommentary ? (
                <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-2xl p-6 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <SparklesIcon className="w-5 h-5 text-purple-400" />
                    <span className="text-xs uppercase font-bold text-purple-400 tracking-wider">AI Yorumu</span>
                  </div>
                  <p className="text-gray-300 leading-relaxed text-sm">{currentSubmission.aiCommentary}</p>
                </div>
              ) : (
                <button
                  onClick={handleAiAnalysis}
                  disabled={isAiLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <SparklesIcon className="w-5 h-5" />
                  {isAiLoading ? 'AI Analiz Ediyor...' : 'AI Yorumu Al'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Voting Panel */}
        <div className="lg:col-span-4 space-y-6">
          {!isMod ? (
            // User Voting Panel
            <>
              <div className="bg-glass backdrop-blur-2xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-sm uppercase font-bold text-gray-400 tracking-wider mb-4">Puanını Ver</h3>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                    <button
                      key={score}
                      onClick={() => handleVote(score)}
                      disabled={hasUserVoted}
                      className={`
                        aspect-square rounded-xl font-bold text-lg transition-all border-2
                        ${selectedScore === score
                          ? 'bg-gradient-to-br from-yellow-500 to-orange-500 border-yellow-400 text-white shadow-lg scale-110'
                          : hasUserVoted
                            ? 'bg-gray-800/50 border-gray-700 text-gray-600 cursor-not-allowed'
                            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white hover:scale-105'
                        }
                      `}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                {hasUserVoted && (
                  <div className="mt-4 text-green-400 text-sm font-bold text-center">
                    ✅ Oy verildi! Sonraki linke geçiliyor...
                  </div>
                )}
              </div>
            </>
          ) : (
            // Moderator Panel
            <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 rounded-2xl p-6 border border-yellow-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm uppercase font-bold text-yellow-500 tracking-wider flex items-center gap-2">
                  <ShieldCheckIcon className="w-4 h-4" />
                  Moderatör Paneli
                </h3>
                <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg border border-white/5 font-mono">
                  {totalVotes} Oy Kullanıldı
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-6">
                Kullanıcılar oy veriyor. İstediğin zaman yarışmayı bitirebilirsin.
              </p>
              <button
                onClick={onFinish}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg"
              >
                🏁 Yarışmayı Bitir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};