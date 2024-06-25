import multer from "multer";
import {
  authenticationMiddleware,
  addUserMiddleware,
} from "../middleware/middleware.js";

import { Op } from "sequelize";
import { queryParam2False, getPage } from "../model/helper.js";

const generalCreate = (tableName) => {
  return async (req, res) => {
    const Table = req.app[tableName];
    const data = { ...req.body, ...req._author };

    try {
      await Table.create(data);
      res.response(200, `Success create ${tableName}.`);
    } catch (error) {
      console.log(error);
      return error.name === "SequelizeValidationError"
        ? res.response(401, `Invalid ${error.errors[0].path}.`)
        : res.response(500);
    }
  };
};

const generalRead = (tableName, option = {}) => {
  const { queryAttribute = [], searchAttribute = [] } = option;
  return async (req, res) => {
    const Table = req.app[tableName];
    queryAttribute.includes("create_time") ||
      queryAttribute.push("create_time");

    const keywordArray = searchAttribute.map((item) => ({
      [item]: { [Op.like]: `%${req.query.keyword}%` },
    }));

    const opArray = keywordArray.filter((item) =>
      queryAttribute.includes(Object.keys(item)[0])
    );

    const onlyEnable = queryParam2False(req.query.onlyEnable);
    const onlyDisable = queryParam2False(req.query.onlyDisable);

    const whereOption = {
      where: {
        ...(onlyEnable && { enable: true }),
        ...(onlyDisable && { enable: false }),
        ...(req.query.keyword && {
          [Op.or]: opArray,
        }),
      },
    };

    const createSort =
      req.query.sort === undefined ||
      req.query.sort === "undefined" ||
      req.query.sort === ""
        ? []
        : ["create_time", req.query.sort];
    const nameSort =
      req.query.item === undefined ||
      req.query.item === "undefined" ||
      req.query.item === ""
        ? []
        : ["name", req.query.item];

    const sortArray = [createSort, nameSort];

    const filterArray = sortArray.filter((item) =>
      queryAttribute.includes(item[0])
    );

    try {
      const total = await Table.count(whereOption);
      const { start, size, begin, totalPages } = getPage({
        total,
        ...req.query,
      });

      const list = await Table.findAll({
        offset: begin,
        limit: size,
        attributes: queryAttribute,
        ...whereOption,
        ...(filterArray.length > 0 && { order: filterArray }),
      });

      return res.response(200, {
        start,
        size,
        begin,
        total,
        totalPages,
        list,
      });
    } catch (error) {
      // log sql message with error.original.sqlMessage
      console.log(error);
      res.response(500);
    }
  };
};

const generalUpdate = (tableName) => {
  return async (req, res) => {
    const Table = req.app[tableName];
    
    const id = parseInt(req.body.id);

    if (isNaN(id)) {
      return res.response(401, "Invalid id.");
    }

    delete req.body.id
    const data = { ...req.body, ...req._author };

    try {
      await Table.update(data, { where: { id } });
      res.response(200, `Success update ${tableName}.`);
    } catch (error) {
      console.log(error);
      return error.name === "SequelizeValidationError"
        ? res.response(401, `Invalid ${error.errors[0].path}.`)
        : res.response(500);
    }
  };
};

const generalDelete = (tableName) => {
  return async (req, res) => {
    const Table = req.app[tableName];
    const id = parseInt(req.body.id);

    if (isNaN(id)) {
      return res.response(401, "Invalid id.");
    }

    try {
      await Table.destroy({ where: { id } });
      res.response(200, `Success delete ${tableName}.`);
    } catch (error) {
      console.log(error);
      res.response(500);
    }
  };
};

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
  {
    path: "role-price",
    actions: {
      read: [
        async (req, res) =>
          res.response(200, "Mock role-price route.", {
            total: 1,
            totalPages: 1,
            list: [
              {
                id: 1,
                name: "一般會員",
                price: 1000,
              },
              {
                id: 2,
                name: "VIP",
                price: 750,
              },
              {
                id: 3,
                name: "VVIP",
                price: 700,
              },
              {
                id: 4,
                name: "MEGA-VIP",
                price: 500,
              },
            ],
          }),
      ],
    },
  },
  {
    path: "grade-price",
    actions: {
      read: [
        async (req, res) =>
          res.response(200, "Mock role-price route.", {
            total: 1,
            totalPages: 1,
            list: [
              {
                id: 1,
                name: "UR",
                price: 1200,
              },
              {
                id: 2,
                name: "R",
                price: 1000,
              },
              {
                id: 3,
                name: "SR",
                price: 900,
              },
              {
                id: 4,
                name: "SSR",
                price: 850,
              },
            ],
          }),
      ],
    },
  },
  {
    path: "stock-brand",
    schemas: {
      read: ["StockBrand"],
    },
    actions: {
      create: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalCreate("StockBrand"),
      ],
      read: [
        authenticationMiddleware,
        addUserMiddleware,
        generalRead("StockBrand", {
          queryAttribute: ["id", "name", "description"],
          searchAttribute: ["name"],
        }),
      ],
      update: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalUpdate("StockBrand"),
      ],
      delete: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalDelete("StockBrand"),
      ],
    },
  },
];

export { controllers };
