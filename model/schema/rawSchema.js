import { DataTypes } from "sequelize";
import { goHashSync } from "../helper.js";
import { randomUUID } from "crypto";

/**
 * Returns an object representing a column with a UUID primary key.
 *
 * @param {Object} fields - Additional fields to include in the column object.
 * @return {Object} An object representing a column with a UUID primary key.
 */
const getUUIdCol = (fields = {}) => ({
  type: DataTypes.STRING(36),
  primaryKey: true,
  set(target) {
    this.setDataValue(
      "id",
      typeof target !== "string" || target === "uuid_placeholder"
        ? randomUUID()
        : target.trim()
    );
  },
  ...fields,
});

/**
 * use this format to create schema
 *
 * export const TestSchema = {
 *   order: 1,
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
 *
 * greater order will be handle first in initializer.js.
 *
 * Junction Schema should match the name format
 *  `Table1_Table2Schema`
 * for auto remove name col in Schema.js.
 */

const getCompany_idFK = (targetTable = "Company") => ({
  targetTable,
  option: {
    foreignKey: {
      name: "company_id",
      type: DataTypes.STRING(36),
      comment: "對應的公司ID",
      allowNull: false,
    },
  },
});

const getCountry_idFK = (targetTable = "Country") => ({
  targetTable,
  option: {
    foreignKey: {
      name: "country_id",
      type: DataTypes.STRING(36),
      comment: "對應的國家ID",
      allowNull: false,
    },
  },
});

const getMember_idFK = (targetTable = "Member") => ({
  targetTable,
  option: {
    foreignKey: {
      name: "member_id",
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "會員ID",
    },
  },
});

const getStock_idFK = (targetTable = "Stock") => ({
  targetTable,
  option: {
    foreignKey: {
      name: "stock_id",
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "商品id",
    },
  },
});

const getStockCategory_idFK = (targetTable = "StockCategory") => ({
  targetTable,
  option: {
    foreignKey: {
      name: "stock_category_id",
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "商品類別id",
    },
  },
});

const getSale_idFK = (targetTable = "Sale") => ({
  targetTable,
  option: {
    foreignKey: {
      name: "sale_id",
      type: DataTypes.STRING(13),
      allowNull: false,
      comment: "銷售單ID",
    },
  },
});

const getSaleDetail_idFK = (targetTable = "SaleDetail") => ({
  targetTable,
  option: {
    foreignKey: {
      name: "sale_detail_id",
      type: DataTypes.STRING(36),
      comment: "銷售單明細ID",
    },
  },
});

const getMemberContactPerson_idFK = (targetTable = "MemberContactPerson") => ({
  targetTable,
  option: {
    foreignKey: {
      name: "member_contact_person_id",
      type: DataTypes.STRING(36),
      comment: "收貨人ID",
    },
  },
});

const getDelivery_idFK = (targetTable = "Delivery") => ({
  targetTable,
  option: {
    foreignKey: {
      name: "delivery_id",
      type: DataTypes.STRING(36),
      comment: "寄送方式ID",
    },
  },
});

export const CompanySchema = {
  name: "company",
  cols: {
    id: getUUIdCol(),
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
    title: {
      type: DataTypes.STRING(100),
      comment: "公司抬頭",
    },
  },
  option: {
    tableName: "company",
    comment: "公司",
  },
  hasMany: [
    ...["User", "Member", "Supplier", "StockAccounting", "StockBrand"].map(
      getCompany_idFK
    ),
  ],
};

