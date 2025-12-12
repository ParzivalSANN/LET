import React, { useState, useEffect } from 'react';
import { INITIAL_STATE, GameState, AppStatus, User, Submission } from './types';
import { subscribeToGame, saveState, resetGame, isOnlineMode } from './services/storageService';
import { LobbyView } from './components/LobbyView';
import { VotingView } from './components/VotingView';
import { ResultsView } from './components/ResultsView';
import { CloudIcon, WifiIcon, SignalSlashIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  // Sync state from Storage Service (Firebase or LocalStorage)
  useEffect(() => {
    setIsOnline(isOnlineMode());

    // Subscribe to changes
    const unsubscribe = subscribeToGame((newState) => {
      setGameState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Restore user session from local storage only (independent of game state)
  useEffect(() => {
     const storedUser = localStorage.getItem('linkyaris_user_session');
     if (storedUser) {
         try {
             setCurrentUser(JSON.parse(storedUser));
         } catch (e) {
             console.error("Failed to restore session");
         }
     }
  }, []);

  // Handlers
  const handleJoin = (name: string, password?: string, isMod: boolean = false): boolean => {
    const finalName = isMod && name === 'Moderatör' ? 'Moderatör (Berkay)' : name;
    
    // Check if user already exists in game state
    const existingUser = gameState.users.find(u => u.name === finalName && u.isMod === isMod);

    let userToSet: User;

    if (existingUser) {
      // If user exists, verify password (if not mod) to allow reconnection
      if (!isMod) {
         // Handle potential undefined password in existing user (legacy data)
         const storedPassword = existingUser.password || "";
         const inputPassword = password || "";
         if (storedPassword !== inputPassword) {
             // Password mismatch
             return false;
         }
      }
      userToSet = existingUser;
    } else {
      // Create new user
      userToSet = {
        id: crypto.randomUUID(),
        name: finalName,
        isMod: isMod,
        joinedAt: Date.now(),
        // CRITICAL FIX: Firebase throws error if value is undefined. Use empty string instead.
        password: password || ""
      };
      
      const newState = {
        ...gameState,
        users: [...gameState.users, userToSet]
      };
      saveState(newState);
    }

    setCurrentUser(userToSet);
    localStorage.setItem('linkyaris_user_session', JSON.stringify(userToSet));
    return true;
  };

  const handleSubmitLink = (url: string, description: string) => {
    if (!currentUser) return;
    
    const newSubmission: Submission = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      userName: currentUser.name,
      url,
      description,
      votes: {}
    };

    const newState = {
      ...gameState,
      submissions: [...gameState.submissions, newSubmission]
    };
    saveState(newState);
  };

  const handleStartGame = (duration: number) => {
    const newState: GameState = {
      ...gameState,
      status: AppStatus.VOTING,
      currentSubmissionIndex: 0,
      settings: {
        timerDuration: duration
      },
      // Calculate end time for the first round
      roundEndTime: Date.now() + (duration * 1000)
    };
    saveState(newState);
  };

  const handleVote = (score: number) => {
    if (!currentUser) return;
    const currentSub = gameState.submissions[gameState.currentSubmissionIndex];
    
    if (!currentSub) return;

    const updatedSub = {
      ...currentSub,
      votes: { ...currentSub.votes, [currentUser.id]: score }
    };

    const updatedSubmissions = [...gameState.submissions];
    updatedSubmissions[gameState.currentSubmissionIndex] = updatedSub;

    saveState({
      ...gameState,
      submissions: updatedSubmissions
    });
  };

  const handleNextSubmission = () => {
    const nextIndex = gameState.currentSubmissionIndex + 1;
    
    if (nextIndex < gameState.submissions.length) {
      saveState({
        ...gameState,
        currentSubmissionIndex: nextIndex,
        // Reset timer for next round
        roundEndTime: Date.now() + (gameState.settings.timerDuration * 1000)
      });
    }
  };

  const handleFinishGame = () => {
    saveState({
      ...gameState,
      status: AppStatus.RESULTS
    });
  };

  const handleUpdateAiComment = (submissionId: string, comment: string) => {
     const updatedSubmissions = gameState.submissions.map(s => {
       if (s.id === submissionId) {
         return { ...s, aiCommentary: comment };
       }
       return s;
     });
     
     saveState({
       ...gameState,
       submissions: updatedSubmissions
     });
  };

  const handleReset = () => {
    if (confirm("Herkes için oyunu sıfırlamak istediğine emin misin?")) {
        resetGame();
    }
  };

  // Sign out handler
  const handleSignOut = () => {
    localStorage.removeItem('linkyaris_user_session');
    setCurrentUser(null);
  };

  // Safe Access Logic for Views
  // If we are in VOTING mode but there is no submission at current index, fallback to LOBBY or prevent crash
  const currentSubmission = 
    gameState.status === AppStatus.VOTING && gameState.submissions.length > 0 
    ? gameState.submissions[gameState.currentSubmissionIndex] 
    : undefined;

  // Render Logic
  return (
    <div className="min-h-screen text-gray-100 p-4 md:p-8 font-sans">
      {/* Top Bar */}
      <div className="flex justify-between items-center max-w-7xl mx-auto mb-8 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-white/20 backdrop-blur-sm">
            LY
          </div>
          <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 hidden sm:block">LinkYarış</span>
          
          {/* Connection Status Indicator */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isOnline ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {isOnline ? (
                <>
                    <WifiIcon className="w-3.5 h-3.5" /> Canlı (Online)
                </>
            ) : (
                <>
                    <SignalSlashIcon className="w-3.5 h-3.5" /> Demo (Offline)
                </>
            )}
          </div>
        </div>
        
        {currentUser && (
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 text-sm bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                <div className="text-gray-200">
                  {currentUser.isMod ? (
                    <span className="text-yellow-400 font-bold flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                        </span>
                        Moderatör Paneli
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      {currentUser.name}
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={handleSignOut}
                className="bg-red-500/20 hover:bg-red-500/40 text-red-300 px-3 py-2 rounded-full text-xs font-bold transition-colors border border-red-500/30"
              >
                Çıkış Yap
              </button>
          </div>
        )}
      </div>

      {!isOnline && (
        <div className="max-w-7xl mx-auto mb-6 bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
            <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-500">
                <CloudIcon className="w-6 h-6" />
            </div>
            <div>
                <h4 className="font-bold text-yellow-500 text-sm">Offline Mod (Demo)</h4>
                <p className="text-xs text-yellow-200/70 mt-1">
                    Şu anda veritabanı bağlantısı yok. Yaptığınız işlemler sadece bu tarayıcıda çalışır. 
                    Çok oyunculu mod için Netlify Environment Variables ayarlarında Firebase Config bilgilerini girmelisiniz.
                </p>
            </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto transition-all duration-500 ease-in-out">
        {gameState.status === AppStatus.LOBBY && (
          <LobbyView 
            currentUser={currentUser}
            users={gameState.users}
            submissions={gameState.submissions}
            onJoin={handleJoin}
            onSubmitLink={handleSubmitLink}
            onStartGame={handleStartGame}
            isMod={currentUser?.isMod || false}
          />
        )}

        {/* Improved Crash Protection for Voting View */}
        {gameState.status === AppStatus.VOTING && currentUser && (
          currentSubmission ? (
            <VotingView 
              // The KEY prop forces a full re-render when index changes, fixing the "stuck UI" issue
              key={gameState.currentSubmissionIndex}
              currentSubmission={currentSubmission}
              isMod={currentUser.isMod}
              currentUser={currentUser}
              users={gameState.users}
              onVote={handleVote}
              onNext={handleNextSubmission}
              onFinish={handleFinishGame}
              isLast={gameState.currentSubmissionIndex === gameState.submissions.length - 1}
              onUpdateAiComment={handleUpdateAiComment}
              roundEndTime={gameState.roundEndTime}
            />
          ) : (
            // Fallback if submission index is invalid (prevents white screen)
            <div className="text-center py-20 animate-fade-in">
              <h2 className="text-3xl font-bold text-white mb-4">Veri Yükleniyor veya Sıra Tamamlandı</h2>
              <p className="text-gray-400">Lütfen bekleyin veya sayfa yenilenmezse moderatör ile iletişime geçin.</p>
              {currentUser.isMod && (
                <button 
                  onClick={handleFinishGame}
                  className="mt-6 bg-indigo-600 px-6 py-3 rounded-xl font-bold"
                >
                  Sonuçlara Geç (Zorla)
                </button>
              )}
            </div>
          )
        )}

        {gameState.status === AppStatus.RESULTS && (
          <ResultsView 
            submissions={gameState.submissions}
            onReset={handleReset}
            isMod={currentUser?.isMod || false}
          />
        )}
      </main>
    </div>
  );
};

export default App;