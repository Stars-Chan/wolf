import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Waiting: React.FC = () => {
  const [seats, setSeats] = useState(Array(12).fill(true));
  const navigate = useNavigate();

  const handleStartGame = () => {
    if (seats.every((seat) => seat)) {
      navigate("/game");
    }
  };

  return (
    <div className="waiting-container">
      <h1>房间号: 1234</h1>
      <div className="seats-container">
        <div className="left-seats">
          {seats.slice(0, 6).map((occupied, index) => (
            <div
              key={index}
              className={`seat ${occupied ? "occupied" : "available"}`}
            >
              座位 {index + 1}
            </div>
          ))}
        </div>
        <div className="right-seats">
          {seats.slice(6).map((occupied, index) => (
            <div
              key={index + 6}
              className={`seat ${occupied ? "occupied" : "available"}`}
            >
              座位 {index + 7}
            </div>
          ))}
        </div>
      </div>
      <button
        className="start-button"
        disabled={!seats.every((seat) => seat)}
        onClick={handleStartGame}
      >
        开始游戏
      </button>
    </div>
  );
};

export default Waiting;
