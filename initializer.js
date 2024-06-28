const log = console.log;
const onelineLog = (message) => console.log(`${message}\n`);
const exit = (message) => {
  message !== undefined && onelineLog(message);
  process.exit();
};

import dotenv from "dotenv";
dotenv.config();
const { DB_NAME, DB_USERNAME, DB_PASSWORD, DB_HOST, DB_PORT } = process.env;
if (!DB_NAME || !DB_USERNAME || !DB_PASSWORD || !DB_HOST || !DB_PORT)
  exit("Required env data lost. Make sure .env file is set.");

import { Sequelize } from "sequelize";

import initialConfig from "./initial.config.js";
const { showSequelizeLog = true } = initialConfig;

const connectToDB = async () => {
  const createSequelize = new Sequelize("", DB_USERNAME, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: "mysql",
    logging: showSequelizeLog,
  });
  const sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: "mysql",
    logging: showSequelizeLog,
  });

  try {
    await createSequelize.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */`
    );

    await sequelize.authenticate();
    onelineLog("Connection has been established successfully.");
    return sequelize;
  } catch (error) {
    console.warn("Unable to connect to the database.", error);
    return false;
  }
};

const { user: userData, indexItem: indexItemData } = initialConfig;
if (!userData.data || !Array.isArray(userData.unique))
  exit("User data set invalid.");

if (!indexItemData) onelineLog("Index item data not set.");

import Schemas from "./model/schema/schema.js";
import { createSchema } from "./model/helper.js";

await (async () => {
  onelineLog("Start initializing...");
  const sequelize = await connectToDB();
  if (!sequelize) exit();

  const getModel = async (schema) => {
    const Model = createSchema(sequelize, schema);
    await Model.sync({ alter: true });
  };

  const { generateTable } = initialConfig;
  if (generateTable) {
    log("Generate table...");
    Object.values(Schemas).forEach((schema) => createSchema(sequelize, schema));
    await sequelize.sync({ alter: true });
    onelineLog("Table generated.");
  }

  /** Handle User below */
  log("Create User...");
  const { UserSchema } = Schemas;
  if (!UserSchema) return exit("UserSchema not set.");

  try {
    const User = sequelize.models.user || getModel(UserSchema);

    await User.destroy({
      where: userData.unique.reduce(
        (whereDict, keyName) => ({
          ...whereDict,
          [keyName]: userData.data[keyName],
        }),
        {}
      ),
    });
    await User.create(userData.data);
    onelineLog("User created.");
    /** Handle User above */

    /** Handle IndexItem below */
    log("Create IndexItem...");
    const { IndexItemSchema, IndexItemTypeSchema } = Schemas;
    if (!indexItemData || !IndexItemSchema || !IndexItemTypeSchema)
      return console.warn(
        "IndexItem not create due to schema or indexItem data not set."
      );

    const initAuthor = [
      "create_id",
      "create_name",
      "modify_id",
      "modify_name",
    ].reduce(
      (dict, colName) => ({ ...dict, [colName]: userData.data[colName] }),
      {}
    );

    const IndexItem = sequelize.models.index_item || getModel(IndexItemSchema);
    const IndexItemType =
      sequelize.models.index_item_type || getModel(IndexItemTypeSchema);

    await IndexItemType.destroy({
      truncate: true,
    });
    await IndexItem.destroy({
      truncate: true,
    });
    await Promise.all(
      indexItemData.map(async ({ name, icon, route, indexItems }) => {
        const { id: typeId } = await IndexItemType.create({
          name,
          icon,
          route,
          ...initAuthor,
        });

        const insertData = indexItems.map((item) => ({
          name: item.name,
          route: item.route,
          table_name: item.tableName,
          index_item_type_id: typeId,
          ...initAuthor,
        }));

        await IndexItem.bulkCreate(insertData);
      })
    );
    onelineLog("IndexItem created.");
    /** Handle IndexItem above */

    /** Handle insert data below */
    const { insertData } = initialConfig;
    if (!insertData) return onelineLog("No extra data insert.");

    log("Inserting extra data...");
    await Promise.all(
      Object.entries(insertData).map(async ([dataName, config]) => {
        const { modelName, schemaName, data, destroy = true, author = initAuthor } = config;

        if (!Array.isArray(data))
          return console.warn(`Insert data must receive array type.`);

        const InsertSchema = Schemas[`${schemaName}Schema`];
        if (!InsertSchema)
          return console.warn(
            `Schema \`${schemaName}\` not found when insert ${dataName}.`
          );

        const Table = sequelize.models[modelName] || getModel(InsertSchema);

        destroy && (await Table.destroy({ truncate: true }));

        await Table.bulkCreate(data.map((item) => ({ ...item, ...author })));

        log(`${dataName} inserted.`);
      })
    );
    onelineLog("Extra data inserted.");
    /** Handle insert data above */
  } catch (error) {
    exit(error);
  }

  onelineLog("Finish initializing.");
})();

process.exit();
