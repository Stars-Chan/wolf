import { IPlayer } from "../pages/interface";

export class PlayerService {
  async createPlayer(
    roomId: string,
    seatId: string,
    role: string,
    skills: string[]
  ) {
    const response = await fetch(`http://39.108.230.68:3000/players`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomId,
        seatId,
        role,
        skills,
      }),
    });
    if (!response.ok) {
      throw new Error("创建玩家失败");
    }
    return await response.json();
  }

  async updatePlayer(
    playerId: string,
    playerAttribute: Partial<IPlayer>
  ): Promise<IPlayer[]> {
    const response = await fetch(
      `http://39.108.230.68:3000/players/${playerId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerAttribute,
        }),
      }
    );
    if (!response.ok) {
      throw new Error("更新玩家信息失败");
    }
    return await response.json();
  }

  async getPlayers(playerIds: string): Promise<IPlayer[]> {
    const response = await fetch(
      `http://39.108.230.68:3000/players?playerIds=${playerIds}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error("查询玩家信息失败");
    }
    return await response.json();
  }
}
