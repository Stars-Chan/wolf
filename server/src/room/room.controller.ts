import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RoomService } from './room.service';
import { Room } from './room.schema';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  async createRoom(@Body('roomId') roomId: string) {
    return this.roomService.createRoom(roomId);
  }

  @Post(':roomId/join')
  async joinRoom(
    @Param('roomId') roomId: string,
    @Body('seatId') seatId: string,
  ) {
    const room = await this.roomService.joinRoom(roomId, seatId);
    if (!room) {
      throw new Error('Room or seat not found');
    }
    return room;
  }

  @Post(':roomId/record')
  async updateRoomRecords(
    @Param('roomId') roomId: string,
    @Body('records') records: string[],
  ) {
    const room = await this.roomService.updateRoomRecords(roomId, records);
    if (!room) {
      throw new Error('Room not found');
    }
    return room;
  }

  @Post(':roomId')
  async updateRoom(
    @Param('roomId') roomId: string,
    @Body('roomAttribute') roomAttribute: Partial<Room>,
  ) {
    const room = await this.roomService.updateRoom(roomId, roomAttribute);
    if (!room) {
      throw new Error('Room or seat not found');
    }
    return room;
  }

  @Get(':roomId')
  async getRoom(@Param('roomId') roomId: string) {
    const room = await this.roomService.getRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    return room;
  }
}
