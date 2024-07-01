import jwt from "jsonwebtoken";
import Schemas from "../model/schema/schema.js";

import {
  customResponse,
  createSchema,
  connectToDataBase,
  createBulkConnectMiddleware,
} from "../model/helper.js";

export const responseMiddleware = (req, res, next) => {
  res.response = (statusCode, message, data) =>
    customResponse(res, statusCode, message, data);
  next();
};

export const notFoundResponse = (req, res) => res.response(404);

export const addUserMiddleware = async (req, res, next) => {
  if (!req._user) return next();
  if (!req.app.User)
    await createBulkConnectMiddleware(["User"])(req, res, next);

  try {
    const account = req._user.user_account;
    const { User } = req.app;
    const { id, name } = await User.findOne({ where: { account } });
    req._user.user_id = id;
    req._author = {
      create_name: name,
      modify_name: name,
      create_id: account,
      modify_id: account,
      company_id: 1,
    };
    next();
  } catch {
    res.response(500);
  }
};

export const authenticationMiddleware = (req, res, next) => {
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

  jwt.verify(token, "my_secret_key", function (err, decoded) {
    if (err) return;

    const {
      payload: { user_account },
    } = decoded;

    req._user = { user_account };

    result[1] = true;
  });

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
  if (sequelize === false) res.response(500);

  req.app.sequelize = sequelize;
  next();
};

export const establishAssociation = async (req, res, next) => {
  const { sequelize } = req.app;

  const connectionCache = {};
  const createModel = (schema) => createSchema(sequelize, schema);

  try {
    // loop all schemas
    Object.entries(Schemas).map(([schemaName, schema]) => {
      const { hasOne, belongsTo, hasMany, belongsToMany } = schema;

      // loop all associate method
      Object.entries({ hasOne, belongsTo, hasMany, belongsToMany }).map(
        ([associName, associate]) => {
          // check if associate valid
          if (associate === undefined) return;
          if (typeof associate !== "object" || associate === null)
            throw Error(
              `Association ${associName} in ${schemaName} is invalid.`
            );

          // create and push source connect model to cache
          const tableName = schemaName.replace("Schema", "");
          const Table = (connectionCache[tableName] ||= createModel(schema));

          // loop single associate method
          (Array.isArray(associate) ? associate : [associate]).map(
            (associate, index) => {
              //check if target valid
              const { targetTable, option } = associate;
              if (!targetTable)
                throw Error(
                  `No associate target table provided at ${schemaName}.${associName}[${index}]!`
                );

              // create and push target connection model to cache
              const targetSchema = Schemas[`${targetTable}Schema`];
              if (!targetSchema)
                throw Error(`Schema ${targetTable} doesn't exist!`);
              const TargetTable = (connectionCache[targetTable] ||=
                createModel(targetSchema));

              // handle junction model (for belongsToMany method)
              if (option?.through) {
                const { through } = option;
                const throughSchema = Schemas[`${through}Schema`];
                if (throughSchema) {
                  option.through = connectionCache[through] ||=
                    createModel(throughSchema);
                }
              }

              // build associate but havn't sync to database
              Table[associName](TargetTable, option);
            }
          );
        }
      );
    });

    // sync with database
    await sequelize.sync();
    next();
  } catch (error) {
    console.log(error);
    res.response(500);
  }
};
