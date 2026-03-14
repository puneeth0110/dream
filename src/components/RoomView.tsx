import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { doc, onSnapshot, updateDoc, collection, query } from 'firebase/firestore';
import { Room, RoomPlayer } from '../types';
import { Users, Play, CheckCircle2, Circle, Copy, LogOut } from 'lucide-react';

interface RoomViewProps {
  roomId: string;
  onLeave: () => void;
  onStart: () => void;
}

export const RoomView: React.FC<RoomViewProps> = ({ roomId, onLeave, onStart }) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubRoom = onSnapshot(doc(db, 'rooms', roomId), (doc) => {
      if (doc.exists()) {
        setRoom({ id: doc.id, ...doc.data() } as Room);
        if (doc.data().status === 'active') {
          onStart();
        }
      }
    });

    const unsubPlayers = onSnapshot(query(collection(db, 'rooms', roomId, 'players')), (snapshot) => {
      const playersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoomPlayer));
      setPlayers(playersData);
    });

    return () => {
      unsubRoom();
      unsubPlayers();
    };
  }, [roomId, onStart]);

  const copyCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const startContest = async () => {
    if (room && auth.currentUser?.uid === room.hostId) {
      await updateDoc(doc(db, 'rooms', roomId), {
        status: 'active'
      });
    }
  };

  if (!room) return null;

  const isHost = auth.currentUser?.uid === room.hostId;
  const allReady = players.length > 1 && players.every(p => p.isReady);

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-6">
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">Room Code</div>
          <div className="flex items-center justify-center gap-4">
            <div className="text-5xl font-mono font-black tracking-widest text-emerald-500">{room.code}</div>
            <button 
              onClick={copyCode}
              className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
            >
              {copied ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Copy className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8 py-4 border-y border-zinc-800/50">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Players</div>
            <div className="text-2xl font-bold">{players.length}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Status</div>
            <div className="text-sm font-bold text-emerald-500 uppercase tracking-wider">{room.status}</div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-left text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Users className="w-3 h-3" />
            Participants
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {players.map(player => (
              <div key={player.id} className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${player.isReady ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`} />
                  <span className="font-medium">{player.username} {player.id === room.hostId && <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded ml-2">HOST</span>}</span>
                </div>
                {player.isReady ? (
                  <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    Ready
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-zinc-600 text-xs font-bold uppercase tracking-wider">
                    <Circle className="w-4 h-4" />
                    Building...
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          {isHost ? (
            <button
              onClick={startContest}
              disabled={players.length < 2}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20"
            >
              <Play className="w-5 h-5 fill-current" />
              Start Contest
            </button>
          ) : (
            <div className="bg-zinc-800/50 text-zinc-400 py-4 rounded-2xl text-sm font-medium">
              Waiting for host to start...
            </div>
          )}
          
          <button
            onClick={onLeave}
            className="flex items-center justify-center gap-2 text-zinc-500 hover:text-red-400 text-sm font-medium py-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Leave Room
          </button>
        </div>
      </div>
      
      {players.length < 2 && (
        <div className="text-center text-zinc-500 text-sm italic">
          Invite at least one more player to start the contest.
        </div>
      )}
    </div>
  );
};