export const CompanyInvoiceSchema = {
  name: "company_invoice",
  cols: {
    company_id: {
      type: DataTypes.STRING(36),
      comment: "公司id",
      allowNull: false,
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
      validate: {
        isEmail: true,
      },
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
    id: getUUIdCol(),
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
  hasMany: [
    ...[
      "City",
      "Lang",
      "Currencies",
      "Member",
      "MemberContactPerson",
      "Supplier",
      "SupplierContactPerson",
      "TaxType",
      "StockPrice",
    ].map(getCountry_idFK),
  ],
};

export const CitySchema = {
  name: "city",
  cols: {
    country_id: {
      type: DataTypes.STRING(36),
      comment: "國家ID",
    },
  },
  option: {
    tableName: "city",
    comment: "城市",
  },
  belongsTo: [getCountry_idFK()],
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
  },
  option: {
    tableName: "lang",
    comment: "語系",
  },
  belongsTo: [getCountry_idFK()],
};

export const CurrenciesSchema = {
  name: "currencies",
  cols: {
    country_id: {
      type: DataTypes.STRING(36),
      index: true,
      comment: "國籍ID",
    },
  },
  option: {
    tableName: "currencies",
    comment: "幣別",
  },
  belongsTo: [getCountry_idFK()],
};

export const PaymentTypeSchema = {
  name: "payment_type",
  cols: {},
  option: {
    tableName: "payment_type",
    comment: "付款方式類別維護",
  },
};

export const PaymentSchema = {
  name: "payment",
  cols: {
    id: getUUIdCol(),
    payment_type_id: {
      type: DataTypes.STRING(36),
      index: true,
      comment: "付款方式類別ID",
    },
    belong: {
      type: DataTypes.STRING(50),
      comment: "所屬",
    },
  },
  option: {
    tableName: "payment",
  },
};

export const AccountMethodSchema = {
  name: "account_method",
  cols: {},
  option: {
    tableName: "account_method",
    comment: "結帳方式",
  },
};

export const DepartmentSchema = {
  name: "department",
  cols: {
    company_id: {
      type: DataTypes.STRING(36),
      comment: "隸屬公司",
    },
    parent: {
      type: DataTypes.STRING(36),
      index: true,
      comment: "父類別ID",
    },
  },
  option: {
    tableName: "department",
    comment: "部門",
  },
};

export const GetNoSchema = {
  name: "get_no",
  cols: {
    from_id: {
      type: DataTypes.STRING(36),
      comment: "來源id",
    },
    code_type: {
      type: DataTypes.STRING(50),
      comment: "編號類型",
    },
    code_date: {
      type: DataTypes.DATE,
      comment: "編號產生日期",
    },
  },
  option: {
    tableName: "get_no",
    comment: "取得編號用的Table",
  },
};

export const CodeTypeSchema = {
  name: "code_type",
  cols: {
    description: {
      type: DataTypes.TEXT("long"),
      comment: "單號說明",
    },
  },
  option: {
    tableName: "code_type",
    comment: "代號Table",
  },
};

export const MediaTypeSchema = {
  name: "media_type",
  cols: {},
  option: {
    tableName: "media_type",
    comment: "媒體檔案類型",
  },
};

export const CountyDistrictSchema = {
  name: "county_district",
  cols: {
    county: {
      type: DataTypes.STRING(100),
      comment: "縣市",
    },
    zip: {
      type: DataTypes.STRING(10),
      comment: "郵遞區號",
    },
    district: {
      type: DataTypes.STRING(100),
      comment: "分區",
    },
  },
  option: {
    tableName: "county_district",
    comment: "台灣縣市分區",
  },
};

export const SexSchema = {
  name: "sex",
  cols: {},
  option: {
    tableName: "sex",
    comment: "性別",
  },
};

export const PersonTitleSchema = {
  name: "person_title",
  cols: {},
  option: {
    tableName: "person_title",
    comment: "稱謂",
  },
};

export const CareerSchema = {
  name: "career",
  cols: {},
  option: {
    tableName: "career",
    comment: "職業",
  },
};

export const TagTypeSchema = {
  name: "tag_type",
  cols: {
    color: {
      type: DataTypes.STRING(10),
      comment: "顏色",
    },
  },
  option: {
    tableName: "tag_type",
    comment: "標籤類別",
  },
};

export const TagSchema = {
  name: "tag",
  cols: {
    tag_type_id: {
      type: DataTypes.STRING(36),
      comment: "標籤類別ID",
    },
    name: {
      type: DataTypes.STRING(100),
      comment: "issue名稱",
    },
  },
  option: {
    tableName: "tag",
    comment: "標籤",
  },
};

export const UserSchema = {
  order: 1,
  name: "user",
  cols: {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    company_id: {
      type: DataTypes.STRING(36),
      comment: "隸屬公司",
      allowNull: false,
    },
    account: {
      type: DataTypes.TEXT("long"),
      comment: "帳號",
      allowNull: false,
    },
    password: {
      type: DataTypes.TEXT("long"),
      comment: "密碼",
      allowNull: false,
      set(value) {
        this.setDataValue("password", goHashSync(value));
      },
    },
    remember_token: {
      type: DataTypes.TEXT("long"),
      comment: "E-mail",
    },
    is_enable: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: "已啟用",
    },
    user_type: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: "帳號來源: 0:system,1:business,2:employee,3:member",
    },
    email: {
      type: DataTypes.TEXT("long"),
      comment: "E-mail",
      validate: {
        isEmail: true,
      },
    },
    email_verified_time: {
      type: DataTypes.DATE,
      comment: "E-mail驗證時間",
    },
  },
  option: {
    tableName: "user",
    comment: "使用者",
  },
  hasOne: [
    {
      targetTable: "Member",
      option: {
        foreignKey: {
          name: "user_id",
          type: DataTypes.INTEGER.UNSIGNED,
          comment: "User ID",
        },
      },
    },
  ],
  belongsTo: [getCompany_idFK()],
};

