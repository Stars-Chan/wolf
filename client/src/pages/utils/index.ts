import _ from "lodash";
import { IPlayer, RoleEnum, SkillEnum, WolfRoles } from "../interface";

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
    records.push(
      `${value
        .sort((a, b) => Number(a) - Number(b))
        .join("、")}号投了${key}号（${value.length}票）`
    );
  }
  return records.join(";");
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
