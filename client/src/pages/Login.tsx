import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const [roomId, setRoomId] = useState("");
  const [seatNumber, setSeatNumber] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (roomId && seatNumber) {
      navigate("/waiting");
    }
  };

  return (
    <div className="login-container">
      <h1>狼人杀游戏</h1>
      <div className="input-group">
        <label>房间号:</label>
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
      </div>
      <div className="input-group">
        <label>座位号:</label>
        <input
          type="number"
          min="1"
          max="12"
          value={seatNumber}
          onChange={(e) => setSeatNumber(e.target.value)}
        />
      </div>
      <button onClick={handleLogin}>进入游戏</button>
    </div>
  );
};

export default Login;
