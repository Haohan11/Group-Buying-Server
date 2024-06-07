import { DataTypes } from "sequelize";
import { goHashSync } from "../helper.js";

//--------- regular Schemas below ---
export const TestSchema = {
  name: "test",
  cols: {
    test: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
  },
  option: {
    tableName: "test",
  },
};


//--------- regular Schemas above ---

//--------- junction schema below ---

//--------- junction schema above ---
