import { useState, useEffect, useCallback } from 'react';
import { Player, TeamRating, PlayerRole, Room, RoomPlayer } from './types';
import { PlayerCard } from './components/PlayerCard';
import { RatingDashboard } from './components/RatingDashboard';
import { PlayerSelector } from './components/PlayerSelector';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { RoomView } from './components/RoomView';
import { Leaderboard } from './components/Leaderboard';
import { analyzeTeam } from './services/geminiService';
import { db, auth } from './firebase';
import { doc, updateDoc, onSnapshot, getDocs, collection, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Users, LayoutDashboard, Sparkles, X, Trophy, Globe, CheckCircle2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

export default function App() {
  const [squad, setSquad] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<TeamRating>({
    overall: 0,
    batting: 0,
    bowling: 0,
    allRounder: 0,
    balance: 0,
    suggestions: ["Build your squad to get an AI analysis."]
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'builder' | 'rating' | 'multiplayer'>('builder');
  
  // Multiplayer State
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [userPlayer, setUserPlayer] = useState<RoomPlayer | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const triggerAnalysis = async () => {
      if (squad.length > 0) {
        setIsAnalyzing(true);
        const result = await analyzeTeam(squad);
        setRating(result);
        setIsAnalyzing(false);
      } else {
        setRating({
          overall: 0,
          batting: 0,
          bowling: 0,
          allRounder: 0,
          balance: 0,
          suggestions: ["Build your squad to get an AI analysis."]
        });
      }
    };

    const timeoutId = setTimeout(triggerAnalysis, 1000);
    return () => clearTimeout(timeoutId);
  }, [squad]);

  const totalPoints = squad.reduce((sum, p) => sum + (p.points || 0), 0);

  const addPlayer = (player: Player) => {
    if (isReady) return;
    if (squad.length >= 11) return;
    if (squad.find(p => p.id === player.id)) return;
    
    const playerPoints = player.points || 8; // Default to 8 if points not specified (for custom players)
    if (totalPoints + playerPoints > 85) {
      setError("Not enough points remaining.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSquad([...squad, { ...player, points: playerPoints }]);
    setError(null);
  };

  const removePlayer = (id: string) => {
    if (isReady) return;
    setSquad(squad.filter(p => p.id !== id));
  };

  const updatePlayerRole = (id: string, role: PlayerRole) => {
    if (isReady) return;
    setSquad(squad.map(p => p.id === id ? { ...p, role } : p));
  };

  useEffect(() => {
    if (!roomId || !auth.currentUser) return;

    const unsubRoom = onSnapshot(doc(db, 'rooms', roomId), (docSnap) => {
      if (docSnap.exists()) {
        const roomData = { id: docSnap.id, ...docSnap.data() } as Room;
        setRoom(roomData);
        if (roomData.status === 'active') {
          setActiveTab('builder');
        }
      }
    });

    const unsubPlayer = onSnapshot(doc(db, 'rooms', roomId, 'players', auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserPlayer({ id: docSnap.id, ...docSnap.data() } as RoomPlayer);
      }
    });

    return () => {
      unsubRoom();
      unsubPlayer();
    };
  }, [roomId]);

  const toggleReady = async () => {
    if (!roomId || !auth.currentUser || squad.length !== 11) {
      setError("Select 11 players before marking as ready.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    const newReady = !isReady;
    setIsReady(newReady);

    // Calculate a simulated score based on player ratings
    const baseScore = squad.reduce((sum, p) => sum + p.rating, 0);
    const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    const finalScore = baseScore * randomFactor;

    await updateDoc(doc(db, 'rooms', roomId, 'players', auth.currentUser.uid), {
      isReady: newReady,
      squad: squad,
      totalPoints: totalPoints,
      score: finalScore
    });
  };

  const finishContest = async () => {
    if (roomId && room?.hostId === auth.currentUser?.uid) {
      await updateDoc(doc(db, 'rooms', roomId), {
        status: 'finished'
      });
    }
  };

  const leaveRoom = () => {
    setRoomId(null);
    setRoom(null);
    setSquad([]);
    setIsReady(false);
    setActiveTab('multiplayer');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (isReady) return; // Lock team if ready
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSquad((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-zinc-800 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Dream XI <span className="text-emerald-500">Rater</span></h1>
          </div>
          
          <div className="flex bg-zinc-900 rounded-full p-1 border border-zinc-800">
            <button 
              onClick={() => setActiveTab('builder')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'builder' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Squad</span>
            </button>
            <button 
              onClick={() => setActiveTab('rating')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'rating' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Analysis</span>
            </button>
            <button 
              onClick={() => setActiveTab('multiplayer')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'multiplayer' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Multiplayer</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 pb-24">
        <AnimatePresence mode="wait">
          {room?.status === 'finished' ? (
            <Leaderboard roomId={roomId!} onReset={leaveRoom} />
          ) : activeTab === 'multiplayer' ? (
            roomId ? (
              <RoomView roomId={roomId} onLeave={leaveRoom} onStart={() => setActiveTab('builder')} />
            ) : (
              <MultiplayerLobby onJoinRoom={(id) => setRoomId(id)} />
            )
          ) : activeTab === 'builder' ? (
            <motion.div 
              key="builder"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <section className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {room?.status === 'active' ? 'Contest is LIVE' : 'Build Your Squad'}
                    </h2>
                    <p className="text-zinc-500 text-sm">
                      {room?.status === 'active' ? 'Complete your team and mark as ready' : 'Select 11 players for your dream team'}
                    </p>
                  </div>
                  <div className="flex gap-6 text-right">
                    {roomId && (
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Room</div>
                        <div className="text-2xl font-mono font-bold text-emerald-500">{room?.code}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Points Used</div>
                      <div className={`text-2xl font-mono font-bold ${totalPoints > 85 ? 'text-orange-500' : 'text-zinc-100'}`}>
                        {totalPoints}<span className="text-zinc-700">/85</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Squad Size</div>
                      <div className={`text-2xl font-mono font-bold ${squad.length === 11 ? 'text-emerald-500' : 'text-zinc-100'}`}>
                        {squad.length}<span className="text-zinc-700">/11</span>
                      </div>
                    </div>
                  </div>
                </div>

                {!isReady && (
                  <div className="relative">
                    <PlayerSelector 
                      selectedIds={squad.map(p => p.id)} 
                      onSelect={addPlayer}
                      disabled={squad.length >= 11}
                    />
                    
                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2 px-4 rounded-lg flex items-center gap-2 z-40"
                        >
                          <X className="w-3 h-3" />
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {isReady && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-2">
                    <Trophy className="w-10 h-10 text-emerald-500 mb-2" />
                    <h3 className="text-xl font-bold">Team Locked!</h3>
                    <p className="text-zinc-400 text-sm max-w-xs">
                      Your squad is submitted. Waiting for other players to finish.
                    </p>
                    <button 
                      onClick={toggleReady}
                      className="text-emerald-500 text-xs font-bold uppercase tracking-widest hover:underline mt-4"
                    >
                      Edit Squad
                    </button>
                  </div>
                )}
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {squad.length > 0 ? (
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={squad.map(p => p.id)}
                      strategy={rectSortingStrategy}
                    >
                      {squad.map((player) => (
                        <PlayerCard 
                          key={player.id}
                          player={player} 
                          onRemove={isReady ? undefined : removePlayer} 
                          onUpdateRole={isReady ? undefined : updatePlayerRole}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-3xl text-zinc-600">
                    <Users className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Your squad is empty</p>
                    <p className="text-sm">Start adding players using the search bar above</p>
                  </div>
                )}
              </section>
            </motion.div>
          ) : (
            <motion.div 
              key="rating"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <section>
                <h2 className="text-2xl font-bold mb-2">Team Analysis</h2>
                <p className="text-zinc-500 text-sm mb-6">Real-time performance metrics and AI suggestions</p>
                <RatingDashboard rating={rating} isLoading={isAnalyzing} />
              </section>

              {squad.length < 11 && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-center gap-3 text-orange-400">
                  <Sparkles className="w-5 h-5 shrink-0" />
                  <p className="text-sm">Complete your squad of 11 players for a more accurate AI analysis.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Bar for Mobile / Ready Button */}
      {squad.length > 0 && activeTab === 'builder' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xs px-4 flex flex-col gap-2">
          {roomId && room?.status === 'active' && !isReady && (
            <button 
              onClick={toggleReady}
              disabled={squad.length !== 11}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold py-4 rounded-2xl shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5" />
              I'm Ready!
            </button>
          )}

          {roomId && room?.status === 'active' && room.hostId === auth.currentUser?.uid && (
            <button 
              onClick={finishContest}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Trophy className="w-4 h-4" />
              Finish Contest
            </button>
          )}

          {activeTab === 'builder' && !roomId && (
            <button 
              onClick={() => setActiveTab('rating')}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-2xl shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <LayoutDashboard className="w-5 h-5" />
              Analyze Squad
            </button>
          )}
        </div>
      )}
    </div>
  );
}