/** Member Schema Begin */
export const MemberSchema = {
  order: 2,
  name: "member",
  cols: {
    id: getUUIdCol(),
    company_id: {
      type: DataTypes.STRING(36),
      comment: "對應的公司ID",
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      comment: "UserID",
    },
    status_id: {
      type: DataTypes.STRING(36),
      comment: "會員狀態ID",
    },
    member_role_id: {
      type: DataTypes.STRING(36),
      comment: "會員角色ID",
    },
    shipping_id: {
      type: DataTypes.STRING(36),
      comment: "出貨方式ID",
    },
    shipping_condition_id: {
      type: DataTypes.STRING(36),
      comment: "發貨條件ID",
    },
    member_type_id: {
      type: DataTypes.STRING(36),
      comment: "會員類別ID",
      allowNull: false,
    },
    member_level_id: {
      type: DataTypes.STRING(36),
      comment: "會員等級ID",
      allowNull: false,
    },
    recommend_member_id: {
      type: DataTypes.STRING(36),
      comment: "推薦會員ID",
    },
    country_id: {
      type: DataTypes.STRING(36),
      comment: "國家ID",
      allowNull: false,
    },
    payment_id: {
      type: DataTypes.STRING(36),
      comment: "付款方式",
    },
    sex_id: {
      type: DataTypes.STRING(36),
      comment: "性別ID",
      allowNull: false,
    },
    person_title_id: {
      type: DataTypes.STRING(36),
      comment: "職稱ID",
    },
    join_sale_point_id: {
      type: DataTypes.STRING(36),
      comment: "入會門市ID",
    },
    last_consume_sale_point_id: {
      type: DataTypes.STRING(36),
      comment: "最後消費門市ID",
    },
    name2: {
      type: DataTypes.TEXT("long"),
      comment: "名稱2",
    },
    card_no: {
      type: DataTypes.STRING(20),
      comment: "會員卡號",
    },
    uniform_number: {
      type: DataTypes.STRING(20),
      comment: "身份證字號",
    },
    phone: {
      type: DataTypes.STRING(20),
      comment: "電話",
    },
    phone2: {
      type: DataTypes.STRING(20),
      comment: "電話2",
    },
    mobile: {
      type: DataTypes.STRING(20),
      comment: "手機",
    },
    mobile2: {
      type: DataTypes.STRING(20),
      comment: "手機2",
    },
    email: {
      type: DataTypes.STRING(100),
      comment: "Email",
      validate: {
        isEmail: true,
      },
    },
    birthdate: {
      type: DataTypes.DATE,
      comment: "生日",
    },
    join_date: {
      type: DataTypes.DATE,
      comment: "入會日期",
      defaultValue: DataTypes.NOW,
    },
    upgrade_date: {
      type: DataTypes.DATE,
      comment: "升級日期",
    },
    last_consume_date: {
      type: DataTypes.DATE,
      comment: "最後消費日期",
    },
    accumulated_consumption: {
      type: DataTypes.DOUBLE,
      comment: "累積消費金額",
      defaultValue: 0,
    },
    accumulated_return: {
      type: DataTypes.DOUBLE,
      comment: "累積退貨金額",
      defaultValue: 0,
    },
    accumulated_revenue: {
      type: DataTypes.DOUBLE,
      comment: "累積業績金額",
      defaultValue: 0,
    },
    invoice_zip: {
      type: DataTypes.STRING(10),
      comment: "發票_郵遞區號",
    },
    invoice_city: {
      type: DataTypes.STRING(10),
      comment: "發票_縣市",
    },
    invoice_area: {
      type: DataTypes.STRING(10),
      comment: "發票_鄉鎮市區",
    },
    invoice_street: {
      type: DataTypes.TEXT("long"),
      comment: "發票_街區",
    },
    invoice_floor: {
      type: DataTypes.STRING(20),
      comment: "發票_樓",
    },
    invoice_room: {
      type: DataTypes.STRING(20),
      comment: "發票_室",
    },
    invoice_address: {
      type: DataTypes.TEXT("long"),
      comment: "發票_地址",
    },
    contact_zip: {
      type: DataTypes.STRING(10),
      comment: "聯絡_郵遞區號",
    },
    contact_city: {
      type: DataTypes.STRING(10),
      comment: "聯絡_縣市",
    },
    contact_area: {
      type: DataTypes.STRING(10),
      comment: "聯絡_鄉鎮市區",
    },
    contact_street: {
      type: DataTypes.TEXT("long"),
      comment: "聯絡_街區",
    },
    contact_floor: {
      type: DataTypes.STRING(20),
      comment: "聯絡_樓",
    },
    contact_room: {
      type: DataTypes.STRING(20),
      comment: "聯絡_室",
    },
    contact_address: {
      type: DataTypes.TEXT("long"),
      comment: "聯絡_地址",
      set(value) {
        const contact_city = this.getDataValue("contact_city");
        const contact_area = this.getDataValue("contact_area");
        const contact_street = this.getDataValue("contact_street");
        this.setDataValue(
          "contact_address",
          value === "auto"
            ? [contact_city, contact_area, contact_street].every(
                (data) => typeof data === "string"
              )
              ? [contact_city, contact_area, contact_street].join(" ")
              : null
            : value
        );
      },
    },
  },
  option: {
    tableName: "member",
    comment: "會員",
  },
  hasMany: [
    ...["MemberContactPerson", "MemberContactType", "MemberMeta", "Sale"].map(
      getMember_idFK
    ),
  ],
  belongsTo: [
    {
      targetTable: "User",
      option: {
        foreignKey: {
          name: "user_id",
          type: DataTypes.INTEGER.UNSIGNED,
          comment: "User ID",
        },
      },
    },
    getCompany_idFK(),
    getCountry_idFK(),
  ],
};

export const MemberMetaSchema = {
  name: "member_meta",
  omitName: true,
  cols: {
    member_id: {
      type: DataTypes.STRING(36),
      comment: "會員ID",
    },
    meta_key: {
      type: DataTypes.STRING(1000),
      comment: "欄位名稱",
    },
    meta_value: {
      type: DataTypes.TEXT("long"),
      comment: "欄位值",
    },
  },
  option: {
    tableName: "member_meta",
    comment: "會員類別",
  },
  belongsTo: [getMember_idFK()],
};

export const MemberTypeSchema = {
  name: "member_type",
  cols: {},
  option: {
    tableName: "member_type",
    comment: "會員類別",
  },
};

export const MemberPointSchema = {
  name: "member_point",
  cols: {
    member_id: {
      type: DataTypes.STRING(36),
      comment: "會員ID",
    },
    point: {
      type: DataTypes.DOUBLE,
      comment: "點數",
    },
    expire_date: {
      type: DataTypes.DATE,
      comment: "失效日期",
    },
  },
  option: {
    tableName: "member_point",
    comment: "會員點數",
  },
};

export const MemberContactTypeSchema = {
  name: "member_contact_type",
  omitName: true,
  cols: {
    member_id: {
      type: DataTypes.STRING(36),
      comment: "會員ID",
    },
    contact_type_id: {
      type: DataTypes.STRING(36),
      comment: "連絡方式ID",
    },
    im_visible_id: {
      type: DataTypes.STRING(100),
      comment: "如果是通訊軟體 則填入表面可看的到的ID",
    },
    im_id: {
      type: DataTypes.STRING(100),
      comment: "如果是通訊軟體 則填入程式才看的到的ID",
    },
    is_register: {
      type: DataTypes.BOOLEAN,
      comment: "此聯絡方式是否已註冊(開通)",
    },
    register_date: {
      type: DataTypes.DATE(6),
      comment: "註冊時間",
    },
    unregister_date: {
      type: DataTypes.DATE(6),
      comment: "取消註冊時間",
    },
    picture: {
      type: DataTypes.TEXT("long"),
      comment: "圖片",
    },
    last_active_date: {
      type: DataTypes.DATE(6),
      comment: "上次互動時間",
    },
  },
  option: {
    tableName: "member_contact_type",
    comment: "會員聯絡方式",
  },
  belongsTo: [getMember_idFK()],
};

