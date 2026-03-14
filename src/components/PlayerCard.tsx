import React from 'react';
import { Player, PlayerRole } from '../types';
import { User, Shield, Zap, Target, Trash2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PlayerCardProps {
  player: Player;
  onRemove?: (id: string) => void;
  onUpdateRole?: (id: string, role: PlayerRole) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onRemove, onUpdateRole }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getRoleIcon = (role: PlayerRole) => {
    switch (role) {
      case PlayerRole.BATTER: return <Zap className="w-4 h-4 text-orange-400" />;
      case PlayerRole.BOWLER: return <Target className="w-4 h-4 text-emerald-400" />;
      case PlayerRole.ALL_ROUNDER: return <Shield className="w-4 h-4 text-blue-400" />;
      case PlayerRole.WICKETKEEPER: return <User className="w-4 h-4 text-purple-400" />;
      default: return null;
    }
  };

  const roles = Object.values(PlayerRole);

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`card-glass rounded-2xl p-4 flex flex-col gap-4 group hover:border-emerald-500/30 transition-all shadow-2xl relative ${isDragging ? 'z-50 ring-2 ring-emerald-500' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <GripVertical className="w-5 h-5" />
          </div>
          
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-zinc-400 font-bold border border-zinc-700/50 shadow-inner">
            {player.name.split(' ').map(n => n[0]).join('')}
          </div>
          
          <div>
            <h3 className="font-display font-bold text-zinc-100 tracking-tight">{player.name}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {player.bowlingType && player.bowlingType !== 'None' && (
                <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {player.bowlingType}
                </span>
              )}
              {player.isDeathBowler && (
                <span className="text-[9px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">
                  Death
                </span>
              )}
              {player.battingPosition && (
                <span className="text-[9px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20">
                  {player.battingPosition}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Points</div>
            <div className="text-lg font-display font-black text-emerald-400 leading-none">{player.points}</div>
          </div>
          
          <div className="text-right">
            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Skill</div>
            <div className="text-lg font-display font-black text-zinc-400 leading-none">{player.rating}</div>
          </div>
          
          {onRemove && (
            <button 
              onClick={() => onRemove(player.id)}
              className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Role Selector */}
      <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-zinc-800/50">
        {roles.map((role) => (
          <button
            key={role}
            onClick={() => onUpdateRole?.(player.id, role)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
              player.role === role 
                ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/50'
            }`}
            title={role}
          >
            {getRoleIcon(role)}
            <span className="hidden sm:inline mt-0.5">{role.split('-')[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

