const adminAuthor = {
  create_name: "admin",
  create_id: "admin",
  modify_name: "admin",
  modify_id: "admin",
};

const insertData = [
  {
    name: "payment_method",
    modelName: "payment",
    schemaName: "Payment",
    data: [
      {
        name: "現金",
        belong: "supplier",
      },
      {
        name: "支票",
        belong: "supplier",
      },
      {
        name: "匯款",
        belong: "supplier",
      },
    ],
    destroy: true,
    author: adminAuthor,
  },
  // {
  //   name: "account_method",
  //   modelName: "account_method",
  //   schemaName: "AccountMethod",
  //   data: [
  //     {
  //       name: "日結",
  //     },
  //     {
  //       name: "周結",
  //     },
  //     {
  //       name: "月結",
  //     },
  //     {
  //       name: "出貨前付款",
  //     },
  //   ],
  //   destroy: true,
  //   author: adminAuthor,
  // },
];

export default insertData;