export const MemberContactPersonSchema = {
  name: "member_contact_person",
  cols: {
    id: getUUIdCol(),
    member_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "會員ID",
    },
    country_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "國籍ID",
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "名稱",
    },
    name2: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "簡稱",
    },
    email: {
      type: DataTypes.STRING(100),
      comment: "電子郵件",
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      comment: "電話",
    },
    phone2: {
      type: DataTypes.STRING(20),
      comment: "電話2",
    },
    mobile: {
      type: DataTypes.STRING(20),
      comment: "手機",
    },
    mobile2: {
      type: DataTypes.STRING(20),
      comment: "手機2",
    },
    uniform_number: {
      type: DataTypes.STRING(20),
      comment: "統一編號",
    },
    residential_address: {
      type: DataTypes.TEXT("long"),
      comment: "居住地址",
    },
    contact_zip: {
      type: DataTypes.STRING(10),
      comment: "聯絡_郵遞區號",
    },
    contact_city: {
      type: DataTypes.STRING(10),
      comment: "聯絡_縣市",
    },
    contact_area: {
      type: DataTypes.STRING(10),
      comment: "聯絡_鄉鎮市區",
    },
    contact_street: {
      type: DataTypes.TEXT("long"),
      comment: "聯絡_街區",
    },
    contact_floor: {
      type: DataTypes.STRING(20),
      comment: "聯絡_樓",
    },
    contact_room: {
      type: DataTypes.STRING(20),
      comment: "聯絡_室",
    },
    contact_address: {
      type: DataTypes.TEXT("long"),
      comment: "聯絡_地址",
      set(value) {
        const contact_city = this.getDataValue("contact_city");
        const contact_area = this.getDataValue("contact_area");
        const contact_street = this.getDataValue("contact_street");
        this.setDataValue(
          "contact_address",
          value === "auto"
            ? [contact_city, contact_area, contact_street].every(
                (data) => typeof data === "string"
              )
              ? [contact_city, contact_area, contact_street].join(" ")
              : null
            : value
        );
      },
    },
    is_save: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "是否顯示為儲存",
    },
  },
  option: {
    tableName: "member_contact_person",
    comment: "供應商-連絡人",
  },
  hasMany: [getMemberContactPerson_idFK("SaleDetailDelivery")],
  belongsTo: [getCountry_idFK(), getMember_idFK()],
};

export const Member_TagSchema = {
  name: "member_tag",
  cols: {
    member_id: {
      type: DataTypes.STRING(36),
      comment: "會員ID",
    },
    tag_id: {
      type: DataTypes.STRING(36),
      comment: "tagID",
    },
  },
  option: {
    tableName: "member_tag",
    comment: "會員點數",
  },
};

export const MemberShippingSchema = {
  name: "member_shipping",
  cols: {
    id: getUUIdCol(),
  },
  option: {
    tableName: "member_shipping",
    comment: "會員出貨方式",
  },
};

export const MemberLevelSchema = {
  name: "member_level",
  cols: {
    id: getUUIdCol(),
  },
  option: {
    tableName: "member_level",
    comment: "會員等級",
  },
};

export const MemberRoleSchema = {
  name: "member_role",
  cols: {
    id: getUUIdCol(),
  },
  option: {
    tableName: "member_role",
    comment: "會員角色",
  },
};

/** Member Schema End */

/** Stock price according to member level */
export const Level_PriceSchema = {
  name: "level_price",
  cols: {
    stock_id: {
      type: DataTypes.STRING(36),
    },
    member_level_id: {
      type: DataTypes.STRING(36),
    },
    price: {
      type: DataTypes.INTEGER,
    },
  },
  option: {
    tableName: "level_price",
    comment: "會員等級價格",
  },
  belongsTo: [getStock_idFK()],
};

/** Stock price according to member role */
export const Role_PriceSchema = {
  name: "role_price",
  cols: {
    stock_id: {
      type: DataTypes.STRING(36),
    },
    member_role_id: {
      type: DataTypes.STRING(36),
    },
    price: {
      type: DataTypes.INTEGER,
    },
  },
  option: {
    tableName: "role_price",
    comment: "會員角色價格",
  },
  belongsTo: [getStock_idFK()],
};

const PermissionSchema = {
  name: "permission",
  cols: {
    permission_type_id: {
      type: DataTypes.INTEGER,
    },
    parent_id: {
      type: DataTypes.INTEGER,
    },
  },
  option: {
    tableName: "permission",
  },
  belongsToMany: [
    {
      targetTable: "Role",
      option: {
        through: "Role_Permission",
        foreignKey: "permission_id",
        otherKey: "role_id",
      },
    },
  ],
};

const PermissionTypeSchema = {
  name: "permission_type",
  cols: {
    is_create: {
      type: DataTypes.BOOLEAN,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
    },
    is_update: {
      type: DataTypes.BOOLEAN,
    },
    is_delete: {
      type: DataTypes.BOOLEAN,
    },
  },
  option: {
    tableName: "permission_type",
  },
};

/** Supplier Schema Start */
export const SupplierTypeSchema = {
  name: "supplier_type",
  cols: {},
  option: {
    tableName: "supplier_type",
    comment: "供應商類別",
  },
};

export const SupplierSchema = {
  name: "supplier",
  cols: {
    id: getUUIdCol(),
    company_id: {
      type: DataTypes.STRING(36),
      comment: "隸屬公司",
      allowNull: false,
    },
    supplier_type_id: {
      type: DataTypes.STRING(36),
      comment: "供應商類別ID",
      allowNull: false,
    },
    country_id: {
      type: DataTypes.STRING(36),
      comment: "國籍ID",
      allowNull: false,
    },
    payment_id: {
      type: DataTypes.STRING(36),
      comment: "付款方式",
    },
    accounting_id: {
      type: DataTypes.STRING(36),
      comment: "結帳方式",
    },
    short_name: {
      type: DataTypes.STRING(100),
      comment: "簡稱",
    },
    phone: {
      type: DataTypes.STRING(20),
      comment: "電話",
    },
    mobile: {
      type: DataTypes.STRING(20),
      comment: "手機",
    },
    uniform_number: {
      type: DataTypes.STRING(20),
      comment: "統一編號",
    },
    contact_address: {
      type: DataTypes.TEXT("long"),
      comment: "聯絡地址",
    },
    contact_person: {
      type: DataTypes.STRING(36),
      comment: "聯絡人",
    },
  },
  option: {
    tableName: "supplier",
    comment: "供應商主檔",
  },
  hasMany: {
    targetTable: "Stock",
    option: {
      foreignKey: {
        name: "supplier_id",
        type: DataTypes.STRING(36),
        comment: "供應商ID",
      },
    },
  },
  belongsTo: [getCompany_idFK(), getCountry_idFK()],
};

