import createSchema from "../model/createSchema.js";
import Schemas from "../model/schema/schema.js";

export const createConnectMiddleware = (tableName, schema) => {
  return async (req, res, next) => {
    const { sequelize } = req.app;
    try {
      const Table = await createSchema(sequelize, schema);
      await Table.sync();
      req.app[tableName] = Table;
    } catch (error) {
      return res.response(500);
    }
    next();
  };
};

export const allConnectMiddleware = Object.entries(Schemas).reduce(
  (dict, [schemaName, schema]) => {
    const connectName = schemaName.replace("Schema", "");
    dict[`connect${connectName}`] = createConnectMiddleware(
      connectName,
      schema
    );
    return dict;
  },
  {}
);
