import { useEffect, useState } from "react";
import { IPlayer, IRoom, RoleEnum } from "../interface";
import styles from "./Room.module.css";
import Seats from "./Seats";

interface IProps {
  room: IRoom;
  mySeatId: string;
  selectId?: string;
  players?: IPlayer[];
  handleContinue: () => void;
  handleNextDay?: () => void;
  handleNotVote?: () => void;
  handleMyVote?: (id: string) => void;
}

const Room: React.FC<IProps> = (props) => {
  const [nextDayDisabled, setNextDayDisabled] = useState(false);
  const [continueDisabled, setContinueDisabled] = useState(false);
  const [showRole, setShowRole] = useState(false);
  const {
    room,
    mySeatId,
    selectId,
    players = [],
    handleContinue,
    handleNextDay,
    handleNotVote,
    handleMyVote,
  } = props;
  const {
    roomId,
    playerIds = [],
    records = [],
    steps = [],
    start,
    step: roomStep,
    currentDay: roomCurrentDay,
  } = room;
  // 获取当前玩家信息
  const myPlayer = players.find(
    (player) => player.playerId === `${roomId}-${mySeatId}`
  );
  const { step = 0, currentDay = 0, role = "" } = myPlayer || {};
  let roleStep = 0;
  switch (role) {
    case RoleEnum.werewolf:
    case RoleEnum.wolfKing:
      roleStep = 1;
      break;
    case RoleEnum.witch:
      roleStep = 2;
      break;
    case RoleEnum.seer:
      roleStep = 3;
      break;
    case RoleEnum.guard:
      roleStep = 4;
      break;
  }

  const canMoveNow =
    step !== roomStep || players.every((player) => player.step === roomStep);

  useEffect(() => {
    // 下一天按钮状态
    const noAllStepDone =
      roomCurrentDay === currentDay &&
      players.some((player) => player.step !== steps.length);
    // 继续按钮状态
    // 游戏开始前仅1号玩家可以点击继续开始游戏
    const notFirstStartGame = !start && mySeatId !== "1";
    // 玩家数量限制
    const notEnoughPlayer = playerIds.length < 9 || playerIds.length > 14;
    // 正式开始游戏后，只有当所有人都完成当前步骤时，才能点击继续
    const hasNoVoting =
      Boolean(currentDay) &&
      step === roomStep &&
      players.some((player) => !player.voting);
    // 正式开始游戏后，与下一天按钮互斥
    const allStepDone = Boolean(currentDay) && !noAllStepDone;
    // 玩家出局
    const playerOut = start && !myPlayer && mySeatId === "1";

    const newContinueDisabled =
      notFirstStartGame ||
      notEnoughPlayer ||
      hasNoVoting ||
      allStepDone ||
      playerOut;

    setNextDayDisabled(noAllStepDone);
    setContinueDisabled(newContinueDisabled);
  }, [JSON.stringify(props)]);

  // left
  const leftPlayers = playerIds
    .map((playerId) => {
      const [, seatId] = playerId.split("-");
      return seatId;
    })
    .filter((seatId) => Number(seatId) <= 7);
  // right
  const rightPlayers = playerIds
    .map((playerId) => {
      const [, seatId] = playerId.split("-");
      return seatId;
    })
    .filter((seatId) => Number(seatId) > 7);

  // 天数
  const dayOfNumber = Math.ceil(currentDay / 2);
  const isNight = currentDay % 2 === 1;
  let outIds: string[] = [];
  if (players.length) {
    const alivePlayers = players.map((player) => player.playerId);
    outIds = playerIds
      .filter((id) => !alivePlayers.includes(id))
      .map((id) => id.split("-")[1]);
  }
  const honClickMyVote = (id: string) => {
    // 准备下一天和玩家不在同一步骤时不能投票
    const canVoting = players.every((player) => player.step === roomStep);
    if (!nextDayDisabled || !canVoting) return;
    handleMyVote && handleMyVote(id);
  };

  return (
    <div className={styles.container}>
      <Seats
        seatIds={["1", "2", "3", "4", "5", "6", "7"]}
        mySeatId={mySeatId}
        selectId={selectId}
        showRole={showRole}
        seatedIds={leftPlayers}
        myPlayer={myPlayer}
        players={players}
        isNight={isNight}
        outIds={outIds}
        handleMyVote={honClickMyVote}
      />
      {/* 房间信息 */}
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            房间号:<span className={styles.roomId}> {roomId}</span>&nbsp;&nbsp;
            {Boolean(currentDay) ? (
              <span>
                第
                <span className={styles.time}>
                  &nbsp;
                  {dayOfNumber}
                  &nbsp;
                </span>
                天{isNight ? "黑夜" : "白天"}
              </span>
            ) : (
              <span>
                共<span className={styles.time}> {playerIds.length} </span>
                名玩家
              </span>
            )}
          </div>
          {canMoveNow ? (
            <div className={isNight && roleStep === step ? styles.steps : ""}>
              {steps.length && step > 0 ? steps[step - 1] : "等待游戏开始..."}
            </div>
          ) : (
            <div>{`【${step}】`}等待其他玩家完成上一步...</div>
          )}
        </header>
        <main className={styles.main}>
          {records.map((record, index) => (
            <div
              key={record}
              className={`${styles.record} ${
                index % 2 === 1 ? styles.nextRecord : ""
              }`}
            >
              {record}
            </div>
          ))}
        </main>
        <footer className={styles.footer}>
          <button
            className={styles.roomButton}
            disabled={continueDisabled}
            onClick={handleContinue}
          >
            {currentDay ? "下一步" : "开始游戏"}
          </button>
          <button
            className={styles.roomButton}
            onClick={() => setShowRole(!showRole)}
          >
            查看身份
          </button>
          {Boolean(currentDay && handleNextDay) && (
            <button
              className={styles.roomButton}
              disabled={nextDayDisabled}
              onClick={handleNextDay}
            >
              {isNight ? "天亮了" : "进入黑夜"}
            </button>
          )}
          {Boolean(currentDay && handleNotVote) && (
            <button
              className={`${styles.roomButton} ${
                selectId === "-1" ? styles.selectedButton : ""
              }`}
              onClick={handleNotVote}
            >
              弃票
            </button>
          )}
        </footer>
      </div>
      <Seats
        seatIds={["8", "9", "10", "11", "12", "13", "14"]}
        mySeatId={mySeatId}
        selectId={selectId}
        showRole={showRole}
        seatedIds={rightPlayers}
        myPlayer={myPlayer}
        players={players}
        isNight={isNight}
        outIds={outIds}
        handleMyVote={honClickMyVote}
      />
    </div>
  );
};

export default Room;
