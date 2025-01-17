export interface IRoom {
  roomId: string;
  start: boolean;
  step: number;
  currentDay: number;
  playerIds: string[];
  records: string[];
  steps: string[];
}

export const NightStepDescriptions = [
  "狼人请行动...",
  "女巫请行动...",
  "预言家行动...",
  "守卫请行动...",
  "准备天亮了...",
];

export const DaytimeStepDescriptions = [
  "申请竞选警长",
  "投票竞选警长",
  "公布黑夜情况、开始发言、投票放逐",
  "公布放逐情况、发表遗言",
];
