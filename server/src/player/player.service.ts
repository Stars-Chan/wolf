import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player } from './player.schema';

@Injectable()
export class PlayerService {
  constructor(
    @InjectModel('Player') private readonly playerModel: Model<Player>,
  ) {}

  async createPlayer(
    roomId: string,
    seatId: string,
    role: string,
    skills: string[],
  ): Promise<Player> {
    const playerId = `${roomId}-${seatId}`;

    // 查找玩家，如果不存在则创建
    const player = await this.playerModel.findOneAndUpdate(
      { playerId }, // 查询条件
      { roomId, seatId, role, skills, isAlive: true, currentDay: 1, step: 1 }, // 更新内容
      {
        upsert: true, // 如果不存在则创建
        new: true, // 返回更新后的文档
      },
    );

    return player;
  }

  async updatePlayer(
    playerId: string,
    playerAttribute: Partial<Player>,
  ): Promise<Player> {
    const updatedPlayer = await this.playerModel
      .findOneAndUpdate(
        {
          playerId,
        },
        playerAttribute,
        {
          new: true, // return the updated document
        },
      )
      .exec();
    if (!updatedPlayer) {
      throw new Error('Player not found'); // 如果未找到文档，抛出错误
    }

    return updatedPlayer;
  }

  async getPlayer(playerIds: string): Promise<Player[]> {
    const playerIdArray = playerIds.split(',');
    const players = await this.playerModel.find({
      playerId: { $in: playerIdArray },
    });
    if (players.length === 0) {
      throw new Error('No players found');
    }
    return players;
  }
}
