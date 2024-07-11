const indexItem = [
  {
    name: "會員管理",
    icon: "people",
    route: "member",
    indexItems: [
      { route: "management", name: "會員管理" },
      { route: "tag", name: "會員標籤維護" },
      { route: "grade", name: "會員等級維護" },
      { route: "role", name: "會員身分別維護" },
      { route: "shipping", name: "出貨方式維護" },
      { route: "payment", name: "付款方式維護" },
    ],
  },
  {
    name: "商品管理",
    icon: "box",
    route: "stock",
    indexItems: [
      { route: "management", name: "商品維護" },
      { route: "category", name: "商品類別維護" },
      { route: "brand", name: "商品品牌維護" },
      { route: "accounting", name: "記帳分類維護" },
    ],
  },
  {
    name: "庫存管理",
    icon: "box2",
    route: "inventory",
    indexItems: [
      { route: "management", name: "庫存盤點作業" },
      { route: "transfer", name: "庫存調撥作業" },
      { route: "warehouse", name: "倉別維護" },
    ],
  },
  {
    name: "進貨管理",
    icon: "upc-scan",
    route: "purchase",
    indexItems: [
      { route: "management", name: "採購作業" },
      { route: "receive", name: "進貨作業" },
      { route: "arrival", name: "到貨作業" },
      { route: "select", name: "揀貨作業" },
      { route: "dispatch", name: "配貨作業" },
      { route: "supplier", name: "供應商管理" },
      { route: "type", name: "進貨類別作業" },
      { route: "accounting", name: "供應商結帳方式維護" },
    ],
  },
  {
    name: "訂單管理",
    icon: "receipt",
    route: "order",
    indexItems: [
      { route: "merge", name: "訂單彙整作業" },
      { route: "management", name: "訂單作業" },
      { route: "dispatch", name: "派送/廠出作業" },
      { route: "delivery", name: "出貨作業" },
      { route: "category", name: "訂單類別維護" },
    ],
  },
];

export default indexItem;