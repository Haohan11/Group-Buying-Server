const data = [
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
  {
    name: "商品管理",
    icon: "box",
    route: "stock",
    indexItems: [
      { route: "management", name: "商品維護" },
      { route: "category", name: "商品類別維護" },
      { route: "brand", name: "商品品牌維護" },
      { route: "accounts", name: "記帳分類維護" },
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
];

export default data;
