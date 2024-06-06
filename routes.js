import express from "express";

import { allConnectMiddleware } from "./middleware/connectToTable.js";

import { toArray } from "./model/helper.js";
import * as AllController from "./controller/controller.js";

const tablesDependencies = {
  Series: {
    tableName: "Series",
    connectMiddlewares: ["Series"],
  },
  ColorName: {
    tableName: "ColorName",
    connectMiddlewares: ["StockColor", "ColorName"],
  },
  ColorScheme: {
    tableName: "ColorScheme",
    connectMiddlewares: ["ColorScheme"],
  },
  Design: {
    tableName: "Design",
    connectMiddlewares: ["Design"],
  },
  Material: {
    tableName: "Material",
    connectMiddlewares: ["Material"],
  },
  Supplier: {
    tableName: "Supplier",
    connectMiddlewares: ["Supplier"],
  },
  Employee: {
    tableName: "Employee",
    connectMiddlewares: ["Employee", "User", "User_Role", "Role"],
  },
  Environment: {
    tableName: "Environment",
    connectMiddlewares: ["Environment"],
  },
  Stock: {
    tableName: "Stock",
    connectMiddlewares: [
      "Stock",
      "Stock_Material",
      "Stock_Design",
      "Stock_Environment",
      "StockColor",
      "StockColor_ColorScheme",
      "ColorName",
      "ColorScheme",
      "Series",
      "Supplier",
      "Material",
      "Design",
      "Environment",
    ],
  },
  Combination: {
    tableName: "Combination",
    connectMiddlewares: [
      "Combination",
      "Combination_Stock",
      "Environment",
      "Stock",
    ],
  },
  Account: {
    tableName: "Account",
    connectMiddlewares: [
      "Employee","User"
    ],
  },
  Role: {
    tableName: "Role",
    connectMiddlewares: [
      "Role", "Permission", "PermissionType", "User_Role", "Role_Permission"
    ],
  },
  Permission: {
    tableName: "Permission",
    connectMiddlewares: [
      "Permission", "PermissionType"
    ],
  },
};

const Routers = Object.entries(tablesDependencies).reduce(
  (dict, [table, content]) => {
    const router = express.Router();

    const { tableName, connectMiddlewares } = content;

    connectMiddlewares.forEach((middlewareName) => {
      // Add Sequelize Model instance to req.app
      const connectName = `connect${middlewareName}`;
      const connectMiddleware = allConnectMiddleware[connectName];
      return connectMiddleware === undefined
        ? console.warn(`Cannot find middleware "${connectName}".`)
        : router.use(connectMiddleware);
    });

    const controller = AllController[`${tableName}Controller`];

    controller.create && router.post("/", ...toArray(controller.create));
    controller.read && router.get("/", ...toArray(controller.read));
    controller.update && router.put("/", ...toArray(controller.update));
    controller.delete && router.delete("/", ...toArray(controller.delete));

    dict[`${tableName}Router`] = router;
    return dict;
  },
  {}
);

export { Routers };
