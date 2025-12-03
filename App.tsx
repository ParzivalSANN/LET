import React, { useState, useEffect } from 'react';
import { Room, RoomStatus, User, Submission } from './types';
import { createRoom } from './services/roomService';
import { subscribeToRoom, getRoomByPin, saveRoom, isOnlineMode } from './services/roomStorageService';
import { RoomCodeEntry } from './components/RoomCodeEntry';
import { WaitingRoom } from './components/WaitingRoom';
import { LinkSubmission } from './components/LinkSubmission';
import { LobbyView } from './components/LobbyView';
import { VotingView } from './components/VotingView';
import { ResultsView } from './components/ResultsView';
import { WifiIcon, SignalSlashIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isModLoginScreen, setIsModLoginScreen] = useState(false);
  const [modEmail, setModEmail] = useState('');
  const [modPassword, setModPassword] = useState('');
  const [error, setError] = useState('');

  // Check online status
  useEffect(() => {
    setIsOnline(isOnlineMode());
  }, []);

  // Subscribe to room updates (only in online mode)
  useEffect(() => {
    if (!currentRoom || !isOnline) return; // Skip subscription in offline mode

    console.log('Setting up subscription for room:', currentRoom.id);

    const unsubscribe = subscribeToRoom(currentRoom.id, (updatedRoom) => {
      if (updatedRoom) {
        console.log('Room update received:', {
          status: updatedRoom.status,
          users: updatedRoom.users?.length,
          submissions: updatedRoom.submissions?.length
        });
        setCurrentRoom(updatedRoom);
      } else {
        // Room not found or deleted, keep current room (might be just created)
        console.log('Room not found in subscription, keeping current room');
      }
    });

    return () => unsubscribe();
  }, [currentRoom?.id, isOnline]);

  // Password hashing
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Moderator: Create new room
  const handleCreateRoom = async () => {
    if (modEmail !== 'berkay-34ist@hotmail.com' || modPassword !== '123321') {
      setError('Hatalı e-posta veya şifre!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const modUser: User = {
      id: crypto.randomUUID(),
      name: 'Moderatör (Berkay)',
      isMod: true,
      joinedAt: Date.now(),
      passwordHash: '' // Mods don't need password hash stored in room
    };

    const newRoom = createRoom(modUser.id);
    newRoom.users.push(modUser);
    newRoom.status = RoomStatus.SUBMISSION; // Start in submission phase

    // Set states first
    setCurrentUser(modUser);
    setCurrentRoom(newRoom);
    setIsModLoginScreen(false);

    // Save to storage after a small delay to ensure state updates complete
    setTimeout(async () => {
      await saveRoom(newRoom);
    }, 50);
  };

  // User: Join room with PIN
  const handleJoinRoom = async (pin: string, name: string, password: string) => {
    const room = await getRoomByPin(pin);

    if (!room) {
      alert('❌ Oda bulunamadı! Kodu kontrol et.');
      return;
    }

    if (room.status !== RoomStatus.SUBMISSION) {
      alert('⚠️ Bu oda şu an katılıma kapalı.');
      return;
    }

    const passwordHash = await hashPassword(password);
    const existingUser = room.users.find(u => u.name === name);

    if (existingUser) {
      // Verify password
      if (existingUser.passwordHash !== passwordHash) {
        alert('❌ Yanlış şifre! Bu isimle farklı bir şifre kullanılmış.');
        return;
      }

      // User exists and password is correct - set them as current user
      setCurrentUser(existingUser);
      setCurrentRoom(room);
    } else {
      // Create new user
      const newUser: User = {
        id: crypto.randomUUID(),
        name,
        isMod: false,
        joinedAt: Date.now(),
        passwordHash
      };

      room.users.push(newUser);
      await saveRoom(room);
      setCurrentUser(newUser);
      setCurrentRoom(room);
    }
  };

  // Submit link
  const handleSubmitLink = async (url: string, description: string) => {
    if (!currentRoom || !currentUser) return;

    const newSubmission: Submission = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      userName: currentUser.name,
      url,
      description,
      votes: {}
    };

    const updatedRoom = {
      ...currentRoom,
      submissions: [...(currentRoom.submissions || []), newSubmission]
    };

    await saveRoom(updatedRoom);
  };

  // Start voting
  const handleStartVoting = () => {
    if (!currentRoom) return;

    // Get list of user IDs who have submitted links
    const submittedUserIds = new Set(currentRoom.submissions.map(s => s.userId));

    // Keep only moderators and users who have submitted
    const activeUsers = currentRoom.users.filter(u =>
      u.isMod || submittedUserIds.has(u.id)
    );

    const updatedRoom = {
      ...currentRoom,
      users: activeUsers, // Remove users without submissions
      status: RoomStatus.VOTING,
      currentSubmissionIndex: 0
    };

    saveRoom(updatedRoom);
  };

  // Vote
  const handleVote = async (score: number) => {
    if (!currentRoom || !currentUser) return;

    const currentSub = currentRoom.submissions[currentRoom.currentSubmissionIndex];
    if (!currentSub) return;

    const updatedSub = {
      ...currentSub,
      votes: { ...currentSub.votes, [currentUser.id]: score }
    };

    const updatedSubmissions = [...currentRoom.submissions];
    updatedSubmissions[currentRoom.currentSubmissionIndex] = updatedSub;

    const updatedRoom = {
      ...currentRoom,
      submissions: updatedSubmissions
    };

    await saveRoom(updatedRoom);
  };

  // Next submission
  const handleNextSubmission = async () => {
    if (!currentRoom) return;

    const nextIndex = currentRoom.currentSubmissionIndex + 1;

    if (nextIndex < currentRoom.submissions.length) {
      const updatedRoom = {
        ...currentRoom,
        currentSubmissionIndex: nextIndex
      };
      await saveRoom(updatedRoom);
    }
  };

  // Finish game
  const handleFinishGame = async () => {
    if (!currentRoom) return;

    console.log('Finishing game, current status:', currentRoom.status);

    const updatedRoom = {
      ...currentRoom,
      status: RoomStatus.RESULTS
    };

    console.log('Setting status to RESULTS');
    await saveRoom(updatedRoom);
    console.log('Room saved with RESULTS status');
  };

  // Update AI comment
  const handleUpdateAiComment = async (submissionId: string, comment: string) => {
    if (!currentRoom) return;

    const updatedSubmissions = currentRoom.submissions.map(s =>
      s.id === submissionId ? { ...s, aiCommentary: comment } : s
    );

    const updatedRoom = {
      ...currentRoom,
      submissions: updatedSubmissions
    };

    await saveRoom(updatedRoom);
  };

  // Cancel room
  const handleCancelRoom = () => {
    if (confirm('Yarışmayı iptal etmek istediğine emin misin?')) {
      setCurrentRoom(null);
      setCurrentUser(null);
    }
  };

  // Back to lobby (for mod)
  const handleBackToLobby = async () => {
    if (!currentRoom) return;

    const updatedRoom = {
      ...currentRoom,
      status: RoomStatus.SUBMISSION,
      currentSubmissionIndex: 0
    };

    await saveRoom(updatedRoom);
  };

  // Render moderator login
  if (isModLoginScreen && !currentUser && !currentRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-gray-100">
        <div className="bg-glass backdrop-blur-2xl p-8 rounded-3xl border border-white/10 w-full max-w-md">
          <h2 className="text-3xl font-bold text-white mb-6">Moderatör Girişi</h2>

          <div className="space-y-4 mb-6">
            <input
              type="email"
              value={modEmail}
              onChange={(e) => setModEmail(e.target.value)}
              placeholder="E-posta"
              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <input
              type="password"
              value={modPassword}
              onChange={(e) => setModPassword(e.target.value)}
              placeholder="Şifre"
              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-xl mb-4 text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleCreateRoom}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition-all mb-4"
          >
            Yeni Yarışma Başlat
          </button>

          <button
            onClick={() => setIsModLoginScreen(false)}
            className="w-full text-gray-400 hover:text-white transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // Render room code entry (for users without room)
  if (!currentRoom) {
    return (
      <div className="min-h-screen text-gray-100">
        <RoomCodeEntry
          onJoinRoom={handleJoinRoom}
          onModeratorLogin={() => setIsModLoginScreen(true)}
        />
      </div>
    );
  }

  // Render main app content
  return (
    <div className="min-h-screen text-gray-100 p-4 md:p-8">
      {/* Top Bar */}
      <div className="flex justify-between items-center max-w-7xl mx-auto mb-8 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToLobby}
            className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:shadow-[0_0_25px_rgba(99,102,241,0.7)] cursor-pointer"
            title="Bekleme odasına dön"
          >
            LY
          </button>
          <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 hidden sm:block">LinkYarış</span>

          {/* Connection Status */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isOnline ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {isOnline ? (
              <>
                <WifiIcon className="w-3.5 h-3.5" /> Canlı
              </>
            ) : (
              <>
                <SignalSlashIcon className="w-3.5 h-3.5" /> Offline
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Room PIN */}
          <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <span className="text-gray-400 text-xs mr-2">Oda:</span>
            <span className="font-mono font-bold text-indigo-400 tracking-wider">{currentRoom.pin}</span>
          </div>

          {/* Current User */}
          <div className="flex items-center gap-2 text-sm bg-white/5 px-4 py-2 rounded-full border border-white/10">
            {currentUser.isMod ? (
              <span className="text-yellow-400 font-bold">👑 Moderatör</span>
            ) : (
              <span className="text-white">{currentUser.name}</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {currentRoom.status === RoomStatus.SUBMISSION && (
          <>
            {currentUser.isMod ? (
              <WaitingRoom
                room={currentRoom}
                currentUser={currentUser}
                isMod={true}
                onStartVoting={handleStartVoting}
                onCancelRoom={handleCancelRoom}
              />
            ) : (
              <LinkSubmission
                room={currentRoom}
                currentUser={currentUser}
                onSubmitLink={handleSubmitLink}
              />
            )}
          </>
        )}

        {currentRoom.status === RoomStatus.WAITING && (
          <div className="text-center p-20">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-white mb-2">Oyun Hazırlanıyor...</h2>
            <p className="text-gray-400">Lütfen bekleyin</p>
          </div>
        )}

        {currentRoom.status === RoomStatus.VOTING && (currentRoom.submissions?.length || 0) > 0 && (
          <VotingView
            currentSubmission={currentRoom.submissions[currentRoom.currentSubmissionIndex]}
            isMod={currentUser.isMod}
            currentUser={currentUser}
            allSubmissions={currentRoom.submissions}
            onVote={handleVote}
            onNext={handleNextSubmission}
            onFinish={handleFinishGame}
            isLast={currentRoom.currentSubmissionIndex === (currentRoom.submissions?.length || 0) - 1}
            onUpdateAiComment={handleUpdateAiComment}
          />
        )}

        {currentRoom.status === RoomStatus.RESULTS && (
          <>
            {console.log('Rendering RESULTS:', {
              status: currentRoom.status,
              submissionsCount: currentRoom.submissions?.length,
              isMod: currentUser.isMod
            })}
            <ResultsView
              submissions={currentRoom.submissions || []}
              onReset={handleCancelRoom}
              isMod={currentUser.isMod}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default App;