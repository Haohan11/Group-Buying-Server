import { DataTypes } from "sequelize";

import connectToDataBase from "./connectToDatabase.js";
import createSchema from "./createSchema.js";
import Schemas from "./schema/schema.js";

const { UserSchema, EmployeeSchema } = Schemas;

export const establishAssociation = async () => {
  const sequelize = await connectToDataBase();
  if (sequelize === false) return false;

  const createModel = (schema) => createSchema(sequelize, schema);

  const User = createModel(UserSchema);
  const Employee = createModel(EmployeeSchema);

  const use_id = { name: "user_id", type: DataTypes.INTEGER, defaultValue: -1 };
  User.hasOne(Employee, {
    foreignKey: use_id,
  });
  Employee.belongsTo(User, {
    foreignKey: use_id,
  });

  await Employee.sync();

};

await establishAssociation();
process.exit();
