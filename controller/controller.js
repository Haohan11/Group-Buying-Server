const controllers = [
  {
    path: "stock",
    actions: {
      read: [
        async (req, res) =>
          res.response(200, "In Stock route.", {
            total: 0,
            totalPages: 0,
            list: [],
          }),
      ],
    },
  },
  {
    path: "stock-category",
    actions: {
      read: [
        async (req, res) =>
          res.response(200, "In stock-category route.", {
            total: 1,
            totalPages: 1,
            list: [
              {
                id: 1,
                name: "零食",
              },
              {
                id: 2,
                name: "飲料",
              },
              {
                id: 3,
                name: "用品",
              },
              {
                id: 4,
                name: "其他",
              },
            ],
          }),
      ],
    },
  },
  {
    path: "stock-serial",
    actions: {
      read: [
        async (req, res) =>
          res.response(200, "In stock-serial route.", {
            total: 1,
            totalPages: 1,
            list: [
              {
                id: 1,
                name: "用品",
              },
              {
                id: 2,
                name: "雜貨",
              },
              {
                id: 3,
                name: "飲品",
              },
            ],
          }),
      ],
    },
  },
  {
    path: "supplier",
    actions: {
      read: [
        async (req, res) =>
          res.response(200, "In supplier route.", {
            total: 1,
            totalPages: 1,
            list: [
              {
                id: 1,
                name: "麥當勞",
              },
              {
                id: 2,
                name: "肯德基",
              },
              {
                id: 3,
                name: "星巴克",
              },
            ],
          }),
      ],
    },
  },
  {
    path: "accounting",
    actions: {
      read: [
        async (req, res) =>
          res.response(200, "In accounting route.", {
            total: 1,
            totalPages: 1,
            list: [
              {
                id: 1,
                name: "自己記",
              },
              {
                id: 2,
                name: "小寶記",
              },
              {
                id: 3,
                name: "豪子記",
              },
            ],
          }),
      ],
    },
  },
];

export { controllers };
