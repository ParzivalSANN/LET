import React, { useState, useEffect } from 'react';
import { INITIAL_STATE, GameState, AppStatus, User, Submission } from './types';
import { subscribeToGame, saveState, resetGame, isOnlineMode } from './services/storageService';
import { LobbyView } from './components/LobbyView';
import { VotingView } from './components/VotingView';
import { ResultsView } from './components/ResultsView';
import { WifiIcon, SignalSlashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  // Room ID Logic
  const [roomId, setRoomId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  
  // Pending login state to handle the async nature of connecting to a room then joining
  const [pendingLogin, setPendingLogin] = useState<{name: string, password?: string, isMod: boolean} | null>(null);
  const [loginError, setLoginError] = useState<string>('');

  // Initialize Room from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    if (urlRoom) {
      setRoomId(urlRoom);
    }
    setIsOnline(isOnlineMode());
  }, []);

  // Sync state from Storage Service
  useEffect(() => {
    if (!roomId) return;

    // Update URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomId);
    window.history.replaceState({}, '', url);

    const unsubscribe = subscribeToGame(roomId, (newState) => {
      setGameState(newState);
    });

    return () => {
      // Cleanup managed by service
    };
  }, [roomId]);

  // Handle Pending Login (Wait for GameState to load after setting RoomID)
  useEffect(() => {
    if (pendingLogin && gameState && roomId) {
        // Try to join now that we have state
        const success = executeJoin(pendingLogin.name, pendingLogin.password, pendingLogin.isMod);
        if (success) {
            setPendingLogin(null); // Clear pending
            setLoginError('');
        } else {
            // Only set error if we are sure data is loaded (users array exists)
            // For a new room, users might be empty, which is fine for new user
            // But if it's a mod login failure or password mismatch, we handle it.
            setPendingLogin(null);
            setLoginError('Giriş başarısız. İsim kullanımda veya şifre hatalı.');
        }
    }
  }, [gameState, pendingLogin, roomId]);

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

  // Actual Logic to Modify State
  const executeJoin = (name: string, password?: string, isMod: boolean = false): boolean => {
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
        // If mod, allow creation anytime. If user, ensure name isn't taken by a different type
        if (gameState.users.some(u => u.name === finalName)) return false;

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

  // Handlers triggered by UI
  const handleConnectAndJoin = (roomInput: string, name: string, password?: string, isMod: boolean = false) => {
      const cleanRoom = roomInput.trim();
      if (!cleanRoom) return false;

      // If we are already in this room, try to join immediately
      if (roomId === cleanRoom) {
          return executeJoin(name, password, isMod);
      }

      // If switching rooms or first time
      setRoomId(cleanRoom);
      setPendingLogin({ name, password, isMod });
      return true; // Return true to indicate process started (UI shows loading)
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
    setRoomId(null); // Optional: Clear room on sign out? Let's keep room for UX.
    window.location.href = window.location.pathname; // Hard reset to clear URL params and state
  };

  const currentSubmission = 
    gameState.status === AppStatus.VOTING && gameState.submissions.length > 0 
    ? gameState.submissions[gameState.currentSubmissionIndex] 
    : undefined;

  // Render Logic
  return (
    <div className="min-h-screen text-gray-100 p-4 md:p-8 font-sans">
      {/* Top Bar - Only show if logged in */}
      {currentUser && (
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
      </div>
      )}

      {!isOnline && currentUser && (
        <div className="max-w-7xl mx-auto mb-6 bg-red-900/20 border border-red-500/30 rounded-xl p-6 flex flex-col md:flex-row items-start gap-4 animate-pulse-slow">
            <div className="bg-red-500/20 p-3 rounded-xl text-red-500 shrink-0">
                <ExclamationTriangleIcon className="w-8 h-8" />
            </div>
            <div>
                <h4 className="font-black text-red-400 text-lg mb-1">DİKKAT: Veritabanı Bağlı Değil!</h4>
                <p className="text-sm text-red-200/80 leading-relaxed">
                    Offline Moddasınız.
                </p>
            </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto transition-all duration-500 ease-in-out">
        {(!currentUser) && (
          // LOGIN SCREEN (Managed by LobbyView now acts as Login View)
           <LobbyView 
            roomId={roomId || ""}
            currentUser={null}
            users={[]}
            submissions={[]}
            onJoin={(name, password, isMod, roomInput) => handleConnectAndJoin(roomInput || roomId || "", name, password, isMod)}
            onSubmitLink={() => {}}
            onStartGame={() => {}}
            isMod={false}
            externalError={loginError}
            isLoading={!!pendingLogin}
          />
        )}

        {currentUser && gameState.status === AppStatus.LOBBY && (
          <LobbyView 
            roomId={roomId || ""}
            currentUser={currentUser}
            users={gameState.users}
            submissions={gameState.submissions}
            onJoin={() => true} // Already joined
            onSubmitLink={handleSubmitLink}
            onStartGame={handleStartGame}
            isMod={currentUser.isMod}
          />
        )}

        {currentUser && gameState.status === AppStatus.VOTING && (
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

        {currentUser && gameState.status === AppStatus.RESULTS && (
          <ResultsView 
            submissions={gameState.submissions}
            onReset={handleReset}
            isMod={currentUser.isMod}
          />
        )}
      </main>
    </div>
  );
};

export default App;