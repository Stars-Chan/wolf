import { Schema, Document } from 'mongoose';

export interface Room extends Document {
  roomId: string;
  round: number;
  players: {
    seatId: number;
    isJoined: boolean;
    role?: string;
  }[];
}

export const RoomSchema = new Schema<Room>({
  roomId: { type: String, required: true, unique: true },
  round: { type: Number, default: 1 },
  players: [
    {
      seatId: { type: Number, required: true },
      isJoined: { type: Boolean, default: false },
      role: { type: String },
    },
  ],
});
