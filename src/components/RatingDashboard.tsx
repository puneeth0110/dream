import React from 'react';
import { TeamRating } from '../types';
import { motion } from 'motion/react';
import { Trophy, Info, AlertCircle, ShieldCheck } from 'lucide-react';

interface RatingDashboardProps {
  rating: TeamRating;
  isLoading: boolean;
}

export const RatingDashboard: React.FC<RatingDashboardProps> = ({ rating, isLoading }) => {
  const RatingBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</span>
        <span className="text-sm font-display font-black text-zinc-100">{value}<span className="text-zinc-600 text-[10px]">/10</span></span>
      </div>
      <div className="h-1.5 bg-zinc-800/50 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value * 10}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full ${color} shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="card-glass rounded-3xl p-8 shadow-2xl relative overflow-hidden border-emerald-500/10">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Trophy className="w-32 h-32" />
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-2 border-emerald-500/20 rounded-full" />
                <div className="absolute inset-0 w-12 h-12 border-t-2 border-emerald-500 rounded-full animate-spin" />
              </div>
              <p className="text-emerald-500 font-display font-bold text-sm tracking-widest uppercase animate-pulse">Analyzing Squad</p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row items-center gap-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-1000" />
            <svg className="w-40 h-40 transform -rotate-90 relative z-10">
              <circle
                cx="80"
                cy="80"
                r="74"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-zinc-900"
              />
              <motion.circle
                cx="80"
                cy="80"
                r="74"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={464.7}
                initial={{ strokeDashoffset: 464.7 }}
                animate={{ strokeDashoffset: 464.7 - (464.7 * rating.overall) / 10 }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                strokeLinecap="round"
                className="text-emerald-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <span className="text-5xl font-display font-black text-zinc-100 leading-none">{rating.overall}</span>
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1">Rating</span>
            </div>
          </div>

          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
            <RatingBar label="Batting Power" value={rating.batting} color="bg-orange-500" />
            <RatingBar label="Bowling Attack" value={rating.bowling} color="bg-emerald-500" />
            <RatingBar label="Utility / AR" value={rating.allRounder} color="bg-blue-500" />
            <RatingBar label="Squad Balance" value={rating.balance} color="bg-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-glass rounded-2xl p-6 border-emerald-500/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="font-display font-black uppercase text-xs tracking-[0.2em] text-zinc-100">AI Insights</h3>
          </div>
          <ul className="space-y-4">
            {rating.suggestions.map((suggestion, i) => (
              <motion.li 
                key={i} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 text-sm text-zinc-400 leading-relaxed group"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30 mt-2 group-hover:bg-emerald-500 transition-colors" />
                {suggestion}
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="card-glass rounded-2xl p-6 border-orange-500/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="font-display font-black uppercase text-xs tracking-[0.2em] text-zinc-100">Squad Logic</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <p className="text-xs text-zinc-500 leading-relaxed">
                Our algorithm analyzes <span className="text-zinc-300 font-bold">70+ data points</span> including player roles, batting positions, and bowling variety to calculate your squad's competitive edge.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                <div className="text-[10px] font-black uppercase text-zinc-600 mb-1">Target</div>
                <div className="text-sm font-display font-bold text-zinc-300">11 Players</div>
              </div>
              <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                <div className="text-[10px] font-black uppercase text-zinc-600 mb-1">Roles</div>
                <div className="text-sm font-display font-bold text-zinc-300">Balanced</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

