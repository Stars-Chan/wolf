import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DaytimeStepDescriptions,
  IPlayer,
  IRoom,
  RoleEnum,
  WolfRoles,
} from "./interface";
import _ from "lodash";
import { playerService, roomService } from "../api";
import Room from "./components/Room";

const Night: React.FC = () => {
  // 房间信息
  const [roomId, setRoomId] = useState("");
  const [room, setRoom] = useState<IRoom>();
  // 玩家信息
  const [players, setPlayers] = useState<IPlayer[]>();
  const [mySeatId, setMySeatId] = useState("");
  const [myPlayer, setMyPlayer] = useState<IPlayer>();
  const [myVote, setMyVote] = useState("");
  // 刷新
  const [refresh, setRefresh] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const roomId = new URLSearchParams(location.search).get("roomId");
        const seatId = new URLSearchParams(location.search).get("seatId");
        if (!roomId || !seatId) return;
        // 获取房间信息、所有玩家信息
        const roomInfo = await roomService.getRoom(roomId);
        const allPlayers = await playerService.getPlayers(
          roomInfo.playerIds.join(",")
        );
        const newPlayers = allPlayers.filter((player) => player.isAlive);

        setRoomId(roomId);
        setRoom(roomInfo);

        // 获取当前玩家信息
        const myPlayer = newPlayers.find(
          (player) => player.playerId === `${roomId}-${seatId}`
        );
        setPlayers(newPlayers);
        setMySeatId(seatId);
        setMyPlayer(myPlayer);
        setMyVote(myPlayer?.voting || "");
      } catch (error) {
        console.error("获取游戏信息出错:", error);
        alert("获取游戏信息失败");
      }
    };

    fetchGameData();
  }, [refresh]);

  // 投票
  const handleMyVote = async (id: string) => {
    const { playerId = "" } = myPlayer || {};
    await playerService.updatePlayer(playerId, {
      voting: id,
    });
    setMyVote(id);
    onRefresh();
  };

  // 继续
  const handleContinue = async () => {
    if (!myPlayer) return;
    const { role, step, playerId } = myPlayer;
    const wolfMove = step === 1 && WolfRoles.includes(role);
    const witchMove = step === 2 && role === RoleEnum.witch;
    const seerMove = step === 3 && role === RoleEnum.seer;
    const guardMove = step === 4 && role === RoleEnum.guard;
    if (wolfMove || witchMove || seerMove || guardMove) {
      await playerService.updatePlayer(playerId, {
        nightVoted: myVote,
      });
    }
    await playerService.updatePlayer(playerId, {
      voting: "",
      step: step + 1,
    });
    await roomService.updateRoom(roomId, {
      step: step + 1,
    });
    onRefresh();
  };

  // 刷新
  const onRefresh = () => {
    setRefresh(!refresh);
  };

  // 下一天
  const handleNextDay = async () => {
    if (!myPlayer) return;
    const { currentDay } = myPlayer;
    const nextCurrentDay = currentDay + 1;
    const nextStep = currentDay === 1 ? 1 : 3; // 只有第一天白天有警长竞选
    const playerAttribute: Partial<IPlayer> = {
      currentDay: nextCurrentDay,
      step: nextStep,
    };
    await playerService.updatePlayer(myPlayer?.playerId || "", playerAttribute);
    await roomService.updateRoom(roomId, {
      steps: DaytimeStepDescriptions,
      currentDay: nextCurrentDay,
      step: nextStep,
    });
    navigate(`/daytime?roomId=${roomId}&seatId=${mySeatId}`);
  };

  // 弃票
  const handleNotVote = async () => {
    const { playerId = "" } = myPlayer || {};
    await playerService.updatePlayer(playerId, {
      voting: "-1",
    });
    setMyVote("-1");
    onRefresh();
  };

  if (!room) return;

  return (
    <div>
      <Room
        room={room}
        players={players}
        mySeatId={mySeatId}
        selectId={myVote}
        onRefresh={onRefresh}
        handleMyVote={(id) => handleMyVote(id)}
        handleContinue={handleContinue}
        handleNextDay={handleNextDay}
        handleNotVote={handleNotVote}
      />
    </div>
  );
};

export default Night;
