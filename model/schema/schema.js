import { DataTypes } from "sequelize";
import * as Schemas from "./rawSchema.js";

const getFixedField = (schemaName) => ({
  cols: {
    code: {
      type: DataTypes.STRING(100),
    },
    ...(!schemaName.includes("_")
      ? {
          name: {
            type: DataTypes.TEXT,
            allowNull: false,
          },
        }
      : {}),
    description: {
      type: DataTypes.TEXT("long"),
    },
    create_id: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    create_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    modify_id: {
      type: DataTypes.TEXT,
    },
    modify_name: {
      type: DataTypes.TEXT,
    },
  },
  option: {
    timestamps: true,
    createdAt: "create_time",
    updatedAt: "modify_time",
    getterMethods: {
      create_time() {
        return this.getDataValue("create_time")
          ?.toISOString()
          ?.replace(/T/, " ")
          ?.replace(/\..+/, "")
          ?.replace(/-/g, "/");
      },
      modify_time() {
        return this.getDataValue("modify_time")
          ?.toISOString()
          ?.replace(/T/, " ")
          ?.replace(/\..+/, "")
          ?.replace(/-/g, "/");
      },
    },
  },
});

const processedSchemas = Object.entries(Schemas).reduce(
  (dict, [schemaName, schemaContent]) => ({
    ...dict,
    [schemaName]: {
      ...schemaContent,
      cols: {
        ...getFixedField(schemaName).cols,
        ...schemaContent.cols,
      },
      option: {
        ...getFixedField(schemaName).option,
        ...schemaContent.option,
      },
    },
  }),
  {}
);

export default processedSchemas;
