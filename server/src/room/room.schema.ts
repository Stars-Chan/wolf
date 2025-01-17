import { Schema, Document } from 'mongoose';

export interface Room extends Document {
  roomId: string;
  start: boolean;
  step: number;
  currentDay: number;
  playerIds: string[];
  records: string[];
  steps: string[];
}

export const RoomSchema = new Schema<Room>({
  roomId: { type: String, required: true, unique: true },
  start: { type: Boolean, default: false },
  step: { type: Number, default: 0 },
  currentDay: { type: Number, default: 0 },
  playerIds: { type: [String], default: [] },
  records: { type: [String], default: [] },
  steps: { type: [String], default: [] },
});