export const SupplierContactPersonSchema = {
  name: "supplier_contact_person",
  cols: {
    supplier_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    country_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    name2: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
    },
    phone2: {
      type: DataTypes.STRING(20),
    },
    mobile: {
      type: DataTypes.STRING(20),
    },
    mobile2: {
      type: DataTypes.STRING(20),
    },
    uniform_number: {
      type: DataTypes.STRING(20),
    },
    residential_address: {
      type: DataTypes.TEXT("long"),
    },
    contact_address: {
      type: DataTypes.TEXT("long"),
    },
  },
  option: {
    tableName: "supplier_contact_person",
    comment: "供應商-連絡人",
  },
  belongsTo: [getCountry_idFK()],
};

export const SupplierContactTypeSchema = {
  name: "supplier_contact_type",
  cols: {
    supplier_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "供應商ID",
    },
    supplier_contact_person_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "連絡人ID",
    },
    contact_type_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "連絡方式ID",
    },
  },
  option: {
    tableName: "supplier_contact_type",
    comment: "供應商連絡方式",
  },
};

export const SupplierMetaSchema = {
  name: "supplier_meta",
  cols: {
    supplier_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "供應商ID",
    },
    meta_key: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      comment: "欄位名稱",
    },
    meta_value: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
      comment: "欄位值",
    },
  },
  option: {
    tableName: "supplier_meta",
    comment: "擴充supplier欄位用",
  },
};
/** Supplier Schema End */

export const TaxTypeSchema = {
  name: "tax_type",
  cols: {
    country_id: {
      type: DataTypes.STRING(36),
      comment: "國別",
      allowNull: false,
    },
  },
  option: {
    tableName: "tax_type",
    comment: "稅別",
  },
  belongsTo: [getCountry_idFK()],
};

export const TaxRateSchema = {
  name: "tax_rate",
  cols: {
    tax_type_id: {
      type: DataTypes.STRING(36),
      comment: "稅別ID",
      allowNull: false,
    },
    rate: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "稅率",
      allowNull: false,
    },
    start_time: {
      type: DataTypes.DATE,
      comment: "時間(起)",
      allowNull: false,
    },
    end_time: {
      type: DataTypes.DATE,
      comment: "時間(迄)",
    },
  },
  option: {
    tableName: "tax_rate",
    comment: "稅率的適用時間",
  },
};

export const MbflagTypeSchema = {
  name: "mbflag_type",
  cols: {},
  option: {
    tableName: "mbflag_type",
    comment: "商品屬性",
  },
};

/** Stock Schema Start */
export const StockSchema = {
  order: 3,
  name: "stock",
  cols: {
    id: getUUIdCol(),
    company_id: {
      type: DataTypes.STRING(36),
      comment: "隸屬公司",
      allowNull: false,
    },
    stock_brand_id: {
      type: DataTypes.STRING(36),
      comment: "商品品牌ID",
    },
    stock_category_id: {
      type: DataTypes.STRING(36),
      comment: "商品類別ID",
    },
    supplier_id: {
      type: DataTypes.STRING(36),
      comment: "供應商ID",
    },
    accounting_id: {
      type: DataTypes.STRING(36),
      comment: "記帳分類ID",
    },
    stock_unit_id: {
      type: DataTypes.STRING(36),
      comment: "商品單位ID",
      allowNull: false,
    },
    mbflag_type_id: {
      type: DataTypes.STRING(36),
      comment: "商品屬性",
      allowNull: false,
    },
    cover_image: {
      type: DataTypes.STRING(1024),
      comment: "商品封面圖",
      set(value) {
        this.setDataValue("cover_image", value ? value : undefined);
      },
    },
    tax_type_id: {
      type: DataTypes.STRING(36),
      comment: "稅別",
      allowNull: false,
    },
    short_name: {
      type: DataTypes.STRING(100),
      comment: "商品簡稱",
    },
    barcode: {
      type: DataTypes.STRING(1024),
      comment: "商品條碼",
      allowNull: false,
    },
    stock_length: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "商品(長)",
    },
    stock_width: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "商品(寬)",
    },
    stock_height: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "商品(高)",
    },
    stock_weight: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "商品(重)",
    },
    is_preorder: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "是否為預購商品",
    },
    is_serial_stock: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "是否為序號商品",
    },
    is_nostock_sell: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "是否負庫存銷售",
    },
    is_independent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "是否為獨立揀貨商品",
    },
    is_consignment: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "是否為寄賣品",
    },
    is_gift: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "是否為贈品",
    },
    is_valid: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "是否上架",
    },
    min_order: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: "最少訂購數",
    },
    order_step: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: "訂購倍數",
    },
    preorder_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "預購商品庫存",
      validate: {
        isInt: true,
      },
    },
    price: {
      type: DataTypes.INTEGER,
      comment: "商品售價",
      allowNull: false,
    },
    purchase_price: {
      type: DataTypes.INTEGER,
      comment: "進貨價",
      allowNull: false,
    },
    specification: {
      type: DataTypes.TEXT("long"),
      comment: "商品規格",
      allowNull: false,
    },
    introduction: {
      type: DataTypes.TEXT("long"),
      comment: "商品介紹",
    },
    short_desc: {
      type: DataTypes.TEXT("long"),
      comment: "簡單介紹",
    },
  },
  option: {
    tableName: "stock",
    comment: "商品主檔",
  },
  belongsTo: [
    {
      targetTable: "Supplier",
      option: {
        foreignKey: {
          name: "supplier_id",
          type: DataTypes.STRING(36),
          comment: "供應商ID",
        },
        onDelete: "RESTRICT",
      },
    },
    getStockCategory_idFK(),
  ],
  hasMany: [...["SaleDetail", "Level_Price", "Role_Price"].map(getStock_idFK)],
};

