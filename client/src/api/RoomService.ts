import { IRoom } from "../pages/interface";

export class RoomService {
  async createRoom(roomId: string) {
    const response = await fetch(`http://39.108.230.68:3000/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomId,
      }),
    });

    if (!response.ok) {
      throw new Error("创建房间失败");
    }
    return await response.json();
  }

  async joinRoom(roomId: string, seatId: string) {
    const response = await fetch(
      `http://39.108.230.68:3000/rooms/${roomId}/join`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seatId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("加入房间失败");
    }
    return await response.json();
  }

  async updateRoomRecords(roomId: string, records: string[]) {
    const response = await fetch(
      `http://39.108.230.68:3000/rooms/${roomId}/record`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("加入房间失败");
    }
    return await response.json();
  }

  async updateRoom(
    roomId: string,
    roomAttribute: Partial<IRoom>
  ): Promise<IRoom[]> {
    const response = await fetch(`http://39.108.230.68:3000/rooms/${roomId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomAttribute,
      }),
    });

    if (!response.ok) {
      throw new Error("更新房间信息成功");
    }
    return await response.json();
  }

  async getRoom(roomId: string): Promise<IRoom> {
    const response = await fetch(`http://39.108.230.68:3000/rooms/${roomId}`);

    if (!response.ok) {
      throw new Error("获取房间信息失败");
    }
    return await response.json();
  }
}
