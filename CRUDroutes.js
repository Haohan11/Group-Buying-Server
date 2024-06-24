import express from "express";

import { toArray, createBulkConnectMiddleware } from "./model/helper.js";
import { controllers } from "./controller/controller.js";

const createRouter = ({ path, schemas, actions }) => {
  const router = express.Router();

  [
    ["create", "post"],
    ["read", "get"],
    ["update", "put"],
    ["delete", "delete"],
  ].forEach(([action, method]) => {
    if (!actions?.[action]) return;

    appendMiddleware: try {
      if (!schemas || !schemas[action]) break appendMiddleware;

      const connectMiddleware = createBulkConnectMiddleware(
        schemas[action]
      );
      router.use(connectMiddleware);
    } catch (error) {
      console.warn(error);
    }

    router[method]("/", ...toArray(actions[action]));
  });

  return { path: `/${path}`, router };
};

export const createCRUDRoutes = (app) =>
  controllers.forEach((controller) => {
    const { path, router } = createRouter(controller);
    app.use(path, router);
  });
