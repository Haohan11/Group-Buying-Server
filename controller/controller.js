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
  logger
} from "../model/helper.js";

const getGeneralCreate = (tableName, imageOption = {}, defaultData = {}) => {
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
      const data = {
        ...req.body,
        ...req._author,
        ...imageFields,
        ...defaultData,
      };

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

const getGeneralRead = (tableName, option = {}) => {
  const { queryAttribute = [], searchAttribute = [], listAdaptor } = option;
  return async (req, res) => {
    logger("========== in generalRead ==========");
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

      const rawlist = await Table.findAll({
        offset: begin,
        limit: size,
        attributes: queryAttribute,
        ...whereOption,
        ...(filterArray.length > 0 && { order: filterArray }),
      });

      const list =
        typeof listAdaptor === "function"
          ? await listAdaptor(rawlist, req)
          : rawlist;

      res.response(200, {
        start,
        size,
        begin,
        total,
        totalPages,
        list,
      });

      logger("========== exit generalRead ==========");
    } catch (error) {
      // log sql message with error.original.sqlMessage
      console.log("Error in generalRead: ", error);
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
    path: "stock-brand",
    schemas: {
      create: ["StockBrand"],
      read: ["StockBrand"],
    },
    actions: {
      create: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralCreate("StockBrand"),
      ],
      read: [
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralRead("StockBrand", {
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
        getGeneralCreate("StockCategory", {
          fieldNames: [{ name: "recommended_image" }],
        }),
      ],
      read: [
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralRead("StockCategory", {
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
        getGeneralCreate("StockAccounting"),
      ],
      read: [
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralRead("StockAccounting", {
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
  {
    path: "payment",
    schemas: {
      read: ["Payment"],
    },
    actions: {
      read: [
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralRead("Payment", {
          queryAttribute: ["id", "name"],
        }),
      ],
    },
  },
  {
    path: "account-method",
    schemas: {
      read: ["AccountMethod"],
    },
    actions: {
      read: [
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralRead("AccountMethod", {
          queryAttribute: ["id", "name"],
        }),
      ],
    },
  },
  {
    path: "supplier",
    schemas: {
      read: ["Supplier", "Payment", "AccountMethod"],
      create: ["Supplier"],
    },
    actions: {
      read: [
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralRead("Supplier", {
          queryAttribute: [
            "id",
            "name",
            "code",
            "payment_id",
            "accounting_id",
            "uniform_number",
            "phone",
            "contact_address",
            "contact_person",
            "mobile",
            "description",
          ],
          searchAttribute: ["name", "code"],
          listAdaptor: async (list, req) => {
            const { Payment, AccountMethod } = req.app;

            return await Promise.all(
              list.map(async (supplier) => {
                const payment = await Payment.findOne({
                  attributes: ["name"],
                  where: { id: supplier.payment_id },
                });
                const accounting = await AccountMethod.findOne({
                  attributes: ["name"],
                  where: { id: supplier.accounting_id },
                });
                supplier.setDataValue("payment", payment.name);
                supplier.setDataValue("accounting", accounting.name);
                return supplier;
              })
            );
          },
        }),
      ],
      create: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralCreate("Supplier", undefined, {
          supplier_type_id: 1,
          country_id: 1,
        }),
      ],
      update: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalUpdate("Supplier"),
      ],
      delete: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalDelete("Supplier"),
      ],
    },
  },
  {
    path: "member-grade",
    schemas: {
      read: ["MemberGrade"],
      create: ["MemberGrade"],
      update: ["MemberGrade"],
      delete: ["MemberGrade"],
    },
    actions: {
      create: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralCreate("MemberGrade"),
      ],
      read: [
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralRead("MemberGrade", {
          queryAttribute: ["id", "name", "description"],
          searchAttribute: ["name"],
        }),
      ],
      update: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalUpdate("MemberGrade"),
      ],
      delete: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalDelete("MemberGrade"),
      ],
    },
  },
  {
    path: "member-role",
    schemas: {
      read: ["MemberRole"],
      create: ["MemberRole"],
      update: ["MemberRole"],
      delete: ["MemberRole"],
    },
    actions: {
      create: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralCreate("MemberRole"),
      ],
      read: [
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralRead("MemberRole", {
          queryAttribute: ["id", "name", "description"],
          searchAttribute: ["name"],
        }),
      ],
      update: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalUpdate("MemberRole"),
      ],
      delete: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalDelete("MemberRole"),
      ],
    },
  },
];

export { controllers };
