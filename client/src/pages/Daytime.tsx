import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IPlayer, IRoom, NightStepDescriptions, SkillEnum } from "./interface";
import _ from "lodash";
import { handleDaytimeStep, judgeGameOver } from "./utils";
import { playerService, roomService } from "../api";
import Room from "./components/Room";
import styles from "./Daytime.module.css";

const Daytime: React.FC = () => {
  // 房间信息
  const [roomId, setRoomId] = useState("");
  const [room, setRoom] = useState<IRoom>();
  // 玩家信息
  const [players, setPlayers] = useState<IPlayer[]>();
  const [mySeatId, setMySeatId] = useState("");
  const [myPlayer, setMyPlayer] = useState<IPlayer>();
  const [myVote, setMyVote] = useState("");
  // 出局弹窗
  const [killId, setKillId] = useState("");
  const [toSheriffId, setToSheriffId] = useState("");
  const [showOut, setShowOut] = useState(false);
  const [outSkills, setOutSkills] = useState<string[]>([]);

  // 游戏结束
  const [wolfWin, setWolfWin] = useState(false);
  const [goodWin, setGoodWin] = useState(false);

  // 刷新
  const [refresh, setRefresh] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleInit = async () => {
      const roomId = new URLSearchParams(location.search).get("roomId");
      roomId && (await handleDaytimeStep(roomId));
    };
    handleInit();
  }, []);

  useEffect(() => {
    const fetchGameData = async () => {
      const roomId = new URLSearchParams(location.search).get("roomId");
      const seatId = new URLSearchParams(location.search).get("seatId");
      try {
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
        if (!myPlayer) {
          setShowOut(true);
        }
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
    //自动轮询
    const intervalId = setInterval(fetchGameData, 3000);
    return () => clearInterval(intervalId);
  }, [refresh]);

  useEffect(() => {
    const roomId = new URLSearchParams(location.search).get("roomId");
    const seatId = new URLSearchParams(location.search).get("seatId");
    if (!roomId || !seatId) return;
    const checkSkills = async () => {
      const [outPlayer] = await playerService.getPlayers(`${roomId}-${seatId}`);
      const { skills = [] } = outPlayer;
      if (skills.length) {
        setOutSkills(skills);
      }
    };
    checkSkills();
  }, [showOut]);

  // 投票
  const handleMyVote = async (id: string) => {
    const { playerId = "" } = myPlayer || {};
    await playerService.updatePlayer(playerId, {
      voting: id,
    });
    setMyVote(id);
    setRefresh(!refresh);
  };

  // 继续
  const handleContinue = async () => {
    if (!myPlayer) return;
    const { step, voting, playerId, candidate } = myPlayer;
    const playerAttribute: Partial<IPlayer> = {
      voting: "",
      step: step + 1,
    };
    switch (step) {
      case 1:
        if (mySeatId === voting) {
          playerAttribute.candidate = true;
        }
        break;
      case 2:
        const candidates = players
          ?.filter((player) => player.candidate)
          .map((player) => player.seatId);
        if (!candidate && candidates?.includes(voting)) {
          playerAttribute.daytimeVoted = voting;
        }
        break;
      case 3:
        playerAttribute.daytimeVoted = voting;
        break;
    }

    await playerService.updatePlayer(playerId, playerAttribute);
    await roomService.updateRoom(roomId, {
      step: step + 1,
    });
    setRefresh(!refresh);
    await handleDaytimeStep(roomId);
  };

  // 下一天
  const handleNextDay = async () => {
    if (!myPlayer) return;
    const { currentDay } = myPlayer;
    const nextCurrentDay = currentDay + 1;
    const playerAttribute: Partial<IPlayer> = {
      currentDay: nextCurrentDay,
      step: 1,
    };
    await playerService.updatePlayer(myPlayer?.playerId || "", playerAttribute);
    await roomService.updateRoom(roomId, {
      steps: NightStepDescriptions,
      currentDay: nextCurrentDay,
      step: 1,
    });
    navigate(`/night?roomId=${roomId}&seatId=${mySeatId}`);
  };

  // 弃票
  const handleNotVote = async () => {
    const { playerId = "" } = myPlayer || {};
    await playerService.updatePlayer(playerId, {
      voting: "-1",
    });
    setMyVote("-1");
    setRefresh(!refresh);
  };

  const onClickOut = async () => {
    const [outPlayer] = await playerService.getPlayers(`${roomId}-${mySeatId}`);
    const { skills = [] } = outPlayer;
    // 撕毁警徽
    if (skills.includes(SkillEnum.sheriff)) {
      await roomService.updateRoomRecords(roomId, [
        `【第${Math.ceil(
          (room?.currentDay || 0) / 2
        )}天】${mySeatId}号玩家撕毁警徽`,
      ]);
    }
    await playerService.updatePlayer(`${roomId}-${mySeatId}`, {
      currentDay: 0,
      step: 0,
      skills: [],
      isSheriff: false,
    });
    setShowOut(false);
    navigate(`/waiting?roomId=${roomId}&seatId=${mySeatId}`);
  };

  const onClickGameOver = async () => {
    if (!players) return;
    for (const player of players) {
      await playerService.updatePlayer(player.playerId, {
        currentDay: 0,
        step: 0,
        skills: [],
        isSheriff: false,
        isAlive: false,
      });
      await roomService.updateRoom(roomId, {
        currentDay: 0,
        step: 0,
        start: false,
      });
    }
    setWolfWin(false);
    setGoodWin(false);
    navigate(`/waiting?roomId=${roomId}&seatId=${mySeatId}`);
  };

  const onClickKill = async () => {
    const alivePlayers = players?.map((player) => player.seatId);
    if (!alivePlayers?.includes(killId)) return alert("请输入未出局的玩家号");
    // 猎人或狼王开枪
    await playerService.updatePlayer(`${roomId}-${killId}`, {
      isAlive: false,
    });
    await roomService.updateRoomRecords(roomId, [
      `【第${Math.ceil(
        (room?.currentDay || 0) / 2
      )}天】${mySeatId}号发动技能带走${killId}号玩家`,
    ]);
    const newOutSkills = outSkills.filter((skill) => skill !== SkillEnum.kill);
    setOutSkills(newOutSkills);
  };

  const onClickSheriffId = async () => {
    const alivePlayers = players?.map((player) => player.seatId);
    if (!alivePlayers?.includes(toSheriffId))
      return alert("请输入未出局的玩家号");
    const toSheriffPlayer = players?.find(
      (player) => player.seatId === toSheriffId
    );
    const { skills = [] } = toSheriffPlayer!;
    const newOutSkills = outSkills.filter(
      (skill) => skill !== SkillEnum.sheriff
    );
    await playerService.updatePlayer(`${roomId}-${mySeatId}`, {
      isSheriff: false,
      skills: newOutSkills,
    });
    await playerService.updatePlayer(`${roomId}-${toSheriffId}`, {
      isSheriff: true,
      skills: [...skills, SkillEnum.sheriff],
    });
    await roomService.updateRoomRecords(roomId, [
      `【第${Math.ceil(
        (room?.currentDay || 0) / 2
      )}天】${mySeatId}号将警徽交给${toSheriffId}号玩家`,
    ]);

    setOutSkills(newOutSkills);
  };

  if (!room || !players) return;

  // 判断游戏是否结束
  if (!goodWin && !wolfWin) {
    const { wolfVictory, goodVictory } = judgeGameOver(players) || {};
    wolfVictory && setWolfWin(true);
    goodVictory && setGoodWin(true);
  }

  return (
    <div>
      <Room
        room={room}
        players={players}
        mySeatId={mySeatId}
        selectId={myVote}
        handleMyVote={(id) => handleMyVote(id)}
        handleContinue={handleContinue}
        handleNextDay={handleNextDay}
        handleNotVote={handleNotVote}
      />
      {showOut && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            {Boolean(outSkills.includes(SkillEnum.sheriff)) && (
              <div className={styles.modalSkill}>
                输入玩家号：
                <input
                  type="text"
                  className={styles.inputSkill}
                  value={toSheriffId}
                  placeholder="转移警徽"
                  onChange={(e) => setToSheriffId(e.target.value)}
                />
                <button
                  onClick={onClickSheriffId}
                  className={styles.skillButton}
                >
                  发动技能
                </button>
              </div>
            )}
            {Boolean(outSkills.includes(SkillEnum.kill)) && (
              <div className={styles.modalSkill}>
                输入玩家号：
                <input
                  type="text"
                  className={styles.inputSkill}
                  value={killId}
                  placeholder="开枪"
                  onChange={(e) => setKillId(e.target.value)}
                />
                <button onClick={onClickKill} className={styles.skillButton}>
                  发动技能
                </button>
              </div>
            )}
            <div className={styles.modalConfirm}>
              你已出局，点击
              <button onClick={onClickOut} className={styles.confirmButton}>
                确定
              </button>
              离开房间
            </div>
          </div>
        </div>
      )}
      {(wolfWin || goodWin) && (
        <div className={styles.modal}>
          <div className={styles.modalGameOver}>
            <div className={styles.modalConfirm}>
              <h1>{wolfWin ? "狼人获胜" : "好人获胜"}</h1>
              <button
                onClick={onClickGameOver}
                className={styles.confirmButton}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Daytime;
