const data = [
  {
    name: "會員管理",
    icon: "people",
    route: "member",
    indexItems: [
      { route: "management", name: "會員管理", tableName: "member" },
      { route: "tag", name: "會員標籤維護", tableName: "member-tag" },
      { route: "grade", name: "會員等級維護", tableName: "member-grade" },
      { route: "identity", name: "會員身分別維護", tableName: "member-identity" },
    ],
  },
  {
    name: "商品管理",
    icon: "box",
    route: "stock",
    indexItems: [
      { route: "management", name: "商品維護", tableName: "stock" },
      { route: "category", name: "商品類別維護", tableName: "stock-category" },
      { route: "brand", name: "商品品牌維護", tableName: "stock-brand" },
      { route: "accounts", name: "記帳分類維護", tableName: "stock-accounts" },
    ],
  },
  {
    name: "庫存管理",
    icon: "box2",
    route: "inventory",
    indexItems: [
      { route: "management", name: "庫存盤點作業", tableName: "inventory" },
      { route: "transfer", name: "庫存調撥作業", tableName: "inventory-transfer" },
      { route: "warehouse", name: "倉別維護", tableName: "warehouse" },
    ],
  },
];

export default data;
