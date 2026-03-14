import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { LogIn, Plus, Users, ArrowRight } from 'lucide-react';

interface MultiplayerLobbyProps {
  onJoinRoom: (roomId: string) => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ onJoinRoom }) => {
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError('Failed to login');
    }
  };

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = async () => {
    if (!auth.currentUser || !username.trim()) {
      setError('Please login and enter a username');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const code = generateCode();
      const roomRef = await addDoc(collection(db, 'rooms'), {
        code,
        status: 'waiting',
        createdAt: serverTimestamp(),
        hostId: auth.currentUser.uid
      });

      await setDoc(doc(db, 'rooms', roomRef.id, 'players', auth.currentUser.uid), {
        username: username.trim(),
        isReady: false
      });

      onJoinRoom(roomRef.id);
    } catch (err) {
      setError('Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!auth.currentUser || !username.trim() || !roomCode.trim()) {
      setError('Please login, enter username and room code');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'rooms'), where('code', '==', roomCode.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Room not found');
        return;
      }

      const roomDoc = querySnapshot.docs[0];
      if (roomDoc.data().status !== 'waiting') {
        setError('Contest already started or finished');
        return;
      }

      await setDoc(doc(db, 'rooms', roomDoc.id, 'players', auth.currentUser.uid), {
        username: username.trim(),
        isReady: false
      });

      onJoinRoom(roomDoc.id);
    } catch (err) {
      setError('Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  if (!auth.currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
          <LogIn className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Multiplayer Mode</h2>
          <p className="text-zinc-500 text-sm mt-1">Sign in to compete with friends</p>
        </div>
        <button
          onClick={handleLogin}
          className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-zinc-200 transition-all"
        >
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-8 py-10">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Your Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none transition-all"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={createRoom}
          disabled={isLoading || !username.trim()}
          className="flex items-center justify-between bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-black p-6 rounded-2xl transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-black/10 rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-bold text-lg">Create Room</div>
              <div className="text-xs opacity-70">Start a new contest</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest text-zinc-600 font-bold">
            <span className="bg-black px-4">Or Join Existing</span>
          </div>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="Enter 6-digit code"
            maxLength={6}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-[0.5em] focus:border-emerald-500 outline-none transition-all"
          />
          <button
            onClick={joinRoom}
            disabled={isLoading || !username.trim() || roomCode.length < 6}
            className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white py-4 rounded-xl font-bold transition-all"
          >
            <Users className="w-5 h-5" />
            Join Contest
          </button>
        </div>
      </div>
    </div>
  );
};
