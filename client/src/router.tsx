import { createBrowserRouter } from "react-router-dom";
import Login from "./pages/Login";
import Waiting from "./pages/Waiting";
import Game from "./pages/Game";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/waiting",
    element: <Waiting />,
  },
  {
    path: "/game",
    element: <Game />,
  },
]);

export default router;
