const indentSymbol = "#";
const log = (message, indent = 0) =>
  console.log(`${indentSymbol}${new Array(indent).fill(indentSymbol).join("")} ${message}`);
const onelineLog = (message) => console.log(`${indentSymbol} ${message}\n`);
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
const initAuthor = [
  "create_id",
  "create_name",
  "modify_id",
  "modify_name",
].reduce(
  (dict, colName) => ({
    ...dict,
    [colName]: userData?.data?.[colName] ?? "system",
  }),
  {}
);

import Schemas from "./model/schema/schema.js";
import { createSchema } from "./model/helper.js";

await (async () => {
  onelineLog("Start initializing...");
  const sequelize = await connectToDB();
  if (!sequelize) exit();

  const getModel = async (schema) => {
    const Model = createSchema(sequelize, schema);
    await Model.sync({ alter: true });
    return Model;
  };

  GenerateTable: {
    const { generateTable } = initialConfig;
    if (!generateTable) {
      onelineLog("Skip generate tables.");
      break GenerateTable;
    }

    try {
      log("Generating table...");
      Object.values(Schemas).forEach((schema) =>
        createSchema(sequelize, schema)
      );
      await sequelize.sync({ alter: true });
      onelineLog("Tables generated.");
    } catch (error) {
      console.warn("Tables not generated.", error);
    }
  }

  try {
    /** Handle User below */
    GenerateUser: {
      if (!userData?.data || !Array.isArray(userData.unique)) {
        onelineLog("Skip generate `user` due to user data or unique not set.");
        break GenerateUser;
      }

      log("Creating `User`...");
      const { UserSchema } = Schemas;
      if (!UserSchema) return exit("`UserSchema` not set.");
      const User = sequelize.models.user || (await getModel(UserSchema));

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
      onelineLog("`User` created.");
    }
    /** Handle User above */

    /** Handle IndexItem below */
    HandleIndexItem: {
      const { IndexItemSchema, IndexItemTypeSchema } = Schemas;
      if (!indexItemData || !IndexItemSchema || !IndexItemTypeSchema) {
        onelineLog(
          "`IndexItem` not create due to schema or indexItem data not set."
        );

        break HandleIndexItem;
      }

      log("Creating `IndexItem` table and insert data...");

      const IndexItem =
        sequelize.models.index_item || (await getModel(IndexItemSchema));
      const IndexItemType =
        sequelize.models.index_item_type ||
        (await getModel(IndexItemTypeSchema));

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
      onelineLog("`IndexItem` success establish.");
    }
    /** Handle IndexItem above */

    /** Handle insert data below */
    InsertData: {
      const { insertData } = initialConfig;
      if (!insertData || !Array.isArray(insertData)) {
        onelineLog("No extra data insert.");
        break InsertData;
      }

      log("Inserting extra data...");
      await Promise.all(
        insertData.map(async (config) => {
          const {
            name,
            modelName,
            schemaName,
            data,
            destroy = true,
            author = initAuthor,
          } = config;

          if (!Array.isArray(data))
            return console.warn(`Insert data must receive array type.`);

          const InsertSchema = Schemas[`${schemaName}Schema`];
          if (!InsertSchema)
            return console.warn(
              `Schema \`${schemaName}\` not found when insert ${dataName}.`
            );

          const Table =
            sequelize.models[modelName] || (await getModel(InsertSchema));

          if (destroy) {
            log(`Destroying \`${name || modelName || schemaName}\`...`, 1);
            await Table.drop();
            log(`Creating \`${name || modelName || schemaName}\`...`, 1);
            await Table.sync();
            log(`Created \`${name || modelName || schemaName}\`...`, 1);
          }

          await Table.bulkCreate(data.map((item) => ({ ...item, ...author })));
          log(`\`${name || modelName || schemaName}\` data inserted.`);
        })
      );
      onelineLog("Extra data inserted.");
    }
    /** Handle insert data above */
  } catch (error) {
    exit(error);
  }

  onelineLog("Finish initialization.");
})();

process.exit();
