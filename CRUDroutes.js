import express from "express";

import {
  toArray,
  createBulkConnectMiddleware,
  logger,
} from "./model/helper.js";
import { controllers } from "./controller/controller.js";

const createRouter = ({ path, schemas, actions }) => {
  const router = express.Router();

  if (Array.isArray(schemas["all"]))
    router.use(createBulkConnectMiddleware(schemas["all"]));

  [
    ["create", "post"],
    ["read", "get"],
    ["update", "put"],
    ["delete", "delete"],
  ].forEach(([action, method]) => {
    if (!actions?.[action]) return;

    try {
      if (!schemas || !schemas[action])
        return router[method]("/", ...toArray(actions[action]));

      const connectMiddleware = createBulkConnectMiddleware(schemas[action]);
      router[method]("/", connectMiddleware, ...toArray(actions[action]));
    } catch (error) {
      console.warn(error);
    }
  });

  return { path: `/${path}`, router };
};

export const createCRUDRoutes = (app) =>
  controllers.forEach((controller) => {
    const { path, router } = createRouter(controller);
    app.use(path, router);
    logger("register route:", controller.path);
  });
