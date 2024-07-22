const indentSymbol = "#";
const log = (message, indent = 0) =>
  console.log(
    `${indentSymbol}${new Array(indent).fill(indentSymbol).join("")} ${message}`
  );
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

const initAuthor = {
  create_id: "system",
  create_name: "system",
  modify_id: "system",
  modify_name: "system",
};

import Schemas from "./model/schema/schema.js";
import { createSchema, toArray } from "./model/helper.js";

await (async () => {
  onelineLog("Start initializing...");
  const sequelize = await connectToDB();
  if (!sequelize) exit();

  const getModel = async (schema, syncOption = { alter: true }) => {
    const Model = createSchema(sequelize, schema);
    await Model.sync(syncOption);
    return Model;
  };

  const createTables = async ({ destroy = false }) => {
    Object.values(Schemas)
      .sort(({ order: order1 = 0 }, { order: order2 = 0 }) => order1 - order2)
      .forEach(async (schema) => {
        const Table = createSchema(sequelize, schema);
        const { hasOne, belongsTo, hasMany, belongsToMany } = schema;

        // loop all associate method
        Object.entries({ hasOne, belongsTo, hasMany, belongsToMany }).forEach(
          ([associName, associate]) => {
            // check if associate valid
            if (associate === undefined) return;
            if (typeof associate !== "object" || associate === null)
              throw Error(
                `Association ${associName} in ${schema.name} is invalid.`
              );

            // loop single associate method
            toArray(associate).forEach((associate, as_index) => {
              //check if target valid
              const { targetTable, option } = associate;
              if (!targetTable)
                throw Error(
                  `No associate target table provided at ${schema.name}.${associName}[${as_index}]!`
                );

              const targetSchema = Schemas[`${targetTable}Schema`];
              if (!targetSchema)
                throw Error(`Schema ${targetTable} doesn't exist!`);

              const TargetTable = createSchema(sequelize, targetSchema);

              // handle junction model (for belongsToMany method)
              if (option?.through) {
                const { through } = option;
                const throughSchema = Schemas[`${through}Schema`];
                if (throughSchema) {
                  option.through = createSchema(sequelize, throughSchema);
                }
              }

              // build associate but havn't sync to database
              Table[associName](TargetTable, option);
            });
          }
        );
      });

    await sequelize.sync({ [destroy ? "force" : "alter"]: true });
  };

  try {
    /** Handle generate tables below */
    GenerateTable: {
      const { generateTable, recreateTable } = initialConfig;
      if (!generateTable || recreateTable) {
        onelineLog("Skip generate tables.");
        break GenerateTable;
      }

      log("Generating table...");
      await createTables();
      onelineLog("Tables generated.");
    }
    /** Handle generate tables above */

    RecreateTable: {
      const { recreateTable } = initialConfig;
      if (!recreateTable) {
        onelineLog("Skip recreate tables.");
        break RecreateTable;
      }

      log("Recreating tables...");
      await createTables({ destroy: true });
      onelineLog("Tables recreated.");
    }

    /** Handle IndexItem below */
    HandleIndexItem: {
      const { indexItem: indexItemData } = initialConfig;
      const { IndexItemSchema, IndexItemTypeSchema } = Schemas;
      if (!indexItemData || !IndexItemSchema || !IndexItemTypeSchema) {
        onelineLog(
          "`IndexItem` not create due to schema or indexItem data not set."
        );

        break HandleIndexItem;
      }

      log("Creating `IndexItem` table and insert the data...");

      const IndexItem =
        sequelize.models.index_item || (await getModel(IndexItemSchema));
      const IndexItemType =
        sequelize.models.index_item_type ||
        (await getModel(IndexItemTypeSchema));

      await IndexItem.sync({ force: true });
      await IndexItemType.sync({ force: true });

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

          const logName = name || modelName || schemaName;

          if (!Array.isArray(data))
            return console.warn(`Insert data must receive array type.`);

          const InsertSchema = Schemas[`${schemaName}Schema`];
          if (!InsertSchema)
            return console.warn(
              `Schema \`${schemaName}\` not found when insert ${logName}.`
            );

          const Table =
            sequelize.models[modelName] || (await getModel(InsertSchema));

          if (destroy) {
            log(`Destroying \`${logName}\`...`, 1);
            await Table.drop();
            log(`Creating \`${logName}\`...`, 1);
            await Table.sync();
            log(`Created \`${logName}\`...`, 1);
          }

          await Table.bulkCreate(data.map((item) => ({ ...item, ...author })));
          log(`\`${logName}\` data inserted.`);
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
