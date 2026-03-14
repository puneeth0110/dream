import React, { useState, useMemo } from 'react';
import { Player, PlayerRole } from '../types';
import { SAMPLE_PLAYERS } from '../constants';
import { Search, Plus, X } from 'lucide-react';

interface PlayerSelectorProps {
  selectedIds: string[];
  onSelect: (player: Player) => void;
  disabled: boolean;
}

export const PlayerSelector: React.FC<PlayerSelectorProps> = ({ selectedIds, onSelect, disabled }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredPlayers = useMemo(() => {
    return SAMPLE_PLAYERS.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      !selectedIds.includes(p.id)
    );
  }, [search, selectedIds]);

  const handleAddCustom = () => {
    if (!search.trim()) return;
    const customPlayer: Player = {
      id: `custom-${Date.now()}`,
      name: search.trim(),
      role: PlayerRole.BATTER, // Default role
      rating: 7.0, // Default rating
      points: 8, // Default points for custom player
      battingPosition: 'Middle Order',
      bowlingType: 'None'
    };
    onSelect(customPlayer);
    setSearch('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 focus-within:border-emerald-500 transition-all">
        <Search className="w-5 h-5 text-zinc-500" />
        <input
          type="text"
          placeholder={disabled ? "Squad is full (11 players)" : "Search or add custom player..."}
          className="bg-transparent border-none outline-none text-zinc-100 w-full py-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !disabled && filteredPlayers.length === 0) {
              handleAddCustom();
            }
          }}
          disabled={disabled}
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && !disabled && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-20 max-h-64 overflow-y-auto">
            {filteredPlayers.map(player => (
              <button
                key={player.id}
                className="w-full text-left px-4 py-3 hover:bg-zinc-800 flex items-center justify-between border-b border-zinc-800 last:border-0 transition-colors"
                onClick={() => {
                  onSelect(player);
                  setSearch('');
                  setIsOpen(false);
                }}
              >
                <div>
                  <div className="text-zinc-100 font-medium">{player.name}</div>
                  <div className="text-xs text-zinc-500">{player.role} • {player.points} pts</div>
                </div>
                <Plus className="w-4 h-4 text-emerald-500" />
              </button>
            ))}
            
            {search.trim() && (
              <button
                className="w-full text-left px-4 py-3 hover:bg-zinc-800 flex items-center justify-between bg-emerald-500/5 transition-colors"
                onClick={handleAddCustom}
              >
                <div>
                  <div className="text-emerald-400 font-medium italic">Add "{search}" as custom player</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Manual Entry</div>
                </div>
                <Plus className="w-4 h-4 text-emerald-400" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
