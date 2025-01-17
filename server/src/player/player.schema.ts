import { Schema, Document } from 'mongoose';

export interface Player extends Document {
  playerId: string;
  roomId: string;
  seatId: string;
  voting: string;
  nightVoted: string;
  daytimeVoted: string;
  voted: string[];
  isAlive: boolean;
  candidate: boolean;
  isSheriff: boolean;
  role: string;
  skills: string[];
  step: number;
  currentDay: number;
}

export const PlayerSchema = new Schema<Player>({
  playerId: { type: String, required: true },
  roomId: { type: String, required: true },
  seatId: { type: String, required: true },
  voting: { type: String, default: '' },
  nightVoted: { type: String, default: '' },
  daytimeVoted: { type: String, default: '' },
  voted: { type: [String], default: [] },
  isAlive: { type: Boolean, default: true },
  candidate: { type: Boolean, default: false },
  isSheriff: { type: Boolean, default: false },
  role: { type: String, default: '' },
  skills: { type: [String], default: [] },
  step: { type: Number, default: 1 },
  currentDay: { type: Number, default: 1 },
});
