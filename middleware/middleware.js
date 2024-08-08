import jwt from "jsonwebtoken";

import {
  customResponse,
  connectToDataBase,
  logger,
  serverErrorWrapper,
} from "../model/helper.js";

import { createModel } from "../model/schemaHelper.js";

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
  } catch (error) {
    console.log("`addUserMiddleware: `", error);
    res.response(500);
  }
};

export const backAuthMiddleware = serverErrorWrapper((req, res, next) => {
  const token = req.headers?.["authorization"]?.split(" ")?.[1];
  if (!token) return res.response(401);

  jwt.verify(token, process.env.BACK_SECRET_KEY, function (err, decoded) {
    if (err) return res.response(401);

    const {
      payload: { user_account },
    } = decoded;

    req._user = { user_account };
    next();
  });
}, "backAuthMiddleware");

export const frontAuthMiddleware = serverErrorWrapper((req, res, next) => {
  const token = req.headers?.["authorization"]?.split(" ")?.[1];
  if (!token) return res.response(401);

  jwt.verify(token, process.env.FRONT_SECRET_KEY, function (err, decoded) {
    if (err) return res.response(401);

    const {
      payload: { user_account, member_id },
    } = decoded;

    req._user = { account: user_account, member_id };
    next();
  });
}, "frontAuthMiddleware");

export const connectDbMiddleWare = async (req, res, next) => {
  const sequelize = await connectToDataBase();
  if (sequelize === false) return res.response(500);

  req.app.sequelize = sequelize;
  next();
};