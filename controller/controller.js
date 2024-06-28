import fs from "fs";
import multer from "multer";
import {
  authenticationMiddleware,
  addUserMiddleware,
} from "../middleware/middleware.js";

import { Op } from "sequelize";
import {
  queryParam2False,
  getPage,
  createUploadImage,
  transFilePath,
  filePathAppend,
} from "../model/helper.js";

const generalCreate = (tableName, imageOption = {}) => {
  const { fieldNames } = imageOption;

  return async (req, res) => {
    try {
      const imageFields = Array.isArray(fieldNames)
        ? fieldNames.reduce((properties, { name, originalName }) => {
            if (!req.files[name] || !name) return properties;
            properties[name] = transFilePath(req.files[name][0].path);
            originalName &&
              (properties[originalName] = req.files[name][0].originalname);
            return properties;
          }, {})
        : {};

      const Table = req.app[tableName];
      const data = { ...req.body, ...req._author, ...imageFields };

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

      res.response(200, {
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

const generalUpdate = (tableName, imageOption = {}) => {
  const { fieldNames } = imageOption;

  return async (req, res) => {
    const Table = req.app[tableName];

    const id = parseInt(req.body.id);

    if (isNaN(id)) {
      return res.response(401, "Invalid id.");
    }

    try {
      const imagePath =
        Array.isArray(fieldNames) &&
        (await Table.findByPk(id, {
          attributes: fieldNames.reduce((attrs, { name }) => {
            name && attrs.push(name);
            return attrs;
          }, []),
        }));

      const imageFields = Array.isArray(fieldNames)
        ? fieldNames.reduce((properties, { name, originalName }) => {
            if (!req.files[name] || !name) return properties;
            if (req.files[name][0].path) {
              fs.unlink(filePathAppend(imagePath[name]), (err) => {
                err && console.log(err);
              });
              properties[name] = transFilePath(req.files[name][0].path);
            }
            originalName &&
              (properties[originalName] = req.files[name][0].originalname);
            return properties;
          }, {})
        : {};

      delete req.body.id;
      const data = { ...req.body, ...req._author, ...imageFields };

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

const generalDelete = (tableName, imageNameList) => {
  return async (req, res) => {
    const Table = req.app[tableName];
    const id = parseInt(req.body.id);

    if (isNaN(id)) {
      return res.response(401, "Invalid id.");
    }

    try {
      const imagePath =
        Array.isArray(imageNameList) &&
        (await Table.findByPk(id, { attributes: imageNameList }));

      imagePath &&
        imageNameList.forEach((name) => {
          fs.unlink(
            filePathAppend(imagePath[name]),
            (err) => err && console.log(err)
          );
        });

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
  {
    path: "stock-category",
    schemas: {
      read: ["StockCategory"],
      create: ["StockCategory"],
    },
    actions: {
      create: [
        createUploadImage("stock-category-thumbnail").fields([
          { name: "recommended_image" },
        ]),
        authenticationMiddleware,
        addUserMiddleware,
        generalCreate("StockCategory", {
          fieldNames: [{ name: "recommended_image" }],
        }),
      ],
      read: [
        authenticationMiddleware,
        addUserMiddleware,
        generalRead("StockCategory", {
          queryAttribute: [
            "id",
            "name",
            "description",
            "recommended_image",
            "is_recommended",
          ],
          searchAttribute: ["name"],
        }),
      ],
      update: [
        createUploadImage("stock-category-thumbnail").fields([
          { name: "recommended_image" },
        ]),
        authenticationMiddleware,
        addUserMiddleware,
        generalUpdate("StockCategory", {
          fieldNames: [{ name: "recommended_image" }],
        }),
      ],
      delete: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalDelete("StockCategory", ["recommended_image"]),
      ],
    },
  },
  {
    path: "stock-accounting",
    schemas: {
      read: ["StockAccounting"],
      create: ["StockAccounting"],
    },
    actions: {
      create: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalCreate("StockAccounting"),
      ],
      read: [
        authenticationMiddleware,
        addUserMiddleware,
        generalRead("StockAccounting", {
          queryAttribute: ["id", "name", "code", "sorting", "description"],
          searchAttribute: ["name", "code"],
        }),
      ],
      update: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalUpdate("StockAccounting"),
      ],
      delete: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalDelete("StockAccounting"),
      ],
    },
  },
];

export { controllers };
