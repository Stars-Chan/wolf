import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PlayerService } from './player.service';
import { Player } from './player.schema';

@Controller('players')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Post()
  async createPlayer(
    @Body('roomId') roomId: string,
    @Body('seatId') seatId: string,
    @Body('role') role: string,
    @Body('skills') skills: string[],
  ) {
    return await this.playerService.createPlayer(roomId, seatId, role, skills);
  }

  @Post(':playerId')
  async updatePlayer(
    @Param('playerId') playerId: string,
    @Body('playerAttribute') playerAttribute: Partial<Player>,
  ) {
    return await this.playerService.updatePlayer(playerId, playerAttribute);
  }

  @Get('')
  async getPlayer(@Query('playerIds') playerIds: string) {
    return await this.playerService.getPlayer(playerIds);
  }
}
