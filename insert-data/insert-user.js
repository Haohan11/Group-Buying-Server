import Schemas from "../model/schema/schema.js";
import userData from "./data/user.js";
import insertData from "./insert-data.js";

const { UserSchema } = Schemas;
const result = await insertData(UserSchema, userData);
console.log(result);

process.exit();
