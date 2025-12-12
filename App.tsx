import React, { useState, useEffect } from 'react';
import { INITIAL_STATE, GameState, AppStatus, User, Submission } from './types';
import { subscribeToGame, saveState, resetGame, isOnlineMode } from './services/storageService';
import { LobbyView } from './components/LobbyView';
import { VotingView } from './components/VotingView';
import { ResultsView } from './components/ResultsView';
import { CloudIcon, WifiIcon, SignalSlashIcon, ExclamationTriangleIcon, HashtagIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  // Room ID Logic
  const [roomId, setRoomId] = useState<string | null>(null);
  const [tempRoomInput, setTempRoomInput] = useState('');

  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  // Initialize Room from URL or Session
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    if (urlRoom) {
      setRoomId(urlRoom);
    }
    setIsOnline(isOnlineMode());
  }, []);

  // Sync state from Storage Service (Firebase or LocalStorage)
  useEffect(() => {
    if (!roomId) return;

    // Update URL without reloading to allow easy sharing
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomId);
    window.history.replaceState({}, '', url);

    // Subscribe to changes for this specific room
    const unsubscribe = subscribeToGame(roomId, (newState) => {
      setGameState(newState);
    });

    return () => {
      // Unsubscribe logic handled inside service
    };
  }, [roomId]);

  // Restore user session
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

  const handleRoomEnter = () => {
    if (!tempRoomInput.trim()) return;
    setRoomId(tempRoomInput.trim());
  };

  // Handlers
  const handleJoin = (name: string, password?: string, isMod: boolean = false): boolean => {
    if (!roomId) return false;

    const finalName = isMod && name === 'Moderatör' ? 'Moderatör (Berkay)' : name;
    
    const existingUser = gameState.users.find(u => u.name === finalName && u.isMod === isMod);
    let userToSet: User;

    if (existingUser) {
      if (!isMod) {
         const storedPassword = existingUser.password || "";
         const inputPassword = password || "";
         if (storedPassword !== inputPassword) {
             return false;
         }
      }
      userToSet = { ...existingUser, password: existingUser.password || "" };
    } else {
      userToSet = {
        id: crypto.randomUUID(),
        name: finalName,
        isMod: isMod,
        joinedAt: Date.now(),
        password: password || ""
      };
      
      const newState = {
        ...gameState,
        users: [...gameState.users, userToSet]
      };
      saveState(roomId, newState);
    }

    setCurrentUser(userToSet);
    localStorage.setItem('linkyaris_user_session', JSON.stringify(userToSet));
    return true;
  };

  const handleSubmitLink = (url: string, description: string) => {
    if (!currentUser || !roomId) return;
    
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
    saveState(roomId, newState);
  };

  const handleStartGame = (duration: number) => {
    if (!roomId) return;
    const newState: GameState = {
      ...gameState,
      status: AppStatus.VOTING,
      currentSubmissionIndex: 0,
      settings: {
        timerDuration: duration
      },
      roundEndTime: Date.now() + (duration * 1000)
    };
    saveState(roomId, newState);
  };

  const handleVote = (score: number) => {
    if (!currentUser || !roomId) return;
    const currentSub = gameState.submissions[gameState.currentSubmissionIndex];
    if (!currentSub) return;

    const updatedSub = {
      ...currentSub,
      votes: { ...currentSub.votes, [currentUser.id]: score }
    };

    const updatedSubmissions = [...gameState.submissions];
    updatedSubmissions[gameState.currentSubmissionIndex] = updatedSub;

    saveState(roomId, {
      ...gameState,
      submissions: updatedSubmissions
    });
  };

  const handleNextSubmission = () => {
    if (!roomId) return;
    const nextIndex = gameState.currentSubmissionIndex + 1;
    if (nextIndex < gameState.submissions.length) {
      saveState(roomId, {
        ...gameState,
        currentSubmissionIndex: nextIndex,
        roundEndTime: Date.now() + (gameState.settings.timerDuration * 1000)
      });
    }
  };

  const handleFinishGame = () => {
    if (!roomId) return;
    saveState(roomId, {
      ...gameState,
      status: AppStatus.RESULTS
    });
  };

  const handleUpdateAiComment = (submissionId: string, comment: string) => {
     if (!roomId) return;
     const updatedSubmissions = gameState.submissions.map(s => {
       if (s.id === submissionId) {
         return { ...s, aiCommentary: comment };
       }
       return s;
     });
     
     saveState(roomId, {
       ...gameState,
       submissions: updatedSubmissions
     });
  };

  const handleReset = () => {
    if (!roomId) return;
    if (confirm("Herkes için oyunu sıfırlamak istediğine emin misin?")) {
        resetGame(roomId);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('linkyaris_user_session');
    setCurrentUser(null);
  };

  // ROOM SELECTION SCREEN
  if (!roomId) {
    return (
      <div className="min-h-screen text-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-glass backdrop-blur-2xl p-8 md:p-12 rounded-[2rem] shadow-2xl border border-white/10 w-full max-w-md text-center">
            <div className="mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center font-bold text-3xl shadow-[0_0_20px_rgba(99,102,241,0.5)] mb-4">
                    LY
                </div>
                <h1 className="text-3xl font-extrabold text-white">LinkYarış</h1>
                <p className="text-gray-400 mt-2">Yarışmaya başlamak için bir oda numarası gir.</p>
            </div>
            
            <div className="space-y-4">
                <div className="relative">
                    <HashtagIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-400" />
                    <input 
                        type="text" 
                        value={tempRoomInput}
                        onChange={(e) => setTempRoomInput(e.target.value)}
                        placeholder="Oda Numarası (Örn: 101)"
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-xl pl-12 pr-4 py-4 text-white text-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                        onKeyDown={(e) => e.key === 'Enter' && handleRoomEnter()}
                    />
                </div>
                <button 
                    onClick={handleRoomEnter}
                    disabled={!tempRoomInput.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    Odaya Gir <ArrowRightIcon className="w-5 h-5" />
                </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-6">
                Arkadaşlarınla aynı odaya girmeyi unutma!
            </p>
        </div>
      </div>
    );
  }

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
          <div className="hidden sm:block">
             <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 block leading-tight">LinkYarış</span>
             <span className="text-xs text-indigo-400 font-mono font-bold tracking-wider">ODA: {roomId}</span>
          </div>
          
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isOnline ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {isOnline ? (
                <>
                    <WifiIcon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Online</span>
                </>
            ) : (
                <>
                    <SignalSlashIcon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Offline</span>
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
                        Moderatör
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
                Çıkış
              </button>
          </div>
        )}
      </div>

      {!isOnline && (
        <div className="max-w-7xl mx-auto mb-6 bg-red-900/20 border border-red-500/30 rounded-xl p-6 flex flex-col md:flex-row items-start gap-4 animate-pulse-slow">
            <div className="bg-red-500/20 p-3 rounded-xl text-red-500 shrink-0">
                <ExclamationTriangleIcon className="w-8 h-8" />
            </div>
            <div>
                <h4 className="font-black text-red-400 text-lg mb-1">DİKKAT: Veritabanı Bağlı Değil!</h4>
                <p className="text-sm text-red-200/80 leading-relaxed">
                    Şu an <strong>Offline Moddasınız</strong>. Çok oyunculu mod için Firebase ayarları gereklidir.
                    <br/>
                    Diğer cihazlardan giriş yapmak için bilgisayarınızın IP adresini kullanın (Örn: 192.168.1.35:5173).
                </p>
            </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto transition-all duration-500 ease-in-out">
        {gameState.status === AppStatus.LOBBY && (
          <LobbyView 
            roomId={roomId}
            currentUser={currentUser}
            users={gameState.users}
            submissions={gameState.submissions}
            onJoin={handleJoin}
            onSubmitLink={handleSubmitLink}
            onStartGame={handleStartGame}
            isMod={currentUser?.isMod || false}
          />
        )}

        {gameState.status === AppStatus.VOTING && currentUser && (
          currentSubmission ? (
            <VotingView 
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
            <div className="text-center py-20 animate-fade-in">
              <h2 className="text-3xl font-bold text-white mb-4">Veri Yükleniyor...</h2>
              {currentUser.isMod && (
                <button onClick={handleFinishGame} className="bg-indigo-600 px-6 py-3 rounded-xl font-bold">Sonuçlara Geç</button>
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