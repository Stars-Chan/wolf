import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DeityRoles,
  IPlayer,
  IRoom,
  NightStepDescriptions,
  RoleEnum,
  SkillEnum,
  WolfRoles,
} from "./interface";
import _ from "lodash";
import {
  calculateMaxVoted,
  calculateNightInfo,
  createVotedRecord,
} from "./utils";
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
  // 刷新
  const [refresh, setRefresh] = useState(false);
  // 出局弹窗
  const [killId, setKillId] = useState("");
  const [toSheriffId, setToSheriffId] = useState("");
  const [showOut, setShowOut] = useState(false);
  const [outSkills, setOutSkills] = useState<string[]>([]);

  // 游戏结束
  const [wolfWin, setWolfWin] = useState(false);
  const [goodWin, setGoodWin] = useState(false);

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
        // 更新房间信息、玩家信息
        const finishOneStep =
          newPlayers &&
          newPlayers.every((player) => player.step === roomInfo.step);
        if (finishOneStep) {
          // 判断游戏是否结束
          const wolfPlayers = newPlayers.filter((player) =>
            WolfRoles.includes(player.role)
          );
          const deityPlayers = newPlayers.filter((player) =>
            DeityRoles.includes(player.role)
          );
          const villagerPlayers = newPlayers.filter(
            (player) => player.role === RoleEnum.villager
          );
          if (!deityPlayers.length || !villagerPlayers.length) {
            // 狼人获胜
            setWolfWin(true);
          }
          if (!wolfPlayers.length) {
            // 好人获胜
            setGoodWin(true);
          }
        }
        // 申请竞选警长
        if (finishOneStep && roomInfo.step === 2) {
          const candidates = newPlayers
            .filter((player) => player.candidate)
            .map((player) => Number(player.seatId))
            .sort((a, b) => a - b);
          await roomService.updateRoomRecords(roomId!, [
            `【竞选警长】${candidates.join("、")}号玩家申请竞选警长`,
          ]);
        }
        // 投票竞选警长、公布黑夜情况
        if (finishOneStep && roomInfo.step === 3) {
          const records: string[] = [];
          const sheriffId = calculateMaxVoted(newPlayers, "daytimeVoted");
          if (sheriffId && sheriffId !== "-1") {
            // 投票情况记录
            const votedRecord = createVotedRecord(newPlayers);
            records.push(`【竞选警长】${votedRecord}`);
            const sheriffPlayer = newPlayers.find(
              (player) => player.seatId === sheriffId
            );
            const { skills = [] } = sheriffPlayer!;
            await playerService.updatePlayer(`${roomId}-${sheriffId}`, {
              isSheriff: true,
              skills: [...skills, SkillEnum.sheriff],
            });
            records.push(`【竞选警长】${sheriffId}号玩家当选警长`);
          }
          const hasNightVoted = newPlayers.find((player) => player.nightVoted);
          if (hasNightVoted) {
            const { helpId, poisonId, knifedId, guardId } = calculateNightInfo(
              newPlayers!
            );

            const poisonedPlayer = newPlayers.find(
              (player) => player.seatId === poisonId
            );
            const knifedPlayer = newPlayers.find((player) => {
              const { seatId } = player;
              // 同守同救
              const helpAndGuard = [knifedId, helpId, guardId].every(
                (id) => id === seatId
              );
              // 未被救,也没被守
              const notHelpNotGuard =
                seatId === knifedId && ![helpId, guardId].includes(seatId);
              return helpAndGuard || notHelpNotGuard;
            });
            const witchPlayer = newPlayers.find(
              (player) => player.role === RoleEnum.witch
            );
            const notAliveIds: string[] = [];
            if (poisonedPlayer) {
              notAliveIds.push(poisonedPlayer.seatId);
              const { skills = [] } = poisonedPlayer;
              const newSkills: string[] = [];
              if (skills.includes(SkillEnum.sheriff)) {
                newSkills.push(SkillEnum.sheriff);
              }
              await playerService.updatePlayer(poisonedPlayer.playerId, {
                isAlive: false,
                skills: newSkills,
              });
            }
            if (knifedPlayer) {
              notAliveIds.push(knifedPlayer.seatId);
              await playerService.updatePlayer(knifedPlayer.playerId, {
                isAlive: false,
              });
            }
            if (witchPlayer?.skills.length) {
              const { skills } = witchPlayer;
              const playerAttribute: Partial<IPlayer> = {};
              if (helpId && helpId !== "-1") {
                playerAttribute.skills = skills.filter(
                  (skill) => skill !== SkillEnum.help
                );
              } else if (poisonId && poisonId !== "-1") {
                playerAttribute.skills = skills.filter(
                  (skill) => skill !== SkillEnum.poison
                );
              }
              await playerService.updatePlayer(
                witchPlayer.playerId,
                playerAttribute
              );
            }
            if (notAliveIds.length) {
              records.push(
                `【第${Math.ceil(
                  (roomInfo?.currentDay || 0) / 2
                )}天】昨晚${notAliveIds
                  .sort((a, b) => Number(a) - Number(b))
                  .join("、")}号玩家倒牌`
              );
            } else {
              records.push(
                `【第${Math.ceil(
                  (roomInfo?.currentDay || 0) / 2
                )}天】昨晚是平安夜`
              );
            }
            await roomService.updateRoomRecords(roomId!, records);

            // 重置
            for (const player of newPlayers) {
              await playerService.updatePlayer(player.playerId, {
                candidate: false,
                isSheriff: false,
                nightVoted: "",
                daytimeVoted: "",
              });
            }
          }
        }
        // 放逐投票
        if (finishOneStep && roomInfo.step === 4) {
          const hasDaytimeVoted = newPlayers.find(
            (player) => player.daytimeVoted
          );
          if (hasDaytimeVoted) {
            const votedRecord = createVotedRecord(newPlayers);
            const exileId = calculateMaxVoted(newPlayers, "daytimeVoted");
            if (exileId && exileId !== "-1") {
              await playerService.updatePlayer(`${roomId}-${exileId}`, {
                isAlive: false,
                daytimeVoted: "",
              });
              await roomService.updateRoomRecords(roomId!, [
                `【第${Math.ceil(
                  (roomInfo?.currentDay || 0) / 2
                )}天】${votedRecord}`,
                `【第${Math.ceil(
                  (roomInfo?.currentDay || 0) / 2
                )}天】${exileId}号玩家被放逐`,
              ]);
              // 重置
              for (const player of newPlayers) {
                await playerService.updatePlayer(player.playerId, {
                  daytimeVoted: "",
                });
              }
            }
          }
        }

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
    onRefresh();
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
    onRefresh();
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
      role: "",
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
        role: "",
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
  };

  const onClickSheriffId = async () => {
    const alivePlayers = players?.map((player) => player.seatId);
    if (!alivePlayers?.includes(toSheriffId))
      return alert("请输入未出局的玩家号");
    const toSheriffPlayer = players?.find(
      (player) => player.seatId === toSheriffId
    );
    const { skills = [] } = toSheriffPlayer!;
    await playerService.updatePlayer(`${roomId}-${mySeatId}`, {
      isSheriff: false,
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
