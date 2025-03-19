import _ from "lodash";
import {
  DeityRoles,
  IPlayer,
  RoleEnum,
  SkillEnum,
  WolfRoles,
} from "../interface";
import { playerService, roomService } from "../../api";

export const getChineseRole = (role: string = "") => {
  switch (role) {
    case "villager":
      return "村民";
    case "werewolf":
      return "狼人";
    case "wolfKing":
      return "狼王";
    case "seer":
      return "预言家";
    case "witch":
      return "女巫";
    case "guard":
      return "守卫";
    case "hunter":
      return "猎人";
    default:
      return "未知";
  }
};

// 根据人数返回角色列表,count必须在9-14之间
export const getGameRoles = (count: number): string[] => {
  let roles = [];
  switch (count) {
    case 9:
      roles = _.shuffle([
        ...Array(3).fill("villager"),
        ...Array(3).fill("werewolf"),
        "seer",
        "witch",
        "guard",
      ]);
      break;
    case 10:
    case 11:
      roles = _.shuffle([
        ...Array(count - 6).fill("villager"),
        ...Array(2).fill("werewolf"),
        "wolfKing",
        "seer",
        "witch",
        "guard",
      ]);
      break;
    case 12:
    case 13:
    case 14:
      roles = _.shuffle([
        ...Array(count - 8).fill("villager"),
        ...Array(3).fill("werewolf"),
        "wolfKing",
        "seer",
        "witch",
        "guard",
        "hunter",
      ]);
      break;
  }
  return roles;
};

// 生成角色记录
export const createRolesRecord = (roles: string[]) => {
  const roleCount: Record<string, number> = {};
  roles.forEach((role) => {
    roleCount[role] = (roleCount[role] || 0) + 1;
  });

  return Object.entries(roleCount)
    .map(([role, count]) => `${count}名${getChineseRole(role)}`)
    .join("，");
};

export const calculateMaxVoted = (
  playerList: IPlayer[] = [],
  type: "nightVoted" | "daytimeVoted"
): string => {
  const players = playerList.filter((player) => player[type]);
  if (!players.length) return "-1";
  // 1. 统计每个元素的出现次数
  const countMap = players.reduce((acc, player) => {
    const { [type]: item, isSheriff } = player;
    const weight = type === "daytimeVoted" && isSheriff ? 1.5 : 1;
    acc[item] = (acc[item] || 0) + weight;
    return acc;
  }, {} as Record<string, number>);

  // 2. 找到出现次数的最大值
  const maxCount = Math.max(...Object.values(countMap));

  // 3. 筛选出所有出现次数等于最大值的元素
  const mostFrequentItems = Object.keys(countMap).filter(
    (item) => countMap[item] === maxCount
  );

  // 4. 从这些元素中随机选择一个
  const randomIndex = Math.floor(Math.random() * mostFrequentItems.length);
  return mostFrequentItems[randomIndex];
};

export const createVotedRecord = (playerList: IPlayer[] = []): string => {
  const players = playerList.filter((player) => player.daytimeVoted);
  if (!players.length) return "";
  const sheriffPlayer = playerList.find((player) => player.isSheriff);
  const records: string[] = [];
  const waiverIds = players
    .filter((player) => player.daytimeVoted === "-1")
    .map((player) => player.seatId)
    .sort((a, b) => Number(a) - Number(b));
  if (waiverIds.length) {
    records.push(`${waiverIds.join("、")}号弃权`);
  }
  const countMap = players
    .filter((player) => player.daytimeVoted !== "-1")
    .reduce((acc, item) => {
      const { daytimeVoted, seatId } = item;
      if (!acc[daytimeVoted]) {
        acc[daytimeVoted] = [];
      }
      acc[daytimeVoted].push(seatId);
      return acc;
    }, {} as Record<string, string[]>);

  for (const [key, value] of Object.entries(countMap).sort(
    ([a], [b]) => Number(a) - Number(b)
  )) {
    const sheriffWeight = value.includes(sheriffPlayer?.seatId || "-1")
      ? 0.5
      : 0;
    records.push(
      `${value
        .sort((a, b) => Number(a) - Number(b))
        .join("、")}号投了${key}号（${value.length + sheriffWeight}票）`
    );
  }
  return records.join("；");
};

export const calculateNightInfo = (players: IPlayer[]) => {
  const werewolves = players.filter((player) =>
    WolfRoles.includes(player.role)
  );
  const witchPlayer = players.find((player) => player.role === RoleEnum.witch);
  const guardPlayer = players.find((player) => player.role === RoleEnum.guard);
  // 狼人刀口
  const knifedId = calculateMaxVoted(werewolves, "nightVoted");
  // 守卫保护
  const guardId = guardPlayer?.nightVoted || "-1";
  // 女巫用药
  const { skills = [], nightVoted } = witchPlayer || {};
  let helpId = "-1";
  let poisonId = "-1";
  if (skills.includes(SkillEnum.help) && nightVoted === knifedId) {
    helpId = knifedId;
  }
  if (skills.includes(SkillEnum.poison) && helpId === "-1") {
    poisonId = nightVoted || "-1";
  }

  return { knifedId, helpId, poisonId, guardId };
};

