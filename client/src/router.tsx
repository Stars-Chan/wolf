import { createBrowserRouter } from "react-router-dom";
import Login from "./pages/Login";
import Waiting from "./pages/Waiting";
import Night from "./pages/Night";
import Daytime from "./pages/Daytime";

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
    path: "/night",
    element: <Night />,
  },
  {
    path: "/daytime",
    element: <Daytime />,
  },
  {
    path: "/night",
    element: <Night />,
  },
]);

export default router;
