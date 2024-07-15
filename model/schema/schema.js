import { DataTypes } from "sequelize";
import * as Schemas from "./rawSchema.js";
import { objectAppender } from "../helper.js";

const getFixedField = (schemaName) => ({
  highOrderCols: {
    code: {
      type: DataTypes.STRING(100),
    },
    ...(!schemaName.includes("_") && {
      name: {
        type: DataTypes.STRING(100),
        comment: "名稱",
        allowNull: false,
        validate: {
          len: [2, 35],
        },
      },
      sorting: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: "排序編號",
        validate: {
          isInt: true,
        },
      },
    }),
  },
  cols: {
    description: {
      type: DataTypes.TEXT("long"),
      comment: "備註",
    },
    create_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "建立者ID",
    },
    create_name: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "建立者名稱",
    },
    modify_id: {
      type: DataTypes.TEXT,
      comment: "修改者ID",
    },
    modify_name: {
      type: DataTypes.TEXT,
      comment: "修改名稱",
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
  (dict, [schemaName, schemaContent]) => {
    const fixedField = getFixedField(schemaName);
    return {
      ...dict,
      [schemaName]: {
        ...schemaContent,
        cols: {
          ...(schemaContent.cols.id && { id: schemaContent.cols.id }),
          ...fixedField.highOrderCols,
          ...objectAppender(schemaContent.cols, fixedField.cols),
        },
        option: {
          ...getFixedField(schemaName).option,
          ...schemaContent.option,
        },
      },
    };
  },
  {}
);

export default processedSchemas;
