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

false &&
  app.post("/logout", async function (req, res) {
    try {
      res.response(200, "登出成功");
    } catch (error) {
      console.log(error);
      res.response(500, { error });
    }
  });

app.get("/", (req, res) => {
  res.response(200, "Hello world");
});

app.use("*", notFoundResponse);

const port = 3005;
app.listen(port, () => console.log(`server run at ${port}`));
