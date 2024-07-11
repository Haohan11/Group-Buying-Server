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
  logger,
  toArray,
} from "../model/helper.js";

const getGeneralCreate = (tableName, option) => {
  const { imageFieldName, defaultData, extraHandler } = option || {};

  return async (req, res) => {
    try {
      const imageField = Array.isArray(imageFieldName)
        ? imageFieldName.reduce((properties, { name, originalName }) => {
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
        ...imageField,
        ...defaultData,
      };

      const { id } = await Table.create(data);

      typeof extraHandler === "function" && (await extraHandler(id, req));

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
  const {
    queryAttribute = [],
    searchAttribute = [],
    listAdaptor,
    extraWhere = {},
  } = option;
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
        ...extraWhere,
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

const generalUpdate = (tableName, option) => {
  const { imageFieldName, extraHandler } = option || {};

  return async (req, res) => {
    const Table = req.app[tableName];

    const id = req.body.id;

    if (!id) return res.response(401, "Invalid id.");

    try {
      const imagePath =
        Array.isArray(imageFieldName) &&
        (await Table.findByPk(id, {
          attributes: imageFieldName.reduce((attrs, { name }) => {
            name && attrs.push(name);
            return attrs;
          }, []),
        }));

      const imageField = Array.isArray(imageFieldName)
        ? imageFieldName.reduce((properties, { name, originalName }) => {
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
      const data = { ...req.body, ...req._author, ...imageField };

      await Table.update(data, { where: { id } });
      typeof extraHandler === "function" && (await extraHandler(id, req));

      res.response(200, `Success update ${tableName}.`);
    } catch (error) {
      console.log(error);
      return error.name === "SequelizeValidationError"
        ? res.response(401, `Invalid ${error.errors[0].path}.`)
        : res.response(500);
    }
  };
};

const generalDelete = (tableName, option) => {
  const { imageFieldName, extraHandler } = option || {};
  return async (req, res) => {
    const Table = req.app[tableName];
    const id = req.body.id;

    if (!id) return res.response(401, "Invalid id.");

    try {
      const imagePath =
        Array.isArray(imageFieldName) &&
        (await Table.findByPk(id, { attributes: imageFieldName }));

      imagePath &&
        imageFieldName.forEach((name) => {
          fs.unlink(
            filePathAppend(imagePath[name]),
            (err) => err && console.log(err)
          );
        });

      await Table.destroy({ where: { id } });
      typeof extraHandler === "function" && (await extraHandler(id, req));

      res.response(200, `Success delete ${tableName}.`);
    } catch (error) {
      console.log(error);
      res.response(500);
    }
  };
};

const controllers = [
  // stock
  {
    path: "stock",
    schemas: {
      all: ["Stock", "StockMedia", "Level_Price", "Role_Price"],
      read: ["StockCategory", "StockBrand", "StockAccounting", "Supplier"],
    },
    actions: {
      create: [
        createUploadImage("stock").fields([
          { name: "cover_image" },
          { name: "stock_image" },
          { name: "introduction_image" },
        ]),
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralCreate("Stock", {
          imageFieldName: [{ name: "cover_image" }],
          defaultData: {
            company_id: 1,
            stock_unit_id: 1,
            mbflag_type_id: 1,
            tax_type_id: 1,
          },
          extraHandler: async (stock_id, req) => {
            const { Stock, StockMedia, Level_Price, Role_Price } = req.app;

            /* Handle price fields below */
            await Promise.all(
              [
                {
                  Table: Level_Price,
                  reqName: "level_price",
                  colName: "member_level_id",
                },
                {
                  Table: Role_Price,
                  reqName: "role_price",
                  colName: "member_role_id",
                },
              ].map(({ Table, reqName, colName }) => {
                if (!Array.isArray(req.body[reqName])) return;

                return Table.bulkCreate(
                  req.body[reqName].map((data) => {
                    const { id, price } = JSON.parse(data);
                    return {
                      stock_id,
                      [colName]: id,
                      price,
                      ...req._author,
                    };
                  })
                );
              })
            );
            /* Handle price fields above */

            if (req.files?.stock_image) {
              const stockImgData = req.files.stock_image.map((file) => ({
                stock_id,
                name: transFilePath(file.path),
                media_type: file.mimetype.split("/")[0],
                org_name: file.originalname,
                size: file.size,
                ...req._author,
              }));
              await StockMedia.bulkCreate(stockImgData);
            }

            if (!req.files?.introduction_image) return;
            let introText = req.body.introduction;
            const introDict = toArray(req.body.introduction_preview).map(
              (item) => JSON.parse(item)
            );

            const introImgData = req.files.introduction_image.map((file) => {
              const newPath = transFilePath(file.path);
              const { id: path } = introDict.find(
                ({ ori }) => ori === file.originalname
              );
              introText = introText.replace(path, `path:${newPath}`);

              return {
                stock_id,
                code: "intro",
                name: newPath,
                media_type: file.mimetype.split("/")[0],
                org_name: file.originalname,
                size: file.size,
                ...req._author,
              };
            });
            await StockMedia.bulkCreate(introImgData);
            await Stock.update(
              { introduction: introText },
              { where: { id: stock_id } }
            );
          },
        }),
      ],
      read: [
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralRead("Stock", {
          queryAttribute: [
            "id",
            "cover_image",
            "is_valid",
            "is_preorder",
            "is_nostock_sell",
            "is_independent",
            "name",
            "code",
            "barcode",
            "specification",
            "stock_category_id",
            "stock_brand_id",
            "accounting_id",
            "supplier_id",
            "min_order",
            "order_step",
            "preorder_count",
            "price",
            "purchase_price",
            "description",
            "introduction",
          ],
          searchAttribute: ["name"],
          listAdaptor: async (list, req) => {
            const {
              StockCategory,
              StockBrand,
              StockAccounting,
              Supplier,
              StockMedia,
              Level_Price,
              Role_Price,
            } = req.app;

            return await Promise.all(
              list.map(async (stock) => {
                /* add field name by query id below */
                await Promise.all(
                  [
                    {
                      Table: StockCategory,
                      idField: "stock_category_id",
                      fieldName: "category",
                    },
                    {
                      Table: StockBrand,
                      idField: "stock_brand_id",
                      fieldName: "brand",
                    },
                    {
                      Table: StockAccounting,
                      idField: "accounting_id",
                      fieldName: "accounting",
                    },
                    {
                      Table: Supplier,
                      idField: "supplier_id",
                      fieldName: "supplier",
                    },
                  ].map(async ({ Table, idField, fieldName }) => {
                    const result = await Table.findOne({
                      attributes: ["name"],
                      where: { id: stock[idField] },
                    });
                    stock.setDataValue(fieldName, result.name);
                  })
                );
                /* add field name by query id above */

                /* handle append price fields below */
                await Promise.all(
                  [
                    {
                      Table: Level_Price,
                      idField: "member_level_id",
                      fieldName: "level_price",
                    },
                    {
                      Table: Role_Price,
                      idField: "member_role_id",
                      fieldName: "role_price",
                    },
                  ].map(async ({ Table, idField, fieldName }) => {
                    const levelPriceList = await Table.findAll({
                      where: { stock_id: stock.id },
                      attributes: [idField, "price"],
                    });

                    stock.setDataValue(
                      fieldName,
                      levelPriceList.map(({ [idField]: id, price }) => ({
                        id,
                        price,
                      }))
                    );
                  })
                );
                /* handle append price fields above */

                const images = await StockMedia.findAll({
                  attributes: ["name"],
                  where: { stock_id: stock.id, code: null },
                });
                stock.setDataValue(
                  "stock_image_preview",
                  images.map((image) => image.name)
                );

                return stock;
              })
            );
          },
        }),
      ],
      update: [
        createUploadImage("stock").fields([
          { name: "cover_image" },
          { name: "stock_image" },
          { name: "introduction_image" },
        ]),
        authenticationMiddleware,
        addUserMiddleware,
        generalUpdate("Stock", {
          imageFieldName: [{ name: "cover_image" }],
          extraHandler: async (stock_id, req) => {
            const { Stock, StockMedia, Level_Price, Role_Price } = req.app;

            /* Handle price fields below */
            await Promise.all(
              [
                {
                  Table: Level_Price,
                  reqName: "level_price",
                  colName: "member_level_id",
                },
                {
                  Table: Role_Price,
                  reqName: "role_price",
                  colName: "member_role_id",
                },
              ].map(async ({ Table, reqName, colName }) => {
                if (!Array.isArray(req.body[reqName])) return;

                const data = req.body[reqName].map((rawData) =>
                  JSON.parse(rawData)
                );
                await Table.destroy({
                  where: {
                    stock_id,
                  },
                });

                await Table.bulkCreate(
                  data.map(({ id, price }) => {
                    return {
                      stock_id,
                      [colName]: id,
                      price,
                      ...req._author,
                    };
                  })
                );
              })
            );
            /* Handle price fields above */

            /* Handle update image below */
            await Promise.all(
              [
                {
                  persist: req.body.stock_image_persist
                    ? toArray(req.body.stock_image_persist)
                    : [],
                  code: null,
                },
                {
                  persist: (req.body.introduction_image_persist
                    ? toArray(req.body.introduction_image_persist)
                    : []
                  ).map((item) => item.replace("/", "\\")),
                  code: "intro",
                },
              ].map(async ({ persist, code }) => {
                const willDelete = await StockMedia.findAll({
                  where: {
                    stock_id: stock_id,
                    name: { [Op.notIn]: persist },
                    code, // use for determine which image type will be deleted
                  },
                });

                if (!willDelete) return;

                await StockMedia.destroy({
                  where: {
                    stock_id: stock_id,
                    name: { [Op.notIn]: persist },
                    code,
                  },
                });

                willDelete.forEach((data) =>
                  fs.unlink(
                    filePathAppend(data.name),
                    (err) => err && console.log(err)
                  )
                );
              })
            );

            if (req.files?.stock_image) {
              const insertData = req.files.stock_image.map((file) => ({
                stock_id: stock_id,
                name: transFilePath(file.path),
                media_type: file.mimetype.split("/")[0],
                org_name: file.originalname,
                size: file.size,
                ...req._author,
              }));

              await StockMedia.bulkCreate(insertData);
            }

            if (!req.files?.introduction_image) return;
            let introText = req.body.introduction;
            const introDict = toArray(req.body.introduction_preview).map(
              (item) => JSON.parse(item)
            );

            const introImgData = req.files.introduction_image.map((file) => {
              const newPath = transFilePath(file.path);
              const { id: path } = introDict.find(
                ({ ori }) => ori === file.originalname
              );
              introText = introText.replace(path, `path:${newPath}`);

              return {
                stock_id,
                code: "intro",
                name: newPath,
                media_type: file.mimetype.split("/")[0],
                org_name: file.originalname,
                size: file.size,
                ...req._author,
              };
            });
            await StockMedia.bulkCreate(introImgData);
            await Stock.update(
              { introduction: introText },
              { where: { id: stock_id } }
            );
            /* Handle update image above */
          },
        }),
      ],
      delete: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalDelete("Stock", {
          imageFieldName: ["cover_image"],
          extraHandler: async (stock_id, req) => {
            const { StockMedia, Level_Price, Role_Price } = req.app;

            /* Handle price fields below */
            await Promise.all(
              [Level_Price, Role_Price].map((Table) =>
                Table.destroy({ where: { stock_id } })
              )
            );
            /* Handle price fields above */

            /* delete image below */
            const willDelete = await StockMedia.findAll({
              where: { stock_id },
            });

            if (!willDelete) return;

            await StockMedia.destroy({ where: { stock_id } });
            willDelete.forEach((data) =>
              fs.unlink(
                filePathAppend(data.name),
                (err) => err && console.log(err)
              )
            );
            /* delete image above */
          },
        }),
      ],
    },
  },
  // stock-brand
  {
    path: "stock-brand",
    schemas: {
      all: ["StockBrand"],
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
  // stock-category
  {
    path: "stock-category",
    schemas: {
      all: ["StockCategory"],
    },
    actions: {
      create: [
        createUploadImage("stock-category-thumbnail").fields([
          { name: "recommended_image" },
        ]),
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralCreate("StockCategory", {
          imageFieldName: [{ name: "recommended_image" }],
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
          imageFieldName: [{ name: "recommended_image" }],
        }),
      ],
      delete: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalDelete("StockCategory", {
          imageFieldName: ["recommended_image"],
        }),
      ],
    },
  },
  // stock-accounting
  {
    path: "stock-accounting",
    schemas: {
      all: ["StockAccounting"],
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
  // supplier-payment
  {
    path: "supplier-payment",
    schemas: {
      read: ["Payment"],
    },
    actions: {
      read: [
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralRead("Payment", {
          queryAttribute: ["id", "name"],
          extraWhere: { belong: "supplier" },
        }),
      ],
    },
  },
  // account-method
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
  // supplier
  {
    path: "supplier",
    schemas: {
      all: ["Supplier"],
      read: ["Payment", "AccountMethod"],
    },
    actions: {
      create: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralCreate("Supplier", {
          defaultData: {
            id: "uuid_placeholder",
            supplier_type_id: 1,
            country_id: 1,
          },
        }),
      ],
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
  // member-management
  {
    path: "member-management",
    schemas: {
      all: ["Member", "User", "Company"],
    },
    actions: {
      create: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralCreate("Member", {
          defaultData: {
            id: "uuid_placeholder",
            member_type_id: 1,
            country_id: 1,
            company_id: "_holder",
            member_type_id: "company",
            member_level_id: "",
            country_id: "",
            sex_id: "",
            join_date: "",
          },
        }),
      ],
      read: [
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralRead("Member", {
          queryAttribute: ["id", "name", "description"],
          searchAttribute: ["name"],
        }),
      ],
      update: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalUpdate("Member"),
      ],
      delete: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalDelete("Member"),
      ],
    },
  },
  // member-level
  {
    path: "member-level",
    schemas: {
      all: ["MemberLevel"],
    },
    actions: {
      create: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralCreate("MemberLevel"),
      ],
      read: [
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralRead("MemberLevel", {
          queryAttribute: ["id", "name", "description"],
          searchAttribute: ["name"],
        }),
      ],
      update: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalUpdate("MemberLevel"),
      ],
      delete: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalDelete("MemberLevel"),
      ],
    },
  },
  // member-role
  {
    path: "member-role",
    schemas: {
      all: ["MemberRole"],
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
  // member-payment
  {
    path: "member-payment",
    schemas: {
      all: ["Payment"],
    },
    actions: {
      create: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralCreate("Payment", {
          defaultData: {
            belong: "member",
          },
        }),
      ],
      read: [
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralRead("Payment", {
          queryAttribute: ["id", "name", "description"],
          searchAttribute: ["name"],
          extraWhere: {
            belong: "member",
          },
        }),
      ],
      update: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalUpdate("Payment"),
      ],
      delete: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalDelete("Payment"),
      ],
    },
  },
  // member-shipping
  {
    path: "member-shipping",
    schemas: {
      all: ["MemberShipping"],
    },
    actions: {
      create: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralCreate("MemberShipping"),
      ],
      read: [
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralRead("MemberShipping", {
          queryAttribute: ["id", "name", "description"],
          searchAttribute: ["name"],
        }),
      ],
      update: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalUpdate("MemberShipping"),
      ],
      delete: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalDelete("MemberShipping"),
      ],
    },
  },
  // order-category
  {
    path: "order-category",
    schemas: {
      all: ["OrderCategory"],
    },
    actions: {
      create: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralCreate("OrderCategory"),
      ],
      read: [
        authenticationMiddleware,
        addUserMiddleware,
        getGeneralRead("OrderCategory", {
          queryAttribute: ["id", "name", "description"],
          searchAttribute: ["name"],
        }),
      ],
      update: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalUpdate("OrderCategory"),
      ],
      delete: [
        multer().none(),
        authenticationMiddleware,
        addUserMiddleware,
        generalDelete("OrderCategory"),
      ],
    },
  },
];

export { controllers };
