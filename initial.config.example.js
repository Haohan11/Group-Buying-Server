/** If your files is ready, you can just uncomment below in your initial.config.js */

// import indexItem from "./insert-data/indexItem.js";
// import userData from "./insert-data/userData.js";
// import extraData from "./insert-data/extraData.js";

// const config = {
//   generateTable: true,
//   indexItem,
//   user: {
//     data: userData,
//     unique: ["account"],
//   },
//   insertData: extraData,
//   showSequelizeLog: false,
// };

// export default config;

/** If your files is ready, you can just uncomment above in your initial.config.js */

const configDescription = {
  // 是否自動產生資料表 
  generateTable: true,

  // 自動新增作業項
  indexItem: [
    {
      name: "會員管理",
      icon: "people",
      route: "member",
      indexItems: [
        { route: "management", name: "會員管理" },
        { route: "tag", name: "會員標籤維護" },
        { route: "grade", name: "會員等級維護" },
        { route: "identity", name: "會員身分別維護" },
      ],
    },
  ],

  // 自動新增使用者
  user: {
    data: {
      user_type: 0,
      account: "admin",
      name: "admin",
      create_name: "system",
      create_id: "system",
      modify_name: "system",
      modify_id: "system",
      password: "123456",
    },

    // 刪除使用者資料的索引欄位，例如給予 account 則會刪除 account 為 admin 的資料
    // 未提供時會直接建立新的使用者
    unique: ["account"],
  },

  // 自動新增資料
  insertData: {
    payment_method: {

      // generateTable: true 時使用的資料表名稱
      modelName: "payment",

      // rawSchema.js 中設定的資料表名稱 (自動去除 Schema 後綴)
      // generateTable: false 時自動產生 sequelize Model
      schemaName: "Payment",
      data: [
        {
          name: "現金",
        },
        {
          name: "支票",
        },
        {
          name: "匯款",
        },
      ],

      // 是否刪除舊資料
      destroy: true,

      // 自訂的作者資料
      author: {
        create_id: "admin",
        create_name: "admin",
        modify_id: "admin",
        modify_name: "admin",
      },
    },
  },

  // 顯示 sequelize 訊息
  showSequelizeLog: false,
};