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
        id: "uuid_placeholder",
        name: "現金",
        belong: "supplier",
      },
      {
        id: "uuid_placeholder",
        name: "支票",
        belong: "supplier",
      },
      {
        id: "uuid_placeholder",
        name: "匯款",
        belong: "supplier",
      },
    ],
    destroy: false,
    author: adminAuthor,
  },
  // {
  //   name: "company",
  //   modelName: "company",
  //   schemaName: "Company",
  //   data: [
  //     {
  //       id: "none",
  //       name: "holder for no company",
  //     },
  //   ],
  //   destroy: false,
  // },
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
