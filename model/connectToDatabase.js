import dotenv from "dotenv";
import { Sequelize } from "sequelize";

const connectToDataBase = async () => {
  dotenv.config();
  const { DB_NAME, DB_USERNAME, DB_PASSWORD, DB_HOST, DB_PORT } = process.env;

  const sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: "mysql",
  });

  try {
    await sequelize.authenticate();
    // console.log('Connection has been established successfully.');
    return sequelize;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

export default connectToDataBase;