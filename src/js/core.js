import "./Components/build.js";
import { Router } from "./Router.js";
import { init as initRoutes } from "./routes.js";

const router = new Router();
initRoutes(router);
