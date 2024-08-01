import jwt from "jsonwebtoken";
import Schemas from "../model/schema/schema.js";

import {
  customResponse,
  createSchema,
  connectToDataBase,
  logger,
} from "../model/helper.js";

import { 
  createModel,
} from "../model/schemaHelper.js";

export const responseMiddleware = (req, res, next) => {
  res.response = (statusCode, message, data) =>
    customResponse(res, statusCode, message, data);
  next();
};

export const notFoundResponse = (req, res) => res.response(404);

export const addUserMiddleware = async (req, res, next) => {
  logger("========== in addUserMiddleware ==========");
  if (!req._user) {
    logger("======= exit addUserMiddleware due to no req._user =======");
    return next();
  }

  try {
    if (!req.app.User) {
      logger("========== Creating User Model ==========");
      const User = await createModel(req.app.sequelize, "User");
      req.app.User = User;
      logger("========== Success created User Model ==========");
    }
    const account = req._user.user_account;
    const { User } = req.app;
    const { id, name } = await User.findOne({ where: { account } });
    req._user.user_id = id;
    req._author = {
      create_name: name,
      modify_name: name,
      create_id: account,
      modify_id: account,
    };
    logger("========== exit addUserMiddleware ==========");
    next();
  } catch {
    res.response(500);
  }
};

export const authenticationMiddleware = (req, res, next) => {
  logger("========= in authentication middleware =========");
  let token;
  try {
    token = req.headers["authorization"].split(" ")[1];
  } catch (e) {
    token = "";
  }

  const result = [false, false];

  jwt.verify(token, "front_secret_key", function (err, decoded) {
    if (err) return;

    const {
      payload: { user_account },
    } = decoded;

    req._user = { user_account };
    result[0] = true;
  });

  jwt.verify(token, "back_secret_key", function (err, decoded) {
    if (err) return;

    const {
      payload: { user_account },
    } = decoded;

    req._user = { user_account };

    result[1] = true;
  });
  
  logger("========= exit authentication middleware =========");
  
  result.includes(true) ? next() : res.response(401);
};

export const resetAuthentication = (req, res, next) => {
  let token;
  try {
    token = req.headers["authorization"].split(" ")[1];
  } catch (e) {
    token = "";
  }

  jwt.verify(token, "reset_secret_key", function (err, decoded) {
    if (err) {
      return res.response(401);
    } else {
      const {
        payload: { user_account },
      } = decoded;
      req._user = { user_account };
      next();
    }
  });
};

export const connectDbMiddleWare = async (req, res, next) => {
  const sequelize = await connectToDataBase();
  if (sequelize === false) return res.response(500);

  req.app.sequelize = sequelize;
  next();
};