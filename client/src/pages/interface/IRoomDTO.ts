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

export const NightStepTips = [
  "【狼人】右上角有红色气泡为狼人，气泡内会展示其刀口",
  "【女巫】解药未使用时能看到上一轮的狼人刀口，该玩家右上角有红色气泡。选择该名刀口玩家，即使用解药，选择其他玩家，即使用毒药，选择弃票，即同时不用解药和毒药",
  "【预言家】选择玩家，点击下一步后即可看到【好】或者【狼】",
  "【守卫】弃票即空守，不能连续两晚守护同一名玩家",
];

export const DaytimeStepDescriptions = [
  "申请竞选警长",
  "投票竞选警长",
  "公布黑夜情况、开始发言、投票放逐",
  "公布放逐情况、发表遗言",
];
