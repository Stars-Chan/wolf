import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  IRoom,
  NightStepDescriptions,
  NightStepTips,
  RoleEnum,
  SkillEnum,
} from "./interface";
import { playerService, roomService } from "../api";
import _ from "lodash";
import Room from "./components/Room";
import { createRolesRecord, getGameRoles } from "./utils";

const Waiting: React.FC = () => {
  const [room, setRoom] = useState<IRoom>();
  const [roomId, setRoomId] = useState("");
  const [mySeatId, setMySeatId] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const roomId = new URLSearchParams(location.search).get("roomId");
        const seatId = new URLSearchParams(location.search).get("seatId");
        if (!roomId || !seatId) return;
        const roomInfo: IRoom = await roomService.getRoom(roomId);

        setRoomId(roomId);
        setMySeatId(seatId);
        setRoom(roomInfo);
      } catch (error) {
        console.error("获取房间信息出错:", error);
        alert("获取房间信息失败");
      }
    };

    fetchRoom();
    //自动轮询
    const intervalId = setInterval(fetchRoom, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const startGame = async () => {
    const roles = getGameRoles(room?.playerIds.length || 0);
    if (!roles.length) return;
    const roleMakeup = createRolesRecord(roles);
    const createPlayers =
      room?.playerIds.map((play) => {
        const [roomId, seatId] = play.split("-");
        const skills: string[] = [];
        const role = roles.shift();
        if (!role) return;
        if (role === RoleEnum.witch) {
          skills.push(SkillEnum.help);
          skills.push(SkillEnum.poison);
        } else if (role === RoleEnum.hunter || role === RoleEnum.wolfKing) {
          skills.push(SkillEnum.kill);
        }
        return playerService.createPlayer(roomId, seatId, role, skills);
      }) || [];
    try {
      await Promise.all(createPlayers);
      await roomService.updateRoom(roomId, {
        steps: NightStepDescriptions,
        start: true,
        currentDay: 1,
        step: 1,
        records: [
          `【提示】游戏由${roleMakeup}，共${room?.playerIds.length}名玩家组成`,
          "【提示】玩家的指引信息（如：狼人请行动...）变为绿色时，表明当前投票会生效",
          NightStepTips[0],
        ],
      });
      navigate(`/night?roomId=${roomId}&seatId=${mySeatId}`);
    } catch (error) {
      console.error("开始游戏出错:", error);
      alert("开始游戏失败");
    }
  };

  const handleContinue = async () => {
    if (mySeatId !== "1") {
      navigate(`/night?roomId=${roomId}&seatId=${mySeatId}`);
      return;
    }
    // 需要1号玩家先开始游戏更新房间信息
    await startGame();
  };

  if (!room) return;
  return (
    <div>
      <Room room={room} mySeatId={mySeatId} handleContinue={handleContinue} />
    </div>
  );
};

export default Waiting;
