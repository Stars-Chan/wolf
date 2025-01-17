export interface IPlayer {
  playerId: string;
  roomId: string;
  seatId: string;
  voting: string;
  nightVoted: string;
  daytimeVoted: string;
  isAlive: boolean;
  candidate: boolean;
  isSheriff: boolean;
  role: string;
  skills: string[];
  step: number;
  currentDay: number;
}

export const RoleNameMap = {
  villager: "村民",
  werewolf: "狼人",
  wolfKing: "狼王",
  seer: "预言家",
  witch: "女巫",
  guard: "守卫",
  hunter: "猎人",
};

export enum RoleEnum {
  villager = "villager",
  werewolf = "werewolf",
  wolfKing = "wolfKing",
  seer = "seer",
  witch = "witch",
  guard = "guard",
  hunter = "hunter",
}

export enum SkillEnum {
  help = "help",
  poison = "poison",
  kill = "kill",
  sheriff = "sheriff",
}

export const WolfRoles: string[] = [RoleEnum.werewolf, RoleEnum.wolfKing];
export const DeityRoles: string[] = [
  RoleEnum.seer,
  RoleEnum.witch,
  RoleEnum.guard,
  RoleEnum.hunter,
];
