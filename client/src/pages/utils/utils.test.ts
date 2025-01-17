import { IPlayer } from "../interface";
import { calculateMaxVoted, createVotedRecord } from "./index";

describe("calculateMaxVoted", () => {
  it('should return "-1" when players array is empty', () => {
    const players: IPlayer[] = [];
    const result = calculateMaxVoted(players, "nightVoted");
    expect(result).toBe("-1");
  });

  it("should return '-1' when no player voted", () => {
    const players: IPlayer[] = [
      {
        playerId: "21-3",
        currentDay: 2,
        isAlive: true,
        isSheriff: false,
        role: "werewolf",
        roomId: "21",
        seatId: "3",
        skills: [],
        step: 2,
        daytimeVoted: "",
        nightVoted: "",
        voting: "",
        candidate: true,
      },
    ];
    const result = calculateMaxVoted(players, "nightVoted");
    expect(result).toBe("-1");
  });

  it("should return the voted value when all players vote the same", () => {
    const players: IPlayer[] = [
      {
        playerId: "21-3",
        currentDay: 2,
        isAlive: true,
        isSheriff: false,
        role: "werewolf",
        roomId: "21",
        seatId: "3",
        skills: [],
        step: 2,
        voting: "",
        daytimeVoted: "",
        nightVoted: "2",
        candidate: true,
      },
      {
        playerId: "21-2",
        currentDay: 2,
        isAlive: true,
        isSheriff: false,
        role: "werewolf",
        roomId: "21",
        seatId: "2",
        skills: [],
        step: 2,
        daytimeVoted: "",
        nightVoted: "2",
        voting: "",
        candidate: true,
      },
    ];
    const result = calculateMaxVoted(players, "nightVoted");
    expect(result).toBe("2");
  });

  it("should return the most frequent voted value when votes are not the same", () => {
    const players: IPlayer[] = [
      {
        playerId: "21-1",
        currentDay: 2,
        isAlive: true,
        isSheriff: false,
        role: "werewolf",
        roomId: "21",
        seatId: "1",
        skills: [],
        step: 2,
        daytimeVoted: "",
        nightVoted: "1",
        voting: "",
        candidate: true,
      },
      {
        playerId: "21-2",
        currentDay: 2,
        isAlive: true,
        isSheriff: false,
        role: "werewolf",
        roomId: "21",
        seatId: "2",
        skills: [],
        step: 2,
        daytimeVoted: "",
        nightVoted: "3",
        voting: "",
        candidate: true,
      },
      {
        playerId: "21-3",
        currentDay: 2,
        isAlive: true,
        isSheriff: false,
        role: "werewolf",
        roomId: "21",
        seatId: "3",
        skills: [],
        step: 2,
        daytimeVoted: "",
        nightVoted: "3",
        voting: "",
        candidate: true,
      },
    ];
    const result = calculateMaxVoted(players, "nightVoted");
    expect(result).toBe("3");
  });

  it("should return one of the most frequent voted values when there are multiple highest votes", () => {
    const players: IPlayer[] = [
      {
        playerId: "21-3",
        currentDay: 2,
        isAlive: true,
        isSheriff: false,
        role: "werewolf",
        roomId: "21",
        seatId: "3",
        skills: [],
        step: 2,
        daytimeVoted: "",
        nightVoted: "3",
        voting: "",
        candidate: true,
      },
      {
        playerId: "21-4",
        currentDay: 2,
        isAlive: true,
        isSheriff: false,
        role: "werewolf",
        roomId: "21",
        seatId: "4",
        skills: [],
        step: 2,
        daytimeVoted: "",
        nightVoted: "4",
        voting: "",
        candidate: true,
      },
    ];
    const result = calculateMaxVoted(players, "nightVoted");
    expect(["3", "4"]).toContain(result);
  });

  it("警长投票权重为1.5", () => {
    const players: IPlayer[] = [
      {
        playerId: "21-3",
        currentDay: 2,
        isAlive: true,
        isSheriff: true,
        role: "werewolf",
        roomId: "21",
        seatId: "3",
        skills: [],
        step: 2,
        daytimeVoted: "1",
        nightVoted: "",
        voting: "",
        candidate: true,
      },
      {
        playerId: "21-4",
        currentDay: 2,
        isAlive: true,
        isSheriff: false,
        role: "werewolf",
        roomId: "21",
        seatId: "4",
        skills: [],
        step: 2,
        daytimeVoted: "2",
        nightVoted: "",
        voting: "",
        candidate: true,
      },
    ];
    const result = calculateMaxVoted(players, "daytimeVoted");
    expect(result).toBe("1");
  });
});

describe("createVotedRecord", () => {
  it("没人投票", () => {
    const players: IPlayer[] = [];
    const result = createVotedRecord(players);
    expect(result).toBe("");
  });

  it("一人投票", () => {
    const players: IPlayer[] = [
      {
        playerId: "21-3",
        currentDay: 2,
        isAlive: true,
        isSheriff: false,
        role: "werewolf",
        roomId: "21",
        seatId: "3",
        skills: [],
        step: 2,
        daytimeVoted: "1",
        nightVoted: "",
        voting: "",
        candidate: false,
      },
    ];
    const result = createVotedRecord(players);
    const input = ["3号投了1号（1票）"];
    expect(result).toBe(input.join("\n"));
  });

  it("多人投票", () => {
    const players: IPlayer[] = [
      {
        playerId: "21-4",
        currentDay: 2,
        isAlive: true,
        isSheriff: false,
        role: "werewolf",
        roomId: "21",
        seatId: "4",
        skills: [],
        step: 2,
        daytimeVoted: "-1",
        nightVoted: "",
        voting: "",
        candidate: false,
      },
      {
        playerId: "21-2",
        currentDay: 2,
        isAlive: true,
        isSheriff: false,
        role: "werewolf",
        roomId: "21",
        seatId: "2",
        skills: [],
        step: 2,
        daytimeVoted: "-1",
        nightVoted: "",
        voting: "",
        candidate: false,
      },
      {
        playerId: "21-3",
        currentDay: 2,
        isAlive: true,
        isSheriff: false,
        role: "werewolf",
        roomId: "21",
        seatId: "3",
        skills: [],
        step: 2,
        daytimeVoted: "1",
        nightVoted: "",
        voting: "",
        candidate: false,
      },
    ];
    const result = createVotedRecord(players);
    const input = ["2、4号弃权", "3号投了1号（1票）"];
    expect(result).toBe(input.join(";"));
  });
});
