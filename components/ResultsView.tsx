import React from 'react';
import { Submission } from '../types';
import { TrophyIcon, StarIcon } from '@heroicons/react/24/solid';

interface ResultsViewProps {
  submissions: Submission[];
  onReset: () => void;
  isMod: boolean;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ submissions, onReset, isMod }) => {
  // Calculate averages and sort
  const results = submissions.map(sub => {
    const scores = Object.values(sub.votes) as number[];
    const total = scores.reduce((a, b) => a + b, 0);
    const average = scores.length > 0 ? total / scores.length : 0;
    return { ...sub, average, voteCount: scores.length };
  }).sort((a, b) => b.average - a.average);

  const winner = results[0];

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Winner Header */}
      <div className="text-center mb-12 relative animate-fade-in">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[100px] -z-10"></div>
        <TrophyIcon className="w-32 h-32 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_25px_rgba(250,204,21,0.6)] animate-pulse-slow" />
        <h2 className="text-5xl font-extrabold text-white mb-2 tracking-tight">Kazanan</h2>
        <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-600 mt-2">
          {winner ? winner.userName : "Kimse?"}
        </div>
        <div className="mt-4 text-gray-400">
           Ortalama: <span className="text-white font-bold text-xl">{winner?.average.toFixed(1)}</span>
        </div>
      </div>

      <div className="grid gap-4">
        {results.map((item, index) => (
          <div 
            key={item.id}
            style={{ animationDelay: `${index * 150}ms` }}
            className={`
              group relative flex items-center justify-between p-6 rounded-2xl border transition-all duration-500 hover:scale-[1.02]
              ${index === 0 
                ? 'bg-gradient-to-r from-yellow-900/40 to-gray-800/80 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.15)] z-10' 
                : index === 1
                ? 'bg-gray-800/60 border-gray-600 shadow-lg'
                : index === 2
                ? 'bg-gray-800/40 border-orange-900/30 shadow'
                : 'bg-glass border-white/5 opacity-80 hover:opacity-100'
              }
            `}
          >
            {/* Rank Badge */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2">
               <div className={`
                 w-8 h-8 flex items-center justify-center rounded-full font-bold shadow-lg text-sm
                 ${index === 0 ? 'bg-yellow-400 text-black ring-4 ring-yellow-400/20' : 
                   index === 1 ? 'bg-gray-300 text-gray-900 ring-4 ring-gray-400/20' :
                   index === 2 ? 'bg-amber-700 text-white ring-4 ring-amber-700/20' : 'bg-gray-700 text-gray-400'}
               `}>
                 #{index + 1}
               </div>
            </div>

            <div className="flex items-center gap-6 pl-6">
              <div>
                <h3 className="font-bold text-xl text-white group-hover:text-indigo-300 transition-colors">
                  {item.userName}
                  {index === 0 && <span className="ml-3 text-yellow-400 text-xs uppercase tracking-widest border border-yellow-500/50 px-2 py-0.5 rounded-full bg-yellow-500/10">Şampiyon</span>}
                </h3>
                <a href={item.url} target="_blank" className="text-gray-500 text-sm hover:text-white hover:underline transition-colors flex items-center gap-1 mt-1">
                  {new URL(item.url).hostname}
                </a>
              </div>
            </div>
            
            <div className="text-right flex items-center gap-6">
              {item.voteCount > 0 && (
                  <div className="hidden sm:block text-xs text-gray-600 bg-gray-900/50 px-3 py-1 rounded-full">
                      {item.voteCount} Oy
                  </div>
              )}
              <div>
                <div className="text-3xl font-bold text-white flex items-center gap-1 justify-end">
                    <StarIcon className={`w-5 h-5 ${index === 0 ? 'text-yellow-400' : 'text-gray-600'}`} />
                    {item.average.toFixed(1)}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Puan</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isMod && (
        <div className="mt-16 text-center">
          <button
            onClick={onReset}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-4 px-8 rounded-xl transition-all border border-white/10 hover:border-white/30 hover:shadow-lg hover:text-white"
          >
            Yeni Yarışma Başlat
          </button>
        </div>
      )}
    </div>
  );
};