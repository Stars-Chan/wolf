import React, { useEffect, useState } from "react";

const roles = [
  "村民",
  "村民",
  "村民",
  "村民",
  "狼人",
  "狼人",
  "狼人",
  "狼人",
  "预言家",
  "女巫",
  "守卫",
  "猎人",
];

const Game: React.FC = () => {
  const [playerRoles, setPlayerRoles] = useState<string[]>([]);

  useEffect(() => {
    // 随机分配角色
    const shuffledRoles = [...roles].sort(() => Math.random() - 0.5);
    setPlayerRoles(shuffledRoles);
  }, []);

  return (
    <div className="game-container">
      <div className="left-players">
        {playerRoles.slice(0, 6).map((role, index) => (
          <div key={index} className="player">
            玩家 {index + 1}: {role}
          </div>
        ))}
      </div>
      <div className="right-players">
        {playerRoles.slice(6).map((role, index) => (
          <div key={index + 6} className="player">
            玩家 {index + 7}: {role}
          </div>
        ))}
      </div>
      <div className="current-role">你的身份是：{playerRoles[0] || "未知"}</div>
    </div>
  );
};

export default Game;
