import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import {
  logger,
  overrideLog
} from "./model/helper.js";

/** Override console.log */
overrideLog();

import { createCRUDRoutes } from "./CRUDroutes.js";
import { registRoutes } from "./routes/routes.js";

import {
  connectDbMiddleWare,
  responseMiddleware,
  notFoundResponse,
} from "./middleware/middleware.js";

import staticPathName from "./model/staticPathName.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.static(staticPathName));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/** Add custom response method to res.response */
app.use(responseMiddleware);

/** Add connection `sequelize` to res.app */ 
app.use(connectDbMiddleWare);

logger("Start regist routes...");
createCRUDRoutes(app);
registRoutes(app);
logger("Registed routes.");

app.get("/", (req, res) => {
  res.response(200, "YouCanBuy App Server.");
});

app.use("*", notFoundResponse);

const port = 3005;
app.listen(port, () => console.log(`server run at ${port}`));
