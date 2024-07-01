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

export const CompanySchema = {
  name: "company",
  cols: {
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
  },
  option: {
    tableName: "lang",
    comment: "語系",
  },
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
    payment_type_id: {
      type: DataTypes.STRING(36),
      index: true,
      comment: "付款方式ID",
    },
  },
  option: {
    tableName: "payment",
  },
};

export const AccountMethodSchema = {
  name: "account_method",
  cols: {
  },
  option: {
    tableName: "account_method",
    comment: "結帳方式",
  },
};

export const departmentSchema = {
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

export const countyDistrictSchema = {
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

export const personTitleSchema = {
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
  name: "user",
  cols: {
    company_id: {
      type: DataTypes.STRING(36),
      comment: "隸屬公司",
    },
    account: {
      type: DataTypes.TEXT("long"),
      comment: "帳號",
    },
    password: {
      type: DataTypes.TEXT("long"),
      comment: "密碼",
      set(value) {
        this.setDataValue("password", goHashSync(value));
      }      
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
};

export const MemberGradeSchema = {
  name: "member_grade",
  cols: {},
  option: {
    tableName: "member_grade",
    comment: "會員等級",
  },
};

export const MemberRoleSchema = {
  name: "member_role",
  cols: {},
  option: {
    tableName: "member_role",
    comment: "會員角色",
  },
};

export const PermissionSchema = {
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

export const PermissionTypeSchema = {
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
};

export const StockCategorySchema = {
  name: "stock_category",
  cols: {
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
      }
    },
    parent: {
      type: DataTypes.STRING(36),
      comment: "隸屬於",
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

export const StockSchema = {
  name: "stock",
  cols: {
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
    },
    stock_length: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "商品(長)",
      allowNull: false,
    },
    stock_width: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "商品(寬)",
      allowNull: false,
    },
    stock_height: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "商品(高)",
      allowNull: false,
    },
    stock_weight: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "商品(重)",
      allowNull: false,
    },
    is_serial_stock: {
      type: DataTypes.BOOLEAN,
      defaultValue: 0,
      comment: "是否為序號商品",
      allowNull: false,
    },
    is_consignment: {
      type: DataTypes.BOOLEAN,
      defaultValue: 0,
      comment: "是否為寄賣品",
      allowNull: false,
    },
    is_gift: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "是否為贈品",
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
    tableName: "stock",
    comment: "商品主檔",
  },
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
      allowNull: false,
      comment: "貨幣ID",
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
};

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

//--------- regular Schemas above ---

//--------- junction schema below ---

//--------- junction schema above ---
