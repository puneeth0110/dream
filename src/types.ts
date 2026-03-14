export enum PlayerRole {
  BATTER = 'Batter',
  BOWLER = 'Bowler',
  ALL_ROUNDER = 'All-Rounder',
  WICKETKEEPER = 'Wicketkeeper'
}

export type BattingPosition = 'Top Order' | 'Middle Order' | 'Finisher';
export type BowlingType = 'Fast' | 'Spin' | 'None';

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  rating: number; // Individual player skill rating (1-10)
  points: number; // Budget points (6-10)
  battingPosition?: BattingPosition;
  bowlingType?: BowlingType;
  isDeathBowler?: boolean;
  image?: string;
}

export interface TeamRating {
  overall: number;
  batting: number;
  bowling: number;
  allRounder: number;
  balance: number;
  suggestions: string[];
}

export interface Room {
  id: string;
  code: string;
  status: 'waiting' | 'active' | 'finished';
  createdAt: any;
  hostId: string;
}

export interface RoomPlayer {
  id: string;
  username: string;
  isReady: boolean;
  squad?: Player[];
  totalPoints?: number;
  score?: number;
}