export const StockMediaSchema = {
  name: "stock_media",
  cols: {
    stock_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "商品id",
    },
    org_name: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
      comment: "原始檔名",
    },
    media_type: {
      type: DataTypes.STRING(5),
      allowNull: false,
      comment: "媒體類型(image,audio,video,other)",
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "媒體大小",
    },
  },
  option: {
    tableName: "stock_media",
    comment: "商品-媒體",
  },
};

export const StockMetaSchema = {
  name: "stock_meta",
  cols: {
    stock_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "商品ID",
    },
    meta_key: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      comment: "欄位名稱",
    },
    meta_value: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
      comment: "欄位值",
    },
  },
  option: {
    tableName: "stock_meta",
    comment: "stock擴充欄位",
  },
};

export const PriceTypeSchema = {
  name: "price_type",
  cols: {},
  option: {
    tableName: "price_type",
    comment: "價格表",
  },
};

export const StockPriceSchema = {
  name: "stock_price",
  cols: {
    stock_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "商品ID",
    },
    price_type_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "價格表ID",
    },
    country_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "國別",
    },
    currencies_id: {
      type: DataTypes.STRING(36),
      comment: "貨幣ID",
      allowNull: false,
    },
    price: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      allowNull: false,
      comment: "價格",
    },
    effective_date_start: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "價格生效日(起)",
    },
    effective_date_end: {
      type: DataTypes.DATE,
      comment: "價格生效日(迄)",
    },
  },
  option: {
    tableName: "stock_price",
    comment: "商品價格",
  },
  belongsTo: [getCountry_idFK()],
};

export const StockSerialSchema = {
  name: "stock_serial",
  cols: {
    stock_id: {
      type: DataTypes.STRING(36),
      comment: "商品ID",
      allowNull: false,
    },
    is_sold: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "已銷售",
      allowNull: false,
    },
    is_valid: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "是否上架",
      allowNull: false,
    },
  },
  option: {
    tableName: "stock_serial",
    comment: "序號商品",
  },
};

export const StockSerialMetaSchema = {
  name: "stock_serial_meta",
  cols: {
    stock_serial_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "序號商品ID",
    },
    meta_key: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      comment: "欄位名稱",
    },
    meta_value: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
      comment: "欄位值",
    },
  },
  option: {
    tableName: "stock_serial_meta",
    comment: "serial擴充欄位",
  },
};

export const StockSupplierSchema = {
  name: "stock_supplier",
  cols: {
    stock_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "商品ID",
    },
    supplier_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "供應商id",
    },
  },
  option: {
    tableName: "stock_supplier",
    comment: "商品相對應供應商",
  },
};

export const StockBomSchema = {
  name: "stock_bom",
  cols: {
    company_id: {
      type: DataTypes.STRING(36),
      comment: "隸屬公司",
      allowNull: false,
    },
    stock_id: {
      type: DataTypes.STRING(36),
      comment: "建立在商品那邊的ID",
      allowNull: false,
    },
  },
  option: {
    tableName: "stock_bom",
    comment: "組合商品(產生後會同步新增到stock)",
  },
};

export const StockBomDetailSchema = {
  name: "stock_bom_detail",
  cols: {
    stock_bom_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "組合商品ID",
    },
    stock_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "組成商品ID",
    },
    qty: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      allowNull: false,
      comment: "數量",
    },
  },
  option: {
    tableName: "stock_bom_detail",
    comment: "組合商品明細",
  },
};

export const StockBomMetaSchema = {
  name: "stock_bom_meta",
  cols: {
    stock_bom_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "組合商品ID",
    },
    meta_key: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      comment: "欄位名稱",
    },
    meta_value: {
      type: DataTypes.TEXT("long"),
      comment: "欄位值",
    },
  },
  option: {
    tableName: "stock_bom_meta",
    comment: "stock_bom擴充欄位",
  },
};

export const StockAccountingSchema = {
  name: "stock_accounting",
  cols: {
    name: {
      type: DataTypes.STRING(100),
      comment: "名稱",
      allowNull: false,
      validate: {
        len: [1, 35],
      },
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    company_id: {
      type: DataTypes.STRING(36),
      comment: "隸屬公司",
      allowNull: false,
    },
  },
  option: {
    tableName: "stock_accounting",
    comment: "記帳分類",
  },
  belongsTo: [getCompany_idFK()],
};

export const StockBrandSchema = {
  name: "stock_brand",
  cols: {
    company_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "隸屬公司",
    },
  },
  option: {
    tableName: "stock_brand",
    comment: "商品品牌",
  },
  belongsTo: [getCompany_idFK()],
};

export const StockCategorySchema = {
  name: "stock_category",
  cols: {
    id: getUUIdCol(),
    company_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "隸屬公司",
    },
    is_recommended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "是否為精選類別",
    },
    recommended_image: {
      type: DataTypes.STRING(1024),
      comment: "精選類別縮圖",
      set(value) {
        this.setDataValue("recommended_image", value ? value : undefined);
      },
    },
    parent: {
      type: DataTypes.STRING(36),
      comment: "隸屬類別ID",
      set(value) {
        this.setDataValue("parent", value ? value : null);
      },
    },
    tree_level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: "階層",
    },
  },
  option: {
    tableName: "stock_category",
    comment: "商品類別",
  },
  belongsTo: [
    {
      targetTable: "StockCategory",
      option: {
        foreignKey: {
          name: "parent",
          type: DataTypes.STRING(36),
          allowNull: true,
        },
        onDelete: "SET NULL",
      },
    },
  ],
  hasMany: [
    {
      targetTable: "StockCategory",
      option: {
        foreignKey: {
          name: "parent",
          type: DataTypes.STRING(36),
          allowNull: true,
        },
        onDelete: "SET NULL",
      },
    },
    getStockCategory_idFK("Stock"),
  ],
};

