import fs from "fs";
import multer from "multer";
import {
  backAuthMiddleware,
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
  checkArray,
  addZeroPadding,
  getCurrentTime,
  serverErrorWrapper,
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
        ? res.response(400, `Invalid ${error.errors[0].path}.`)
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
    try {
      logger("========== in generalRead ==========");
      const Table = req.app[tableName];
      if (!Table) throw new Error("Table not found.");
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
        ...(onlyEnable && { enable: true }),
        ...(onlyDisable && { enable: false }),
        ...(req.query.keyword && {
          [Op.or]: opArray,
        }),
        ...(typeof extraWhere === "function" ? extraWhere(req) : extraWhere),
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

      const total = await Table.count({ where: whereOption });
      const { start, size, begin, totalPages } = getPage({
        total,
        ...req.query,
      });

      const rawlist = await Table.findAll({
        offset: begin,
        limit: size,
        attributes: queryAttribute,
        where: whereOption,
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

const getGeneralUpdate = (tableName, option) => {
  const { imageFieldName, defaultData, extraHandler } = option || {};

  return async (req, res) => {
    const Table = req.app[tableName];

    const id = req.body.id;

    if (!id) return res.response(400, "Invalid id.");

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
      const data = {
        ...req.body,
        ...req._author,
        ...imageField,
        ...defaultData,
      };

      await Table.update(data, { where: { id } });
      typeof extraHandler === "function" && (await extraHandler(id, req));

      res.response(200, `Success update ${tableName}.`);
    } catch (error) {
      console.log(error);
      return error.name === "SequelizeValidationError"
        ? res.response(400, `Invalid ${error.errors[0].path}.`)
        : res.response(500);
    }
  };
};

const getGeneralDelete = (tableName, option) => {
  const { imageFieldName, extraHandler, stopDestroy = false } = option || {};
  return async (req, res) => {
    const Table = req.app[tableName];
    const id = req.body.id;

    if (!id) return res.response(400, "Invalid id.");

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

      !stopDestroy && (await Table.destroy({ where: { id } }));
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
    path: "stock-backend",
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
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralCreate("Stock", {
          imageFieldName: [{ name: "cover_image" }],
          defaultData: {
            id: "uuid_placeholder",
            company_id: "none",
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
        backAuthMiddleware,
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
            "short_desc",
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
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralUpdate("Stock", {
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
                  persist: req.body.introduction_image_persist
                    ? toArray(req.body.introduction_image_persist)
                    : [],
                  code: "intro",
                },
              ].map(async ({ persist, code }) => {
                const willDelete = await StockMedia.findAll({
                  where: {
                    stock_id,
                    name: { [Op.notIn]: persist },
                    code, // use for determine which image type will be deleted
                  },
                });

                if (!willDelete) return;

                await StockMedia.destroy({
                  where: {
                    stock_id,
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
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralDelete("Stock", {
          imageFieldName: ["cover_image"],
          stopDestroy: true,
          extraHandler: async (stock_id, req) => {
            const { Stock, StockMedia, Level_Price, Role_Price } = req.app;

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

            await Stock.destroy({ where: { id: stock_id } });
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
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralCreate("StockBrand", {
          defaultData: {
            company_id: "none",
          },
        }),
      ],
      read: [
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralRead("StockBrand", {
          queryAttribute: ["id", "name", "description"],
          searchAttribute: ["name"],
        }),
      ],
      update: [
        multer().none(),
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralUpdate("StockBrand"),
      ],
      delete: [
        multer().none(),
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralDelete("StockBrand"),
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
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralCreate("StockCategory", {
          imageFieldName: [{ name: "recommended_image" }],
          defaultData: {
            id: "uuid_placeholder",
            company_id: "none",
          },
        }),
      ],
      read: [
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralRead("StockCategory", {
          queryAttribute: [
            "id",
            "name",
            "description",
            "recommended_image",
            "is_recommended",
            "parent",
          ],
          searchAttribute: ["name"],
          listAdaptor: async (list, req) => {
            const { StockCategory } = req.app;
            return await Promise.all(
              list.map(async (category) => {
                const parent_id = category.parent;
                if (!parent_id) {
                  category.setDataValue("parent_name", "無");
                  return category;
                }

                const parentData = await StockCategory.findByPk(
                  category.parent
                );
                category.setDataValue("parent_name", parentData?.name || "無");
                return category;
              })
            );
          },
        }),
      ],
      update: [
        createUploadImage("stock-category-thumbnail").fields([
          { name: "recommended_image" },
        ]),
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralUpdate("StockCategory", {
          imageFieldName: [{ name: "recommended_image" }],
        }),
      ],
      delete: [
        multer().none(),
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralDelete("StockCategory", {
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
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralCreate("StockAccounting", {
          defaultData: {
            company_id: "none",
          },
        }),
      ],
      read: [
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralRead("StockAccounting", {
          queryAttribute: ["id", "name", "code", "sorting", "description"],
          searchAttribute: ["name", "code"],
        }),
      ],
      update: [
        multer().none(),
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralUpdate("StockAccounting"),
      ],
      delete: [
        multer().none(),
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralDelete("StockAccounting"),
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
        backAuthMiddleware,
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
        backAuthMiddleware,
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
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralCreate("Supplier", {
          defaultData: {
            id: "uuid_placeholder",
            supplier_type_id: 1,
            country_id: "none",
            company_id: "none",
          },
        }),
      ],
      read: [
        backAuthMiddleware,
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
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralUpdate("Supplier"),
      ],
      delete: [
        multer().none(),
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralDelete("Supplier"),
      ],
    },
  },
  // member-management
  {
    path: "member-management",
    schemas: {
      all: ["Member", "User", "Company"],
      read: ["MemberLevel", "MemberRole", "MemberShipping", "Payment"],
    },
    actions: {
      create: [
        multer().none(),
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralCreate("Member", {
          defaultData: {
            id: "uuid_placeholder",
            country_id: "none",
            code: "_holder",
            company_id: "none",
            member_type_id: "company",
            sex_id: "none",
          },
          extraHandler: async (member_id, req) => {
            const { Member, User, Company } = req.app;
            const {
              name,
              uniform_number,
              phone,
              address,
              company_title: title,
              account,
              password,
              email,
            } = req.body;

            const companyData = await Company.create({
              id: "uuid_placeholder",
              name,
              uniform_number,
              phone,
              address,
              title,
              ...req._author,
            });
            const { id: company_id } = companyData;

            const userData = await User.create({
              name,
              account,
              password,
              company_id,
              email,
              ...req._author,
            });
            const { id: user_id } = userData;

            const date = new Date();
            const yearStr = `${date.getFullYear()}`;
            const monthStr = addZeroPadding(`${date.getMonth() + 1}`, 2);
            const dateStr = addZeroPadding(`${date.getDate()}`, 2);

            const codePrefix = `MB${yearStr}${monthStr}${dateStr}`;

            const codeData = await Member.findAll({
              attributes: ["code"],
              where: {
                code: {
                  [Op.like]: `${codePrefix}%`,
                },
              },
            });

            const serialNumber = codeData.reduce((max, item) => {
              if (!item?.code || typeof item.code !== "string") return max;

              const itemCode = parseInt(item.code.replace(codePrefix, ""));
              return itemCode > max ? itemCode : max;
            }, 0);
            const codePostfix = addZeroPadding(`${serialNumber + 1}`, 3);

            const code = codePrefix + codePostfix;

            await Member.update(
              { company_id, user_id, code, uniform_number: null },
              { where: { id: member_id } }
            );
          },
        }),
      ],
      read: [
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralRead("Member", {
          queryAttribute: [
            "id",
            "user_id",
            "company_id",
            "status_id",
            "name",
            "code",
            "email",
            "phone",
            "member_level_id",
            "member_role_id",
            "payment_id",
            "shipping_id",
            "shipping_condition_id",
            "birthdate",
            "description",
          ],
          searchAttribute: ["name", "code"],
          listAdaptor: async (list, req) => {
            const {
              User,
              Company,
              MemberLevel,
              MemberRole,
              MemberShipping,
              Payment,
            } = req.app;

            const statusDict = {
              applying: "申請中",
              enabled: "已啟用",
              disabled: "已停用",
            };

            const shipCondiDict = {
              prepaid: "先付款後取貨",
              postpaid: "先取貨後付款",
            };

            return await Promise.all(
              list.map(async (member) => {
                const {
                  status_id,
                  user_id,
                  company_id,
                  member_level_id,
                  member_role_id,
                  shipping_id,
                  shipping_condition_id,
                  payment_id,
                } = member;

                const userData = await User.findByPk(user_id, {
                  attributes: ["account"],
                });

                const companyData = await Company.findByPk(company_id, {
                  attributes: ["uniform_number", "address", "title"],
                });

                const levelData = await MemberLevel.findByPk(member_level_id, {
                  attributes: ["name"],
                });

                const roleData = await MemberRole.findByPk(member_role_id, {
                  attributes: ["name"],
                });

                const shippingData = await MemberShipping.findByPk(
                  shipping_id,
                  {
                    attributes: ["name"],
                  }
                );

                const paymentData = await Payment.findByPk(payment_id, {
                  attributes: ["name"],
                });

                const appendData = {
                  account: userData?.account,
                  uniform_number: companyData?.uniform_number,
                  address: companyData?.address,
                  company_title: companyData?.title,
                  member_level: levelData?.name,
                  member_role: roleData?.name,
                  member_shipping: shippingData?.name,
                  status: statusDict[status_id],
                  shipping_condition: shipCondiDict[shipping_condition_id],
                  payment: paymentData?.name,
                };

                Object.entries(appendData).forEach(([key, value]) => {
                  value && member.setDataValue(key, value);
                });

                return member;
              })
            );
          },
        }),
      ],
      update: [
        multer().none(),
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralUpdate("Member", {
          extraHandler: async (member_id, req) => {
            const { Member, User, Company } = req.app;
            const {
              name,
              uniform_number,
              phone,
              address,
              company_title: title,
              account,
              password,
              email,
            } = req.body;

            const memberData = await Member.findByPk(member_id);
            const { company_id, user_id } = memberData;

            await Company.update(
              {
                name,
                uniform_number,
                phone,
                address,
                title,
                ...req._author,
              },
              {
                where: {
                  id: company_id,
                },
              }
            );

            await User.update(
              {
                name,
                account,
                email,
                ...(password && { password }),
                ...req._author,
              },
              {
                where: {
                  id: user_id,
                },
              }
            );

            await Member.update(
              { uniform_number: null },
              { where: { id: member_id } }
            );
          },
        }),
      ],
      delete: [
        multer().none(),
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralDelete("Member", {
          stopDestroy: true,
          extraHandler: async (member_id, req) => {
            const { Member, User, Company } = req.app;

            const memberData = await Member.findByPk(member_id);
            const { company_id, user_id } = memberData;
            await Member.destroy({ where: { id: member_id } });

            await User.destroy({
              where: { id: user_id },
            });

            await Company.destroy({
              where: { id: company_id },
            });
          },
        }),
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
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralCreate("MemberLevel"),
      ],
      read: [
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralRead("MemberLevel", {
          queryAttribute: ["id", "name", "description"],
          searchAttribute: ["name"],
        }),
      ],
      update: [
        multer().none(),
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralUpdate("MemberLevel"),
      ],
      delete: [
        multer().none(),
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralDelete("MemberLevel"),
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
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralCreate("MemberRole"),
      ],
      read: [
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralRead("MemberRole", {
          queryAttribute: ["id", "name", "description"],
          searchAttribute: ["name"],
        }),
      ],
      update: [
        multer().none(),
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralUpdate("MemberRole"),
      ],
      delete: [
        multer().none(),
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralDelete("MemberRole"),
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
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralCreate("Payment", {
          defaultData: {
            id: "uuid_placeholder",
            belong: "member",
          },
        }),
      ],
      read: [
        backAuthMiddleware,
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
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralUpdate("Payment"),
      ],
      delete: [
        multer().none(),
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralDelete("Payment"),
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
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralCreate("MemberShipping", {
          defaultData: {
            id: "uuid_placeholder",
          },
        }),
      ],
      read: [
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralRead("MemberShipping", {
          queryAttribute: ["id", "name", "description"],
          searchAttribute: ["name"],
        }),
      ],
      update: [
        multer().none(),
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralUpdate("MemberShipping"),
      ],
      delete: [
        multer().none(),
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralDelete("MemberShipping"),
      ],
    },
  },
  // sale
  {
    path: "sale-management",
    schemas: {
      read: ["Payment"],
      all: [
        "Sale",
        "SaleDetail",
        "SaleDetailDelivery",
        "MemberContactPerson",
        "Company",
        "Member",
        "Stock",
      ],
    },
    actions: {
      create: [
        multer().none(),
        backAuthMiddleware,
        addUserMiddleware,
        async (req, res) => {
          try {
            const {
              Sale,
              SaleDetail,
              SaleDetailDelivery,
              Member,
              MemberContactPerson,
              Company,
            } = req.app;
            const data = req.body;

            const { member_id, description, delivery_id } = data;
            const memberData = await Member.findByPk(member_id);
            if (!memberData) return res.response(400, `Invalid Member.`);

            const { company_id } = memberData;
            const companyData = await Company.findByPk(company_id);
            if (!companyData) return res.response(400, `Invalid Company.`);

            if (!data.person_list)
              return res.response(400, `Invalid Person List.`);
            const person_list = Array.isArray(data.person_list)
              ? data.person_list.map(JSON.parse)
              : JSON.parse(data.person_list);

            // #region generate sale code with format: SALYYMMDD00001
            const date = new Date();
            const yearStr = `${date.getFullYear()}`.slice(-2);
            const monthStr = `${date.getMonth() + 1}`.padStart(2, "0");
            const dateStr = `${date.getDate()}`.padStart(2, "0");
            const codePrefix = `SAL${yearStr}${monthStr}${dateStr}`;

            const codeData = await Sale.findAll({
              attributes: ["code"],
              where: {
                code: {
                  [Op.like]: `${codePrefix}%`,
                },
              },
            });

            const serialNumber = codeData.reduce((max, item) => {
              if (!item?.code || typeof item.code !== "string") return max;

              const itemCode = parseInt(item.code.replace(codePrefix, ""));
              return itemCode > max ? itemCode : max;
            }, 0);
            const codePostfix = `${serialNumber + 1}`.padStart(5, "0");

            const code = codePrefix + codePostfix;
            // #endregion generate sale code end

            const { id: sale_id } = await Sale.create({
              id: Date.now(),
              code,
              company_id,
              member_id,
              description,
              sale_point_id: "none",
              sale_type_id: "none",
              currencies_id: "NT",
              sale_date: getCurrentTime(),
              ...req._author,
            });

            await Promise.all(
              toArray(person_list).map(async (person) => {
                const {
                  id: person_id,
                  stockList,
                  name: personName,
                  contact_address: personAddress,
                  phone: personPhone,
                  main_receiver,
                } = person;

                if (!checkArray(stockList)) return;

                const personData = {
                  country_id: "none",
                  member_id,
                  name: personName,
                  name2: personName,
                  contact_address: personAddress,
                  phone: personPhone,
                  ...req._author,
                };

                const isNewPerson = person_id[0] === "_";
                const MCPGate = isNewPerson
                  ? {
                      action: "create",
                      data: {
                        id: "uuid_placeholder",
                        ...personData,
                      },
                    }
                  : {
                      action: "update",
                      data: {
                        id: person_id,
                        ...personData,
                      },
                      option: {
                        where: {
                          id: person_id,
                        },
                      },
                    };
                const MCPdata = await MemberContactPerson[MCPGate.action](
                  MCPGate.data,
                  MCPGate.option
                );

                const member_contact_person_id = isNewPerson
                  ? MCPdata.id
                  : person_id;
                main_receiver &&
                  (await Sale.update(
                    { main_receiver_id: member_contact_person_id },
                    { where: { id: sale_id } }
                  ));

                const detailsData = await SaleDetail.bulkCreate(
                  stockList.reduce(
                    (list, { id, qty, unit_price, price }) =>
                      +qty === 0
                        ? list
                        : list.concat({
                            id: "uuid_placeholder",
                            stock_id: id,
                            qty,
                            unit_price,
                            price,
                            sale_id,
                            ...req._author,
                          }),
                    []
                  )
                );

                await SaleDetailDelivery.bulkCreate(
                  detailsData.map((detail) => {
                    return {
                      id: "uuid_placeholder",
                      sale_id,
                      sale_detail_id: detail.id,
                      member_contact_person_id,
                      receiver_name: personName,
                      receiver_phone: personPhone,
                      receiver_address: personAddress,
                      delivery_id,
                      ...req._author,
                    };
                  })
                );
              })
            );

            res.response(200, `Success create Sale.`);
          } catch (error) {
            console.log("Create Sale Error: ", error);
            return error.name === "SequelizeValidationError"
              ? res.response(400, `Invalid ${error.errors[0].path}.`)
              : res.response(500);
          }
        },
      ],
      read: [
        backAuthMiddleware,
        addUserMiddleware,
        serverErrorWrapper(async (req, res) => {
          const { Sale, SaleDetail, SaleDetailDelivery, Stock, Member } =
            req.app;

          const total = await Sale.count();
          const { size, begin, totalPages } = getPage({
            total,
            ...req.query,
          });

          const saleData = await Sale.findAll({
            attributes: [
              "id",
              "code",
              "member_id",
              "sale_date",
              "main_receiver_id",
              "description",
            ],
            offset: begin,
            limit: size,
          });

          const memberData = await Member.findAll({
            attributes: ["id", "code", "name", "payment_id"],
            where: {
              id: {
                [Op.in]: saleData.map(({ member_id }) => member_id),
              },
            },
          });

          const paymentData = await Payment.findAll({
            attributes: ["id", "code", "name"],
            where: {
              id: {
                [Op.in]: memberData.map(({ payment_id }) => payment_id),
              },
            },
          });

          const paymentDict = paymentData.reduce(
            (paymentMap, payment) =>
              paymentMap.set(payment.id, payment.dataValues),
            new Map()
          );

          const memberDict = memberData.reduce(
            (memberMap, member) => memberMap.set(member.id, member.dataValues),
            new Map()
          );

          const list = await Promise.all(
            saleData.map(
              async ({
                id: sale_id,
                code,
                member_id,
                sale_date,
                main_receiver_id,
                description,
              }) => {
                const saleDetailData = await SaleDetail.findAll({
                  attributes: ["id", "stock_id", "qty", "unit_price", "price"],
                  where: {
                    sale_id,
                  },
                });

                const stockData = await Stock.findAll({
                  attributes: [
                    "id",
                    "cover_image",
                    "name",
                    "code",
                    "barcode",
                    "specification",
                    "stock_category_id",
                    "stock_brand_id",
                    "accounting_id",
                    "supplier_id",
                    "purchase_price",
                    "short_desc",
                  ],
                  where: {
                    id: {
                      [Op.in]: saleDetailData.map(({ stock_id }) => stock_id),
                    },
                  },
                });
                const stockDict = stockData.reduce(
                  (stockMap, stock) => stockMap.set(stock.id, stock.dataValues),
                  new Map()
                );

                const personData = await saleDetailData.reduce(
                  async (
                    polymer,
                    { id: sale_detail_id, stock_id, qty, unit_price, price }
                  ) => {
                    const receiverData = await polymer;

                    const saleDeliveryData = await SaleDetailDelivery.findOne({
                      attributes: [
                        "member_contact_person_id",
                        "receiver_name",
                        "receiver_phone",
                        "receiver_address",
                        "delivery_id",
                      ],
                      where: {
                        sale_id,
                        sale_detail_id,
                      },
                    });

                    if (!saleDeliveryData?.member_contact_person_id)
                      return receiverData;

                    const {
                      member_contact_person_id: id,
                      receiver_name: name,
                      receiver_phone: phone,
                      receiver_address: contact_address,
                      delivery_id,
                    } = saleDeliveryData;

                    receiverData.delivery_id = delivery_id;
                    receiverData.has(id)
                      ? receiverData.get(id).stockList.push({
                          ...stockDict.get(stock_id),
                          qty,
                          unit_price,
                          price,
                        })
                      : receiverData.set(id, {
                          id,
                          name,
                          phone,
                          contact_address,
                          main_receiver: id === main_receiver_id,
                          stockList: [
                            {
                              ...stockDict.get(stock_id),
                              qty,
                              unit_price,
                              price,
                            },
                          ],
                        });

                    return receiverData;
                  },
                  new Map()
                );

                return {
                  id: sale_id,
                  code,
                  member_id,
                  member_name: memberDict.get(member_id).name,
                  member_code: memberDict.get(member_id).code,
                  sale_date,
                  description,
                  delivery_id: personData.delivery_id,
                  person_list: new Array(...personData.values()),
                };
              }
            )
          );

          res.response(200, { totalPages, list });
        }, "Read Sale"),
      ],
      update: [
        multer().none(),
        backAuthMiddleware,
        addUserMiddleware,
        async (req, res) => {
          try {
            const {
              Sale,
              SaleDetail,
              SaleDetailDelivery,
              Member,
              MemberContactPerson,
              Company,
            } = req.app;
            const data = req.body;

            const { id: sale_id, description, delivery_id } = data;
            if (!sale_id) return res.response(400, `Invalid Sale.`);
            const saleData = await Sale.findByPk(sale_id, {
              attributes: ["member_id", "company_id"],
            });
            if (!saleData) return res.response(400, `Invalid Sale.`);

            const { member_id: old_member_id } = saleData;
            const { member_id: new_member_id } = data;
            const isNewMember = old_member_id !== new_member_id;
            const member_id = new_member_id;

            const memberData = isNewMember
              ? await Member.findByPk(new_member_id, {
                  attributes: ["company_id"],
                })
              : { company_id: saleData.company_id };
            if (!memberData) return res.response(400, `Invalid Member.`);

            const { company_id } = memberData;
            if (!company_id) return res.response(400, `Invalid Company.`);
            const companyData = isNewMember
              ? await Company.findByPk(company_id)
              : {};
            if (!companyData) return res.response(400, `Invalid Company.`);

            if (!data.person_list)
              return res.response(400, `Invalid Person List.`);

            const person_list = Array.isArray(data.person_list)
              ? data.person_list.map(JSON.parse)
              : [JSON.parse(data.person_list)];

            await Sale.update(
              {
                ...(isNewMember && {
                  company_id,
                  member_id,
                  sale_point_id: "none",
                  sale_type_id: "none",
                  currencies_id: "NT",
                  sale_date: getCurrentTime(),
                }),
                description,
                ...req._author,
              },
              {
                where: {
                  id: sale_id,
                },
              }
            );

            await SaleDetailDelivery.destroy({ where: { sale_id } });
            await SaleDetail.destroy({ where: { sale_id } });

            const personIds = person_list.reduce(
              (newList, { id }) =>
                id[0] === "_" ? newList : newList.concat(id),
              []
            );

            const oldReceivers = Array.from(
              new Set(
                (
                  await SaleDetailDelivery.findAll({
                    attributes: ["member_contact_person_id"],
                    where: {
                      sale_id,
                    },
                  })
                ).map(
                  ({ member_contact_person_id }) => member_contact_person_id
                )
              )
            );

            const goDelReceiver = oldReceivers.filter(
              (id) => !personIds.includes(id)
            );

            deleteNotInPerson: {
              if (isNewMember || goDelReceiver.length === 0)
                break deleteNotInPerson;

              const willDelete = await SaleDetailDelivery.findAll({
                attributes: ["id", "sale_detail_id"],
                where: {
                  sale_id,
                  member_contact_person_id: goDelReceiver,
                },
              });

              if (!checkArray(willDelete)) break deleteNotInPerson;
              const [ids, SDids] = willDelete.reduce(
                ([ids, SDids], { id, sale_detail_id }) => [
                  [...ids, id],
                  [...SDids, sale_detail_id],
                ],
                [[], []]
              );

              await SaleDetailDelivery.destroy({
                where: {
                  id: ids,
                },
              });
              await SaleDetail.destroy({
                where: {
                  id: SDids,
                },
              });
            }

            await Promise.all(
              toArray(person_list).map(async (person) => {
                const {
                  id: person_id,
                  stockList,
                  name: personName,
                  contact_address: personAddress,
                  phone: personPhone,
                  main_receiver,
                } = person;

                if (!checkArray(stockList)) return;

                const personData = {
                  country_id: "none",
                  member_id,
                  name: personName,
                  name2: personName,
                  contact_address: personAddress,
                  phone: personPhone,
                  ...req._author,
                };

                const isNewReceiver = person_id[0] === "_";
                const MCPGate = isNewReceiver
                  ? {
                      action: "create",
                      data: {
                        id: "uuid_placeholder",
                        ...personData,
                      },
                    }
                  : {
                      action: "update",
                      data: {
                        id: person_id,
                        ...personData,
                      },
                      option: {
                        where: {
                          id: person_id,
                        },
                      },
                    };
                const MCPdata = await MemberContactPerson[MCPGate.action](
                  MCPGate.data,
                  MCPGate.option
                );

                const member_contact_person_id = isNewReceiver
                  ? MCPdata.id
                  : person_id;
                main_receiver &&
                  (await Sale.update(
                    { main_receiver_id: member_contact_person_id },
                    { where: { id: sale_id } }
                  ));

                const isNewPerson = !oldReceivers.includes(person_id);

                /** Handle new person */
                if (isNewMember || isNewReceiver || isNewPerson) {
                  const detailsData = await SaleDetail.bulkCreate(
                    stockList.reduce(
                      (list, { id, qty, unit_price, price }) =>
                        +qty === 0
                          ? list
                          : list.concat({
                              id: "uuid_placeholder",
                              stock_id: id,
                              qty,
                              unit_price,
                              price,
                              sale_id,
                              ...req._author,
                            }),
                      []
                    )
                  );

                  await SaleDetailDelivery.bulkCreate(
                    detailsData.map((detail) => {
                      return {
                        id: "uuid_placeholder",
                        sale_id,
                        sale_detail_id: detail.id,
                        member_contact_person_id,
                        receiver_name: personName,
                        receiver_phone: personPhone,
                        receiver_address: personAddress,
                        delivery_id,
                        ...req._author,
                      };
                    })
                  );

                  /** Early return after handled new person */
                  return;
                }

                /** Handle old person with new stock */
                const { stockIds, newStockList } = stockList.reduce(
                  (dict, stock) =>
                    +stock.qty === 0
                      ? dict
                      : {
                          stockIds: dict.stockIds.concat(stock.id),
                          newStockList: dict.newStockList.concat(stock),
                        },
                  { stockIds: [], newStockList: [] }
                );

                const oldDeliveryData = await SaleDetailDelivery.findAll({
                  attributes: ["id", "sale_detail_id"],
                  where: {
                    sale_id,
                    member_contact_person_id,
                  },
                });

                const oldDetailData = await SaleDetail.findAll({
                  attributes: ["id", "stock_id"],
                  where: {
                    sale_id,
                    id: oldDeliveryData.map(
                      ({ sale_detail_id }) => sale_detail_id
                    ),
                  },
                });

                const [goDel, detailDict] = oldDetailData.reduce(
                  ([goDel, detailDict], { id, stock_id }) =>
                    stockIds.includes(stock_id)
                      ? [goDel, detailDict.set(stock_id, id)]
                      : [[...goDel, id], detailDict],
                  [[], new Map()]
                );

                if (goDel.length > 0) {
                  await SaleDetailDelivery.destroy({
                    where: {
                      sale_detail_id: goDel,
                    },
                  });

                  await SaleDetail.destroy({
                    where: {
                      id: goDel,
                    },
                  });
                }

                await Promise.all(
                  newStockList.map(
                    async ({ id: stock_id, qty, unit_price, price }) => {
                      const sale_detail_id = detailDict.get(stock_id);
                      const action = sale_detail_id ? "update" : "create";

                      await {
                        create: async () => {
                          const newDetail = await SaleDetail.create({
                            id: "uuid_placeholder",
                            stock_id,
                            qty,
                            unit_price,
                            price,
                            sale_id,
                            ...req._author,
                          });

                          await SaleDetailDelivery.create({
                            id: "uuid_placeholder",
                            sale_id,
                            sale_detail_id: newDetail.id,
                            member_contact_person_id,
                            receiver_name: personName,
                            receiver_phone: personPhone,
                            receiver_address: personAddress,
                            delivery_id,
                            ...req._author,
                          });
                        },
                        update: async () => {
                          await SaleDetail.update(
                            {
                              qty,
                              price,
                              ...req._author,
                            },
                            { where: { id: sale_detail_id } }
                          );

                          await SaleDetailDelivery.update(
                            {
                              member_contact_person_id,
                              receiver_name: personName,
                              receiver_phone: personPhone,
                              receiver_address: personAddress,
                              delivery_id,
                              ...req._author,
                            },
                            {
                              where: {
                                sale_detail_id,
                              },
                            }
                          );
                        },
                      }[action]();
                    }
                  )
                );
              })
            );

            res.response(200, `Success update Sale.`);
          } catch (error) {
            console.log("Update Sale Error: ", error);
            return error.name === "SequelizeValidationError"
              ? res.response(400, `Invalid ${error.errors[0].path}.`)
              : res.response(500);
          }
        },
      ],
      delete: [
        multer().none(),
        backAuthMiddleware,
        addUserMiddleware,
        serverErrorWrapper(async (req, res) => {
          const { id: sale_id } = req.body;
          if (!sale_id) return res.response(400, `Missing sale_id.`);

          const { Sale, SaleDetail, SaleDetailDelivery } = req.app;

          await SaleDetailDelivery.destroy({
            where: {
              sale_id,
            },
          });
          await SaleDetail.destroy({
            where: {
              sale_id,
            },
          });
          await Sale.destroy({
            where: {
              id: sale_id,
            },
          });

          res.response(200, "Success delete Sale.");
        }, "Delete Sale"),
      ],
    },
  },
  // sale-type
  {
    path: "sale-type",
    schemas: {
      all: ["SaleType"],
    },
    actions: {
      create: [
        multer().none(),
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralCreate("SaleType"),
      ],
      read: [
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralRead("SaleType", {
          queryAttribute: ["id", "name", "description"],
          searchAttribute: ["name"],
        }),
      ],
      update: [
        multer().none(),
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralUpdate("SaleType"),
      ],
      delete: [
        multer().none(),
        backAuthMiddleware,
        addUserMiddleware,
        getGeneralDelete("SaleType"),
      ],
    },
  },
];

export { controllers };
