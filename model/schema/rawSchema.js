import { DataTypes, literal } from "sequelize";
import { goHashSync } from "../helper.js";

/**
 * use this format to create schema
 *
 * export const TestSchema = {
 *   name: "test",
 *   cols: {
 *     test: {
 *       type: DataTypes.INTEGER,
 *       defaultValue: 1,
 *     },
 *   },
 *   option: {
 *     tableName: "test",
 *   },
 * };
 */

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

export const CompanySchema = {
  name: "company",
  cols: {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
    },
    sorting: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: "排序編號",
    },
    uniform_number: {
      type: DataTypes.STRING(20),
      comment: "統編",
    },
    phone: {
      type: DataTypes.STRING(20),
      comment: "電話",
    },
    address: {
      type: DataTypes.TEXT("long"),
      comment: "地址",
    },
    contact_name: {
      type: DataTypes.STRING(100),
      comment: "聯絡人",
    },
  },
  option: {
    tableName: "company",
    comment: "公司",
  },
};

export const CompanyInvoiceSchema = {
  name: "company_invoice",
  cols: {
    company_id: {
      type: DataTypes.STRING(36),
      comment: "公司id",
      allowNull: false,
      references: {
        model: "company",
        key: "id",
      },
    },
    sorting: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: "排序編號",
    },
    uniform_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: "統編",
    },
    phone: {
      type: DataTypes.STRING(20),
      comment: "電話",
    },
    email: {
      type: DataTypes.STRING(20),
      comment: "電郵",
    },
    address: {
      type: DataTypes.TEXT("long"),
      comment: "地址",
    },
  },
  option: {
    tableName: "company_invoice",
    comment: "公司發票資訊",
  },
};

export const ContactTypeSchema = {
  name: "contact_type",
  cols: {
    sorting: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: "排序編號",
    },
    is_enable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "是否啟用",
    },
  },
  option: {
    tableName: "contact_type",
    comment: "聯絡方式",
  },
};

export const SettingSchema = {
  name: "setting",
  cols: {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
    },
    value: {
      type: DataTypes.TEXT("long"),
      comment: "值",
    },
  },
  option: {
    tableName: "setting",
  },
};

export const CountrySchema = {
  name: "country",
  cols: {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      comment: "國籍ID",
    },
    sorting: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: "排序編號",
    },
    code: {
      type: DataTypes.STRING(20),
      unique: true,
      comment: "編號",
    },
    short_name: {
      type: DataTypes.STRING(100),
      comment: "簡稱",
    },
    phone_code: {
      type: DataTypes.STRING(20),
      comment: "電話國碼",
    },
  },
  option: {
    tableName: "country",
    comment: "國籍",
  },
};

export const CitySchema = {
  name: "city",
  cols: {
    country_id: {
      type: DataTypes.STRING(36),
      comment: "國家ID",
    },
    sorting: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: "排序編號",
    },
  },
  option: {
    tableName: "city",
    comment: "城市",
  },
};

export const LangSchema = {
  name: "lang",
  cols: {
    country_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      index: true,
      comment: "國籍ID",
    },
    sorting: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: "排序編號",
    },
  },
  option: {
    tableName: "lang",
    comment: "語系",
  },
};

export const CurrenciesSchema = {
  name: "currencies",
  cols: {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      comment: "幣別ID",
    },
    country_id: {
      type: DataTypes.STRING(36),
      index: true,
      comment: "國籍ID",
    },
    sorting: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: "排序編號",
    },
  },
  option: {
    tableName: "currencies",
    comment: "幣別",
  },
};

//--------- regular Schemas above ---

//--------- junction schema below ---

//--------- junction schema above ---