export const StockCategoryMediaSchema = {
  name: "stock_category_media",
  cols: {
    stock_category_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "類別id",
    },
    name: {
      type: DataTypes.STRING(1024),
      allowNull: false,
      comment: "媒體名稱",
    },
    org_name: {
      type: DataTypes.STRING(1024),
      allowNull: false,
      comment: "原始檔名",
    },
    media_type: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: "媒體類型 (image,audio,video)",
    },
  },
  option: {
    tableName: "stock_category_media",
    comment: "商品分類-媒體",
  },
};

export const StockUnitSchema = {
  name: "stock_unit",
  cols: {
    is_serial_type: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: "是否為序號商品單位",
    },
    rate: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: "換算倍率(ex. 1l = 1000ml)",
    },
  },
  option: {
    tableName: "stock_unit",
    comment: "商品單位",
  },
};
/** Stock Schema End */

export const WarehouseTypeSchema = {
  name: "warehouse_type",
  cols: {},
  option: {
    tableName: "warehouse_type",
    comment: "倉別屬性",
  },
};

export const WarehouseSchema = {
  name: "warehouse",
  cols: {
    company_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "隸屬公司",
    },
    warehouse_type_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "倉別屬性ID",
    },
  },
  option: {
    tableName: "warehouse",
    comment: "倉庫",
  },
};

export const InventorySchema = {
  name: "inventory",
  cols: {
    warehouse_id: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "倉別ID",
    },
    stock_id: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "商品ID",
    },
    stock_serial_id: {
      type: DataTypes.STRING,
      comment: "商品序號ID",
    },
    qty: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      allowNull: false,
      comment: "數量",
    },
  },
  option: {
    tableName: "inventory",
    comment: "商品庫存",
  },
};

export const InventoryLogSchema = {
  name: "inventory_log",
  cols: {
    warehouse_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "倉別ID",
    },
    stock_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "商品ID",
    },
    stock_serial_id: {
      type: DataTypes.STRING(36),
      comment: "商品序號ID",
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "異動日期",
    },
    before_qty: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "異動前",
    },
    qty: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "數量",
    },
    after_qty: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "異動後",
    },
  },
  option: {
    tableName: "inventory_log",
    comment: "商品庫存異動紀錄",
  },
};

export const SaleTypeSchema = {
  name: "sale_type",
  cols: {},
  option: {
    tableName: "sale_type",
    comment: "訂單類別",
  },
};

export const SaleSchema = {
  name: "sale",
  omitName: true,
  cols: {
    id: {
      type: DataTypes.STRING(13),
      primaryKey: true,
      comment: "銷售單ID",
    },
    company_id: {
      type: DataTypes.STRING(36),
      comment: "隸屬公司",
      allowNull: false,
    },
    sale_point_id: {
      type: DataTypes.STRING(36),
      comment: "門市ID",
      allowNull: false,
    },
    member_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "會員ID",
    },
    member_id_2b: {
      type: DataTypes.STRING(36),
      comment: "購買商家的ID",
    },
    main_receiver_id: {
      type: DataTypes.STRING(36),
      comment: "主收件人ID",
    },
    sale_type_id: {
      type: DataTypes.STRING(36),
      comment: "銷售單類型",
      allowNull: false,
    },
    partner_id: {
      type: DataTypes.STRING(36),
      comment: "夥伴ID",
    },
    currencies_id: {
      type: DataTypes.STRING(36),
      comment: "幣別ID",
      allowNull: false,
    },
    sale_related_id: {
      type: DataTypes.STRING(36),
      comment: "紀錄銷退或預購時相關的銷售單",
    },
    delivery_status_id: {
      type: DataTypes.STRING(36),
      defaultValue: "none",
      comment: "出貨狀態",
    },
    sale_date: {
      type: DataTypes.DATE,
      comment: "銷售日期",
      allowNull: false,
      get() {
        return this.getDataValue("sale_date")
          ?.toISOString()
          ?.replace(/T/, " ")
          ?.replace(/\..+/, "")
          ?.replace(/-/g, "/");
      },
    },
    exchange_rate: {
      type: DataTypes.DOUBLE,
      defaultValue: 1,
      comment: "匯率",
    },
    total_qty: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "商品總數量",
    },
    total_non_tax_amount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "未稅價",
    },
    total_tax: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "稅額",
    },
    total_tax_amount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "含稅總金額",
    },
    delivery_amount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "運費總金額",
    },
    service_charge: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "服務費",
    },
    is_payment: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: "是否付款",
    },
    payment_time: {
      type: DataTypes.DATE,
      comment: "付款時間",
    },
    is_pick: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: "是否撿貨",
    },
    pick_id: {
      type: DataTypes.STRING(36),
      comment: "撿貨人員ID",
    },
    pick_name: {
      type: DataTypes.STRING(20),
      comment: "撿貨人員名稱",
    },
    pick_time: {
      type: DataTypes.DATE,
      comment: "撿貨時間",
    },
    is_shipping: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: "是否出貨",
    },
    shipping_id: {
      type: DataTypes.STRING(36),
      comment: "出貨人員ID",
    },
    shipping_name: {
      type: DataTypes.STRING(20),
      comment: "出貨人員名稱",
    },
    shipping_time: {
      type: DataTypes.DATE,
      comment: "出貨時間",
    },
    is_finish: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: "是否完成",
    },
    is_print: {
      type: DataTypes.BOOLEAN,
      defaultValue: 0,
      comment: "是否列印",
    },
    print_time: {
      type: DataTypes.DATE,
      comment: "列印時間",
    },
    webpay_status: {
      type: DataTypes.BOOLEAN,
      comment: "線上支付是否完成(0:未完成;1:已完成)，NULL為不是線上支付",
    },
    waiting_sec: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "等待時間(秒)",
    },
  },
  option: {
    tableName: "sale",
    comment: "銷售單",
  },
  hasMany: [...["SaleDetail", "SaleDetailDelivery"].map(getSale_idFK)],
  belongsTo: [getCompany_idFK(), getMember_idFK()],
};

