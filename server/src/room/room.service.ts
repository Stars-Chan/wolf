import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room } from './room.schema';

@Injectable()
export class RoomService {
  constructor(@InjectModel('Room') private readonly roomModel: Model<Room>) {}

  async createRoom(roomId: string): Promise<Room> {
    const room = new this.roomModel({
      roomId,
      players: Array.from({ length: 12 }, (_, i) => ({
        seatId: i + 1,
        isJoined: false,
      })),
    });
    return room.save();
  }

  async joinRoom(roomId: string, seatId: number): Promise<Room | null> {
    return this.roomModel.findOneAndUpdate(
      { roomId, 'players.seatId': seatId },
      { $set: { 'players.$.isJoined': true } },
      { new: true },
    );
  }

  async getRoom(roomId: string): Promise<Room | null> {
    return this.roomModel.findOne({ roomId });
  }

  async startGame(roomId: string): Promise<Room> {
    const room = await this.roomModel.findOne({ roomId });
    if (!room) {
      throw new Error('Room not found');
    }
    const roles = this.generateRoles();
    room.players.forEach((player, index) => {
      player.role = roles[index];
    });
    return room.save();
  }

  private generateRoles(): string[] {
    const roles = [
      ...Array(4).fill('villager'),
      ...Array(4).fill('werewolf'),
      'seer',
      'witch',
      'guard',
      'hunter',
    ];
    return this.shuffleArray(roles);
  }

  private shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
