import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room } from './room.schema';

@Injectable()
export class RoomService {
  constructor(@InjectModel('Room') private readonly roomModel: Model<Room>) {}

  async createRoom(roomId: string): Promise<Room> {
    // 检查 roomId 是否已经存在
    const existingRoom = await this.roomModel.findOne({ roomId });
    if (existingRoom) {
      throw new Error('Room ID already exists');
    }
    const room = new this.roomModel({
      roomId,
    });
    return room.save();
  }

  async joinRoom(roomId: string, seatId: string): Promise<Room> {
    // 构造玩家 ID
    const playerId = `${roomId}-${seatId}`;

    // 查找并更新房间
    const updatedRoom = await this.roomModel
      .findOneAndUpdate(
        { roomId, start: false }, // 查询条件
        { $addToSet: { playerIds: playerId } }, // 使用 $addToSet 添加玩家 ID（避免重复）
        { new: true }, // 返回更新后的文档
      )
      .exec();

    // 检查是否更新成功
    if (!updatedRoom) {
      throw new Error('Room not found, already started, or update failed');
    }

    return updatedRoom;
  }

  async updateRoomRecords(roomId: string, records: string[]): Promise<Room> {
    // 查找并更新房间
    const updatedRoom = await this.roomModel
      .findOneAndUpdate(
        { roomId }, // 查询条件
        { $addToSet: { records: { $each: records || [] } } }, // 使用 $addToSet 和 $each 添加多个 records（避免重复）
        { new: true }, // 返回更新后的文档
      )
      .exec();

    // 检查是否更新成功
    if (!updatedRoom) {
      throw new Error('Room not found, already started, or update failed');
    }

    return updatedRoom;
  }

  async updateRoom(
    roomId: string,
    roomAttribute: Partial<Room>,
  ): Promise<Room> {
    const updatedRoom = await this.roomModel
      .findOneAndUpdate({ roomId }, roomAttribute, { new: true })
      .exec();

    if (!updatedRoom) {
      throw new Error('Room not found or update failed');
    }

    return updatedRoom;
  }

  async getRoom(roomId: string): Promise<Room | null> {
    return this.roomModel.findOne({ roomId }).sort({ step: -1 });
  }
}