export const SaleDetailSchema = {
  name: "sale_detail",
  omitName: true,
  cols: {
    id: getUUIdCol(),
    sale_id: {
      type: DataTypes.STRING(13),
      allowNull: false,
      comment: "銷售單ID",
    },
    stock_id: {
      type: DataTypes.STRING(36),
      comment: "商品ID",
      allowNull: false,
    },
    stock_serial_id: {
      type: DataTypes.STRING(36),
      comment: "商品序號ID",
    },
    stock_price_id: {
      type: DataTypes.STRING(36),
      comment: "商品價格ID",
    },
    org_unit_price: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "原幣單價",
    },
    unit_price: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "單價",
    },
    discount_rate: {
      type: DataTypes.DOUBLE,
      defaultValue: 100,
      comment: "折扣",
    },
    discount_amount: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "折價",
    },
    price: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "售價",
    },
    qty: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "數量",
    },
    non_tax_amount: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "未稅價",
    },
    tax: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "稅額",
    },
    tax_amount: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "總金額",
    },
    is_free: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: "是否為贈品",
    },
    is_return: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: "是否為退回",
    },
  },
  option: {
    tableName: "sale_detail",
    comment: "銷售單明細",
  },
  hasMany: [getSaleDetail_idFK("SaleDetailDelivery")],
  belongsTo: [getSale_idFK(), getStock_idFK()],
};

export const SaleDetailDeliverySchema = {
  name: "sale_detail_delivery",
  omitName: true,
  cols: {
    id: getUUIdCol(),
    sale_id: {
      type: DataTypes.STRING(36),
      comment: "銷售單ID",
      allowNull: false,
    },
    sale_detail_id: {
      type: DataTypes.STRING(36),
      comment: "銷售單明細ID",
    },
    delivery_id: {
      type: DataTypes.STRING(36),
      comment: "運送方式ID",
    },
    est_delivery_date_start: {
      type: DataTypes.DATE,
      comment: "預計寄送日期(起)",
    },
    est_delivery_date_end: {
      type: DataTypes.DATE,
      comment: "預計寄送日期(迄)",
    },
    delivery_date: {
      type: DataTypes.DATE,
      comment: "寄送日期",
    },
    delivery_code: {
      type: DataTypes.STRING(100),
      comment: "物流單號",
    },
    amount: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "運送費用",
    },
    member_contact_person_id: {
      type: DataTypes.STRING(36),
      comment: "收件人ID",
    },
    receiver_name: {
      type: DataTypes.STRING(255),
      comment: "收件人姓名",
    },
    receiver_phone: {
      type: DataTypes.STRING(20),
      comment: "收件人電話",
    },
    receiver_email: {
      type: DataTypes.STRING(100),
      comment: "收件人email",
      validate: {
        isEmail: true,
      },
    },
    receiver_zip: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "收件地址_郵遞區號",
    },
    receiver_city: {
      type: DataTypes.STRING(20),
      comment: "收件地址_縣市",
    },
    receiver_area: {
      type: DataTypes.STRING(20),
      comment: "收件地址_鄉鎮市區",
    },
    receiver_street: {
      type: DataTypes.TEXT,
      comment: "收件地址_街區",
    },
    receiver_floor: {
      type: DataTypes.STRING(20),
      comment: "收件地址_樓",
    },
    receiver_room: {
      type: DataTypes.STRING(20),
      comment: "收件地址_室",
    },
    receiver_address: {
      type: DataTypes.STRING(1024),
      comment: "收件地址",
    },
    receiver_specify_date: {
      type: DataTypes.DATE,
      comment: "指定送達日",
    },
    receiver_time_period: {
      type: DataTypes.STRING(100),
      comment: "指定送達時段(1=>13點前 2=>14點到18點 3=>不指定)",
    },
    receiver_receive_date: {
      type: DataTypes.DATE,
      comment: "實際收到的日期",
    },
  },
  option: {
    tableName: "sale_detail_delivery",
    comment: "銷售單寄送資訊",
  },
  belongsTo: [
    getSale_idFK(),
    getSaleDetail_idFK(),
    getMemberContactPerson_idFK(),
    getDelivery_idFK(),
  ],
};

export const IndexItemTypeSchema = {
  name: "index_item_type",
  cols: {
    route: {
      type: DataTypes.STRING(100),
      comment: "父層路徑",
    },
    icon: {
      type: DataTypes.STRING(36),
      comment: "前面顯示的icon",
    },
  },
  option: {
    tableName: "index_item_type",
    comment: "首頁項目類別",
  },
};

export const IndexItemSchema = {
  name: "index_item",
  cols: {
    parent: {
      type: DataTypes.STRING(36),
      comment: "父類別ID",
    },
    index_item_type_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "項目類別ID",
    },
    route: {
      type: DataTypes.STRING(100),
      comment: "路徑名稱",
    },
    file_name: {
      type: DataTypes.STRING(100),
      comment: "檔案名稱",
    },
    table_name: {
      type: DataTypes.STRING(100),
      comment: "資料表名稱",
    },
    icon: {
      type: DataTypes.TEXT("long"),
      comment: "前面顯示的icon",
    },
    is_enable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: "是否已啟用",
    },
    is_create: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: "是否能建立",
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: "是否能讀取",
    },
    is_update: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: "是否能修改",
    },
    is_delete: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: "是否能刪除",
    },
  },
  option: {
    tableName: "index_item",
    comment: "首頁項目",
  },
};

export const DeliverySchema = {
  name: "delivery",
  cols: {
    id: getUUIdCol(),
    delivery_type_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      comment: "寄送方式屬性",
    },
  },
  option: {
    tableName: "delivery",
    comment: "寄送方式",
  },
  hasMany: [getDelivery_idFK("SaleDetailDelivery")],
};
