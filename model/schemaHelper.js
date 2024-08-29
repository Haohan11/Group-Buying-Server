import Schemas from "../model/schema/schema.js";
import {
  createSchema,
  logger,
  toArray,
  connection,
  modelDict,
} from "../model/helper.js";

const allSchemas = Object.entries(Schemas);

export const settingSequelize = async () => {
  const sequelize = await connection.get();
  if (!sequelize) return console.log("Failed to setting Sequelize!");

  const createModel = (schema) => {
    const { name, cols, option } = schema;
    return sequelize.define(name, cols, option);
  };

  try {
    allSchemas.forEach(([schemaName, schema]) => {
      const Table = modelDict.setOnce(schemaName, createModel(schema));
      const { hasOne, belongsTo, hasMany, belongsToMany } = schema;

      // loop all associate method
      Object.entries({ hasOne, belongsTo, hasMany, belongsToMany }).forEach(
        ([associName, associate]) => {
          // check if associate valid
          if (associate === undefined) return;
          if (typeof associate !== "object" || associate === null)
            throw Error(
              `Association ${associName} in ${schemaName} is invalid.`
            );

          // loop single associate method
          toArray(associate).forEach((associate, as_index) => {
            //check if target valid
            const { targetTable, option } = associate;
            if (!targetTable)
              throw Error(
                `No associate target table provided at ${schemaName}.${associName}[${as_index}]!`
              );

            const targetSchema = Schemas[`${targetTable}Schema`];
            if (!targetSchema)
              throw Error(`Schema ${targetTable} doesn't exist!`);

            const TargetTable = modelDict.setOnce(
              targetTable,
              createModel(targetSchema)
            );

            // handle junction model (for belongsToMany method)
            if (option?.through) {
              const { through } = option;
              const throughSchema = Schemas[`${through}Schema`];
              if (throughSchema)
                option.through = modelDict.setOnce(
                  through,
                  createModel(throughSchema)
                );
            }

            // build associate but havn't sync to database
            Table[associName](TargetTable, option);
          });
        }
      );
    });
    await sequelize.sync();
  } catch (error) {
    console.ins(error);
  }
};

export const createConnectMiddleware = (tableNames, syncOption) => {
  if (!Array.isArray(tableNames))
    throw new Error("`createConnectMiddleware` only accept array type input.");
  const schemas = tableNames.map((tableName) => Schemas[`${tableName}Schema`]);
  const noSchemaId = schemas.findIndex((schema) => schema === undefined);

  if (noSchemaId !== -1)
    throw new Error(`Schema not found: ${tableNames[noSchemaId]}`);

  return async (req, res, next) => {
    const { sequelize } = req.app;
    try {
      schemas.forEach((schema, index) => {
        const Table = (req.app[tableNames[index]] = createSchema(
          sequelize,
          schema
        ));
        const { hasOne, belongsTo, hasMany, belongsToMany } = schema;

        // loop all associate method
        Object.entries({ hasOne, belongsTo, hasMany, belongsToMany }).forEach(
          ([associName, associate]) => {
            // check if associate valid
            if (associate === undefined) return;
            if (typeof associate !== "object" || associate === null)
              throw Error(
                `Association ${associName} in ${tableNames[index]} is invalid.`
              );

            // loop single associate method
            toArray(associate).forEach((associate, as_index) => {
              //check if target valid
              const { targetTable, option } = associate;
              if (!targetTable)
                throw Error(
                  `No associate target table provided at ${tableNames[index]}.${associName}[${as_index}]!`
                );

              const targetSchema = Schemas[`${targetTable}Schema`];
              if (!targetSchema)
                throw Error(`Schema ${targetTable} doesn't exist!`);

              const TargetTable = (req.app[targetTable] ||= createSchema(
                sequelize,
                targetSchema
              ));

              // handle junction model (for belongsToMany method)
              if (option?.through) {
                const { through } = option;
                const throughSchema = Schemas[`${through}Schema`];
                if (throughSchema) {
                  option.through = req.app[through] ||= createSchema(
                    sequelize,
                    throughSchema
                  );
                }
              }

              // build associate but havn't sync to database
              Table[associName](TargetTable, option);
            });
          }
        );
      });
      await sequelize.sync(syncOption);
    } catch (error) {
      logger(
        "Error in connectMiddleware (generated by createConnectMiddleware):",
        error
      );
      return res.response(500);
    }
    next();
  };
};

/** create sequelize model by "schema name" and also "sync table" */
export const createModel = async (sequelize, schemaName, syncOption) => {
  const schema = Schemas[`${schemaName}Schema`];
  if (!schema) throw new Error(`Schema ${schemaName} not found!`);

  const { name, cols, option } = schema;
  const Table = sequelize.define(name, cols, option);
  await Table.sync(syncOption);

  return Table;
};
