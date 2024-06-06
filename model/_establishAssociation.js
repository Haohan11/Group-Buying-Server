import connectToDataBase from "./connectToDatabase.js";
import createSchema from "../model/createSchema.js";
import Schemas from "../model/schema/schema.js";

export const establishAssociation = async () => {
  const sequelize = await connectToDataBase();
  if (sequelize === false) return false;

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
    return await sequelize.sync();
  } catch (error) {
    console.log(error);
    return false;
  }
};

await establishAssociation();
process.exit();
