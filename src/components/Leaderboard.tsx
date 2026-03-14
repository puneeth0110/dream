import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { RoomPlayer } from '../types';
import { Trophy, Medal, Users, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';

interface LeaderboardProps {
  roomId: string;
  onReset: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ roomId, onReset }) => {
  const [players, setPlayers] = useState<RoomPlayer[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'rooms', roomId, 'players'), orderBy('score', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const playersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoomPlayer));
      setPlayers(playersData);
    });

    return () => unsub();
  }, [roomId]);

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-emerald-500/10 rounded-2xl mb-2">
          <Trophy className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-3xl font-black tracking-tight">Final Standings</h2>
        <p className="text-zinc-500 text-sm">The contest has concluded. Here are the results!</p>
      </div>

      <div className="space-y-3">
        {players.map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center justify-between p-6 rounded-2xl border ${
              index === 0 
                ? 'bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20' 
                : 'bg-zinc-900 border-zinc-800'
            }`}
          >
            <div className="flex items-center gap-6">
              <div className="flex items-center justify-center w-10 h-10">
                {index === 0 ? (
                  <Trophy className="w-8 h-8 text-yellow-500" />
                ) : index === 1 ? (
                  <Medal className="w-7 h-7 text-zinc-300" />
                ) : index === 2 ? (
                  <Medal className="w-7 h-7 text-orange-400" />
                ) : (
                  <span className="text-xl font-mono font-bold text-zinc-700">#{index + 1}</span>
                )}
              </div>
              
              <div>
                <div className="font-bold text-lg flex items-center gap-2">
                  {player.username}
                  {index === 0 && <span className="text-[10px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-black">WINNER</span>}
                </div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
                  {player.squad?.length || 0} Players Selected
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Total Score</div>
              <div className={`text-2xl font-mono font-black ${index === 0 ? 'text-emerald-500' : 'text-zinc-100'}`}>
                {player.score?.toFixed(1) || '0.0'}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="pt-8">
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors py-4 border-t border-zinc-800"
        >
          <RotateCcw className="w-4 h-4" />
          Back to Main Menu
        </button>
      </div>
    </div>
  );
};
