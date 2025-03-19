import styles from "./Seat.module.css";
import playerIcon from "@/assets/player.png";
import raiseHandIcon from "@/assets/raiseHand.png";
import sheriffIcon from "@/assets/sheriff.png";
import {
  IPlayer,
  RoleEnum,
  RoleNameMap,
  SkillEnum,
  WolfRoles,
} from "../interface";
import { calculateMaxVoted } from "../utils";

interface IProps {
  mySeatId: string;
  seatIds: string[];
  showRole: boolean;
  seatedIds: string[]; // 已坐下的座位id
  selectId?: string;
  outIds?: string[];
  myPlayer?: IPlayer;
  players?: IPlayer[];
  isNight?: boolean;
  handleMyVote?: (id: string) => void;
}

const Seats: React.FC<IProps> = (props) => {
  const {
    mySeatId,
    seatIds,
    showRole,
    seatedIds = [],
    selectId,
    outIds = [],
    myPlayer,
    players = [],
    isNight,
    handleMyVote,
  } = props;

  const { step, nightVoted } = myPlayer || {};
  const role = myPlayer?.role as keyof typeof RoleNameMap;
  // 狼人玩家
  const werewolves = players.filter((player) =>
    WolfRoles.includes(player.role)
  );
  const knifedId = calculateMaxVoted(werewolves, "nightVoted");
  // 女巫玩家
  const witchPlayer = players.find((player) => player.role === RoleEnum.witch);
  // 被查验的玩家
  const checkedPlayer = players.find((player) => player.seatId === nightVoted);

  const handleSelectPlayer = (id: string) => {
    handleMyVote && handleMyVote(id);
  };

  return (
    <div className={`${styles.seatContainer}`}>
      {seatIds.map((seatId) => (
        <div
          key={seatId}
          className={`${styles.seat} ${
            seatId === selectId ? styles.selected : ""
          }`}
          onClick={() =>
            seatedIds.includes(seatId) && handleSelectPlayer(seatId)
          }
        >
          {outIds.includes(seatId) && (
            <div className={styles.overlay}>出局</div>
          )}
          {seatedIds.includes(seatId) && (
            <div>
              {showRole && seatId === mySeatId ? (
                <span>{RoleNameMap[role]}</span>
              ) : (
                <img
                  src={
                    players.find((player) => player.seatId === seatId)
                      ?.isSheriff
                      ? sheriffIcon
                      : playerIcon
                  }
                  className={styles.playerIcon}
                />
              )}
            </div>
          )}
          {seatId === mySeatId && <div className={styles.myself}>你</div>}
          {/* 申请警长 */}
          {players.find((player) => player.seatId === seatId)?.candidate &&
            step === 2 && (
              <div className={styles.candidate}>
                <img src={raiseHandIcon} className={styles.raiseHandIcon} />
              </div>
            )}
          {/* 狼人身份 */}
          {isNight &&
            step === 1 &&
            WolfRoles.includes(role) &&
            werewolves.find((werewolf) => werewolf.seatId === seatId) && (
              <div className={styles.nightInfo}>
                {
                  werewolves.find((werewolf) => werewolf.seatId === seatId)
                    ?.voting
                }
              </div>
            )}
          {/* 刀口 */}
          {isNight &&
            step === 2 &&
            role === RoleEnum.witch &&
            witchPlayer?.skills.includes(SkillEnum.help) &&
            knifedId === seatId && <div className={styles.nightInfo}>X</div>}
          {/* 查验信息 */}
          {isNight &&
            step === 4 &&
            role === RoleEnum.seer &&
            checkedPlayer?.seatId === seatId &&
            (WolfRoles.includes(checkedPlayer.role) ? (
              <div className={styles.nightInfo}>狼</div>
            ) : (
              <div className={styles.goodPeople}>好</div>
            ))}
          <div className={styles.seatId}>{seatId}</div>
        </div>
      ))}
    </div>
  );
};

export default Seats;
