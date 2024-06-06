import connectToDataBase from "../model/connectToDatabase.js";
import createSchema from "../model/createSchema.js";

const insertData = async (schema, data) => {
  try {
    const sequelize = await connectToDataBase();
    const Table = createSchema(sequelize, schema);
    await Table.sync();
    await Table.create(data);
    return Table;
  } catch (error) {
    return error;
  }
};

export default insertData;
