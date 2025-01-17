import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { roomService } from "../api";

const Login: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [seatId, setSeatId] = useState("");
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    if (!roomId) return;

    try {
      await roomService.createRoom(roomId);
      await roomService.updateRoomRecords(roomId, [
        "【提示】玩家数量必须在9～14之间 ",
        "【提示】由1号玩家先点击开始游戏",
      ]);
      await roomService.joinRoom(roomId, "1");
      navigate(`/waiting?roomId=${roomId}&seatId=1`);
    } catch (error) {
      console.error("创建房间出错:", error);
      alert("创建房间失败，请重试");
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId || !seatId) return;
    const seatNumber = Number(seatId);
    if (!Number.isInteger(seatNumber) || seatNumber < 1 || seatNumber > 14) {
      alert("座位号只能是1-14号");
      return;
    }
    try {
      const { playerIds = [] } = await roomService.getRoom(roomId); // 检查房间是否存在
      const playerSeatIds = playerIds.map((playerId) => {
        const seatId = playerId.split("-")[1];
        return seatId;
      });
      if (!playerSeatIds.includes(seatId)) {
        await roomService.joinRoom(roomId, seatId);
      }
      navigate(`/waiting?roomId=${roomId}&seatId=${seatId}`);
    } catch (error) {
      console.error("加入房间出错:", error);
      alert("加入房间失败，请重试");
    }
  };

  return (
    <div className="login-container">
      <h1>自助狼人杀</h1>

      <div className="button-group">
        <button onClick={() => setShowCreateModal(true)}>创建房间</button>
        <button onClick={() => setShowJoinModal(true)}>加入房间</button>
      </div>

      {showCreateModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>创建房间</h2>
            <div className="input-group">
              <label>房间号:</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />
            </div>
            <div className="modal-buttons">
              <button onClick={handleCreateRoom}>确定</button>
              <button onClick={() => setShowCreateModal(false)}>取消</button>
            </div>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>加入房间</h2>
            <div className="input-group">
              <label>房间号:</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>座位号:</label>
              <input
                type="number"
                min="1"
                max="14"
                value={seatId}
                onChange={(e) => setSeatId(e.target.value)}
              />
            </div>
            <div className="modal-buttons">
              <button onClick={handleJoinRoom}>确定</button>
              <button onClick={() => setShowJoinModal(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
