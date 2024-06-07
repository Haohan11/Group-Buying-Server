import express from "express";

import { toArray, createBulkConnectMiddleware } from "./model/helper.js";
import { getController } from "./controller/controller.js";

const routerConfig = [
  {
    path: "/test",
    controllerName: "Test",
    middlewares: {
      read: ["Test"]
    },
  },
];

const createRouter = ({ path, middlewares, controllerName }) => {
  const router = express.Router();
  const controller = getController(controllerName);

  [
     ["create", "post"] ,
     ["read", "get"] ,
     ["update", "put"] ,
     ["delete", "delete"] ,
  ].forEach(([ action, method ]) => {
    if (!controller?.[action]) return;
    try {
      const connectMiddleware = createBulkConnectMiddleware(
        middlewares[action]
      );

      router.use(connectMiddleware);
    } catch (error) {
      console.warn(error);
    }
    router[method]("/", ...toArray(controller[action]));
  });

  return { path, router };
};

export const createCRUDRoutes = (app) =>
  routerConfig.forEach((config) => {
    const { path, router } = createRouter(config);
    app.use(path, router);
  });