export const judgeGameOver = (
  players: IPlayer[]
): { wolfVictory?: boolean; goodVictory?: boolean } | undefined => {
  const wolfPlayers = players.filter((player) =>
    WolfRoles.includes(player.role)
  );
  const deityPlayers = players.filter((player) =>
    DeityRoles.includes(player.role)
  );
  const villagerPlayers = players.filter(
    (player) => player.role === RoleEnum.villager
  );
  if (!deityPlayers.length || !villagerPlayers.length) {
    // 狼人获胜
    return { wolfVictory: true };
  }
  if (!wolfPlayers.length) {
    // 好人获胜
    return { goodVictory: true };
  }
};

const publicNightInfo = async (roomId: string) => {
  // 获取房间信息、所有玩家信息
  const room = await roomService.getRoom(roomId);
  const allPlayers = await playerService.getPlayers(room.playerIds.join(","));
  const players = allPlayers.filter((player) => player.isAlive);
  const records: string[] = [];
  const sheriffId = calculateMaxVoted(players, "daytimeVoted");
  if (sheriffId && sheriffId !== "-1") {
    // 投票情况记录
    const votedRecord = createVotedRecord(players);
    records.push(`【竞选警长】${votedRecord}`);
    const sheriffPlayer = players.find((player) => player.seatId === sheriffId);
    const { skills = [] } = sheriffPlayer!;
    await playerService.updatePlayer(`${roomId}-${sheriffId}`, {
      isSheriff: true,
      skills: [...skills, SkillEnum.sheriff],
    });
    records.push(`【竞选警长】${sheriffId}号玩家当选警长`);
  }

  const hasNightVoted = players.find((player) => player.nightVoted);
  if (hasNightVoted) {
    const { helpId, poisonId, knifedId, guardId } = calculateNightInfo(
      players!
    );

    const poisonedPlayer = players.find((player) => player.seatId === poisonId);
    const knifedPlayer = players.find((player) => {
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
    const witchPlayer = players.find(
      (player) => player.role === RoleEnum.witch
    );
    const notAliveIds: string[] = [];
    if (poisonedPlayer) {
      notAliveIds.push(poisonedPlayer.seatId);
      const { skills = [] } = poisonedPlayer;
      const newSkills: string[] = [];
      // 被毒死仍然可以转移警徽
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
      await playerService.updatePlayer(witchPlayer.playerId, playerAttribute);
    }
    if (notAliveIds.length) {
      records.push(
        `【第${Math.ceil((room?.currentDay || 0) / 2)}天】昨晚${notAliveIds
          .sort((a, b) => Number(a) - Number(b))
          .join("、")}号玩家倒牌`
      );
    } else {
      records.push(
        `【第${Math.ceil((room?.currentDay || 0) / 2)}天】昨晚是平安夜`
      );
    }
    await roomService.updateRoomRecords(roomId!, records);

    // 重置
    for (const player of players) {
      await playerService.updatePlayer(player.playerId, {
        candidate: false,
        nightVoted: "",
        daytimeVoted: "",
      });
    }
  }
};

export const handleDaytimeStep = async (roomId: string) => {
  // 获取房间信息、所有玩家信息
  const room = await roomService.getRoom(roomId);
  const allPlayers = await playerService.getPlayers(room.playerIds.join(","));
  const players = allPlayers.filter((player) => player.isAlive);
  // 所有玩家处于同一步
  const finishOneStep =
    players && players.every((player) => player.step === room?.step);

  if (!finishOneStep) return;
  const { step } = room;
  switch (step) {
    // 申请竞选警长
    case 2:
      const candidates = players
        .filter((player) => player.candidate)
        .map((player) => Number(player.seatId))
        .sort((a, b) => a - b);
      if (candidates.length) {
        await roomService.updateRoomRecords(roomId!, [
          `【竞选警长】${candidates.join("、")}号玩家申请竞选警长`,
        ]);
      } else {
        // 无人竞选
        await roomService.updateRoomRecords(roomId!, [
          `【竞选警长】没有玩家申请竞选警长`,
        ]);
        await roomService.updateRoom(roomId, {
          step: 3,
        });
        const updatePlayerSteps = room.playerIds.map((id) =>
          playerService.updatePlayer(id, {
            voting: "",
            step: 3,
          })
        );
        await Promise.all(updatePlayerSteps);
        await publicNightInfo(roomId);
      }
      break;
    // 投票竞选警长、公布黑夜情况
    case 3:
      await publicNightInfo(roomId);
      break;
    // 放逐投票
    case 4:
      const hasDaytimeVoted = players.find((player) => player.daytimeVoted);
      if (hasDaytimeVoted) {
        const votedRecord = createVotedRecord(players);
        const exileId = calculateMaxVoted(players, "daytimeVoted");
        if (exileId && exileId !== "-1") {
          await playerService.updatePlayer(`${roomId}-${exileId}`, {
            isAlive: false,
            daytimeVoted: "",
          });
          await roomService.updateRoomRecords(roomId!, [
            `【第${Math.ceil((room?.currentDay || 0) / 2)}天】${votedRecord}`,
            `【第${Math.ceil(
              (room?.currentDay || 0) / 2
            )}天】${exileId}号玩家被放逐`,
          ]);
          // 重置
          for (const player of players) {
            await playerService.updatePlayer(player.playerId, {
              daytimeVoted: "",
            });
          }
        }
      }
  }
};
