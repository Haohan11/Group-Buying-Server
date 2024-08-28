import versionText from "../versionText.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Op, where } from "sequelize";

import { routesSet } from "../globalVariable.js";
import {
  logger,
  toArray,
  serverErrorWrapper,
  getPage,
  getCurrentTime,
  createAuthor,
} from "../model/helper.js";

import {
  frontAuthMiddleware,
  backAuthMiddleware,
} from "../middleware/middleware.js";

import { createConnectMiddleware } from "../model/schemaHelper.js";
import multer from "multer";

const routes = [
  // verson
  {
    path: "version",
    method: "get",
    handlers: async (req, res) =>
      res.response(200, `Current version: ${versionText}`),
  },
  // index-item
  {
    path: "get-index-item",
    method: "get",
    handlers: [
      createConnectMiddleware(["IndexItem", "IndexItemType"]),
      serverErrorWrapper(async (req, res) => {
        const { IndexItem, IndexItemType } = req.app;

        const indexItemTypes = await IndexItemType.findAll({
          attributes: ["id", "name", "icon", "route"],
        });

        const list = await Promise.all(
          indexItemTypes.map(async ({ id, name, icon, route }) => {
            const indexItems = await IndexItem.findAll({
              attributes: ["id", "name", "route", "table_name"],
              where: {
                index_item_type_id: id,
              },
            });
            return {
              id,
              name,
              icon,
              route,
              indexItems: indexItems.map((item) => ({
                id: item.id,
                name: item.name,
                route: item.route,
                tableName: item.table_name,
              })),
            };
          })
        );

        res.response(200, list);
      }, "get-index-item"),
    ],
  },
  // receiver
  {
    path: "receiver",
    children: [
      {
        path: ":memberId",
        method: "get",
        handlers: [
          createConnectMiddleware(["Member", "MemberContactPerson"]),
          serverErrorWrapper(async (req, res, next) => {
            const { Member, MemberContactPerson } = req.app;

            const member_id = req.params.memberId;
            const keyword = req.query.keyword;

            const memberData = await Member.findByPk(member_id);
            if (!memberData || !keyword) return res.response(404);

            const personData = await MemberContactPerson.findAll({
              attributes: ["id", "name", "phone", "contact_address"],
              where: {
                member_id,
                name: { [Op.like]: `%${keyword}%` },
              },
            });

            res.response(200, personData);
          }),
        ],
      },
    ],
  },
  // stock
  {
    path: "stock",
    children: [
      {
        path: "single",
        method: "get",
        handlers: [
          frontAuthMiddleware,
          createConnectMiddleware([
            "Member",
            "Stock",
            "StockMedia",
            "Level_Price",
            "Role_Price",
          ]),
          serverErrorWrapper(async (req, res) => {
            const { Member, Stock, StockMedia, Level_Price, Role_Price } =
              req.app;
            const { stockId } = req.query;

            const role_fk = "member_role_id";
            const level_fk = "member_level_id";

            const member_id = req._user.member_id;

            const memberData = await Member.findByPk(member_id, {
              attributes: ["id", "name", role_fk, level_fk],
            });
            if (!memberData) return res.response(404);

            const stockData = await Stock.findByPk(stockId, {
              attributes: [
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
            });

            if (!stockData) return res.response(404);

            const stockImages = await StockMedia.findAll({
              attributes: ["name"],
              where: {
                stock_id: stockId,
                code: null,
              },
            });

            stockData.setDataValue(
              "stock_image",
              stockImages.map((data) => data.name)
            );

            const [levelPriceData, rolePriceData] = await Promise.all(
              [
                { Table: Level_Price, fk: level_fk },
                { Table: Role_Price, fk: role_fk },
              ].map(
                async ({ Table, fk }) =>
                  await Table.findOne({
                    attributes: ["price"],
                    where: {
                      [fk]: memberData[fk],
                      stock_id: stockId,
                    },
                  })
              )
            );

            const lowPrice = Math.min(
              +levelPriceData.price || Infinity,
              +rolePriceData.price || Infinity
            );
            lowPrice !== Infinity &&
              stockData.setDataValue("member_price", lowPrice);

            res.response(200, stockData);
          }),
        ],
      },
      {
        path: "category",
        method: "get",
        handlers: [
          frontAuthMiddleware,
          createConnectMiddleware(["StockCategory"]),
          serverErrorWrapper(async (req, res) => {
            const { StockCategory } = req.app;
            const categoryData = await StockCategory.findAll({
              attributes: ["id", "name", "parent"],
            });

            const { result } = categoryData.reduce(
              (polymer, { id, name, parent: parent_id }) => {
                const { dict, result } = polymer;
                dict.has(id)
                  ? (dict.get(id).name = name)
                  : dict.set(id, { id, name, children: [] });

                if (parent_id) {
                  dict.has(parent_id)
                    ? dict.get(parent_id).children.push(dict.get(id))
                    : dict.set(parent_id, {
                        id: parent_id,
                        name: null,
                        children: [dict.get(id)],
                      });
                }

                !parent_id && result.push(dict.get(id));

                return polymer;
              },
              { result: [], dict: new Map() }
            );

            res.response(200, result);
          }),
        ],
      },
      {
        /** `/all` for frontend `/:memberId` for backend */
        path: ":memberId",
        method: "get",
        handlers: [
          async (req, res, next) => {
            req.params.memberId === "all"
              ? frontAuthMiddleware(req, res, next)
              : backAuthMiddleware(req, res, next);
          },
          createConnectMiddleware([
            "Member",
            "Stock",
            "StockCategory",
            "Level_Price",
            "Role_Price",
          ]),
          serverErrorWrapper(async (req, res) => {
            const { Member, Stock, StockCategory, Level_Price, Role_Price } = req.app;
            const { keyword, categoryName } = req.query;

            const role_fk = "member_role_id";
            const level_fk = "member_level_id";

            const member_id =
              req.params.memberId === "all"
                ? req._user.member_id
                : req.params.memberId;

            const memberData = await Member.findByPk(member_id, {
              attributes: ["id", "name", role_fk, level_fk],
            });
            if (!memberData) return res.response(404);

            const [levelPriceData, rolePriceData] = await Promise.all(
              [
                { Table: Level_Price, fk: level_fk },
                { Table: Role_Price, fk: role_fk },
              ].map(
                async ({ Table, fk }) =>
                  await Table.findAll({
                    attributes: ["stock_id", "price"],
                    where: {
                      [fk]: memberData[fk],
                    },
                  })
              )
            );

            const [levelPriceDict, rolePriceDict] = [
              levelPriceData,
              rolePriceData,
            ].map((priceData) =>
              priceData.reduce(
                (dict, data) =>
                  !isNaN(+data.price)
                    ? dict.set(data.stock_id, +data.price)
                    : dict,
                new Map()
              )
            );

            const keywordTargets = ["name", "code", "short_desc"];
            const whereOption = {
              ...(keyword && {
                [Op.or]: keywordTargets.map((fieldName) => ({
                  [fieldName]: { [Op.like]: `%${keyword}%` },
                })),
              }),
              ...(categoryName && {
                stock_category_id: (await StockCategory.findOne({
                  attributes: ["id"],
                  where: {
                    name: {
                      [Op.like]: `%${categoryName}%`,
                    }
                  }
                }))?.id || [],
              })
            };

            const total = await Stock.count({ where: whereOption });
            const { start, size, begin, totalPages } = getPage({
              total,
              ...req.query,
            });

            const stockData = await Stock.findAll({
              attributes: [
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
              where: whereOption,
              offset: begin,
              limit: size,
            });

            const stockList = stockData.map((stock) => {
              const lowPrice = Math.min(
                +levelPriceDict.get(stock.id) || Infinity,
                +rolePriceDict.get(stock.id) || Infinity
              );
              lowPrice !== Infinity && stock.setDataValue("price", lowPrice);

              return stock;
            });

            res.response(200, {
              start,
              size,
              begin,
              total,
              totalPages,
              list: stockList,
            });
          }),
        ],
      },
    ],
  },
  // login-front
  {
    path: "login-front",
    method: "post",
    handlers: [
      createConnectMiddleware(["User", "Member"]),
      serverErrorWrapper(async (req, res) => {
        const { account, password } = req.body;

        const { User, Member } = req.app;

        const user = await User.findOne({
          where: {
            account,
          },
        });
        if (!user?.id) return res.response(403, "帳號錯誤");

        const isPasswordCorrect = bcrypt.compareSync(password, user.password);
        if (!isPasswordCorrect) return res.response(403, "密碼錯誤");

        const member = await Member.findOne({
          where: {
            user_id: user.id,
          },
        });
        if (!member?.id) return res.response(403, "NoMember");

        const payload = {
          user_account: account,
          user_password: password,
          member_id: member.id,
        };
        const exp =
          Math.floor(Date.now() / 1000) +
          (parseInt(process.env.FRONT_EXPIRE_TIME) || 3600);
        const token = jwt.sign({ payload, exp }, process.env.FRONT_SECRET_KEY);

        res.response(200, {
          token: token,
          token_type: "bearer",
          _exp: exp,
        });
      }, "login-front"),
    ],
  },
  // login-back
  {
    path: "login-back",
    method: "post",
    handlers: [
      createConnectMiddleware(["User"]),
      serverErrorWrapper(async function (req, res) {
        const { account, password } = req.body;

        const { User } = req.app;

        const user = await User.findOne({
          where: {
            account,
          },
        });
        if (!user) return res.response(404, "帳號錯誤");

        const isPasswordCorrect = bcrypt.compareSync(password, user.password);
        if (!isPasswordCorrect) return res.response(403, "密碼錯誤");

        const payload = {
          user_account: account,
          user_password: password,
        };
        const exp =
          Math.floor(Date.now() / 1000) +
          (parseInt(process.env.EXPIRE_TIME) || 3600);
        const token = jwt.sign({ payload, exp }, process.env.BACK_SECRET_KEY);

        res.response(200, {
          // id: user.id,
          // name: user.name,
          token: token,
          token_type: "bearer",
          _exp: exp,
        });
      }, "login-back"),
    ],
  },
  // enroll
  {
    path: "enroll",
    method: "post",
    handlers: [
      createConnectMiddleware([
        "Member",
        "MemberContactType",
        "MemberMeta",
        "User",
        "Company",
      ]),
      serverErrorWrapper(async (req, res) => {
        const {
          account,
          password,
          name,
          phone,
          mobile,
          contact_city,
          contact_area,
          contact_street,
          contact_address,
          line_id,
          receive_notice,
        } = req.body;

        if (
          ![
            account,
            password,
            name,
            mobile,
            contact_city,
            contact_area,
            contact_street,
            contact_address,
            line_id,
          ].every(Boolean)
        )
          return res.response(400);

        const _author = createAuthor(account);

        await req.app.sequelize.transaction(async (transaction) => {
          const { Member, MemberContactType, MemberMeta, User, Company } =
            req.app;

          const data = {
            ...req.body,
            ..._author,

            id: "uuid_placeholder",
            country_id: "none",
            code: "_holder",
            company_id: "none",
            member_type_id: "company",
            sex_id: "none",

            shipping_condition_id: "prepaid",
            status_id: "applying",
            member_level_id: "level_E",
            member_role_id: "normal",

            email: account,
            phone: phone || mobile,
          };

          const memberData = await Member.create(data, { transaction });
          const { id: member_id } = memberData;

          await MemberContactType.create(
            {
              member_id,
              contact_type_id: "line",
              im_visible_id: line_id,
              ..._author,
            },
            { transaction }
          );

          await MemberMeta.create(
            {
              member_id,
              meta_key: "receive_notice",
              meta_value: !!receive_notice,
              ..._author,
            },
            { transaction }
          );

          const companyData = await Company.create(
            {
              id: "uuid_placeholder",
              name: account,
              phone,
              address: contact_address,
              ..._author,
            },
            { transaction }
          );
          const { id: company_id } = companyData;

          const userData = await User.create(
            {
              name,
              account,
              password,
              company_id,
              email: account,
              ..._author,
            },
            { transaction }
          );
          const { id: user_id } = userData;

          const date = new Date();
          const yearStr = `${date.getFullYear()}`;
          const monthStr = `${date.getMonth() + 1}`.padStart(2, "0");
          const dateStr = `${date.getDate()}`.padStart(2, "0");

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
          const codePostfix = `${serialNumber + 1}`.padStart(3, "0");

          const code = codePrefix + codePostfix;

          await Member.update(
            { company_id, user_id, code },
            { where: { id: member_id }, transaction }
          );
        });

        res.response(200, "Success enroll member.");
      }),
    ],
  },
  // sale
  {
    path: "sale",
    method: "post",
    handlers: [
      frontAuthMiddleware,
      createConnectMiddleware([
        "Sale",
        "SaleDetail",
        "SaleDetailDelivery",
        "Member",
        "MemberContactPerson",
        "Company",
      ]),
      serverErrorWrapper(async (req, res) => {
        const {
          Sale,
          SaleDetail,
          SaleDetailDelivery,
          Member,
          MemberContactPerson,
          Company,
        } = req.app;

        const member_id = req._user.member_id;
        const _author = createAuthor(req._user.account);

        const memberData = await Member.findByPk(member_id);
        if (!memberData) return res.response(400, `Invalid Member.`);

        const { company_id } = memberData;
        if (!company_id) return res.response(500, `Lose Company.`);
        const companyData = await Company.findByPk(company_id);
        if (!companyData) return res.response(500, `Lose Company.`);

        const receiver = req.body.receiver;
        if (!receiver || !receiver.stockList)
          return res.response(400, `Invalid Person List.`);

        const member = req.body.member;
        if (!member) return res.response(400, `Invalid Member.`);
        await Member.update(
          { ...member, contact_address: "auto" },
          {
            where: {
              id: member_id,
            },
          }
        );

        const personData = {
          country_id: "none",
          member_id,
          name: receiver.name,
          name2: receiver.name,
          contact_city: receiver.contact_city,
          contact_area: receiver.contact_area,
          contact_street: receiver.contact_street,
          contact_address: "auto",
          email: receiver.email,
          phone: receiver.phone,
          is_save: receiver.is_save,
          ..._author,
        };

        const isNewPerson = !receiver.id;

        const newPersonData = isNewPerson
          ? await MemberContactPerson.create({
              id: "uuid_placeholder",
              ...personData,
            })
          : await MemberContactPerson.update(personData, {
              where: {
                id: receiver.id,
              },
            });

        // #region | generate sale code with format: SALYYMMDD00001
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
        // #endregion | generate sale code end

        const { id: sale_id } = await Sale.create({
          id: Date.now(),
          code,
          company_id,
          member_id,
          sale_point_id: "none",
          sale_type_id: "none",
          currencies_id: "NT",
          sale_date: getCurrentTime(),
          main_receiver_id: newPersonData?.id || receiver.id || null,
          ..._author,
        });

        const detailsData = await SaleDetail.bulkCreate(
          receiver.stockList.reduce(
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
                    ..._author,
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
              member_contact_person_id: newPersonData?.id || receiver.id || null,
              receiver_name: receiver.name,
              receiver_phone: receiver.phone,
              receiver_address: [
                receiver.contact_city,
                receiver.contact_area,
                receiver.contact_street,
              ].join(" "),
              ..._author,
            };
          })
        );

        res.response(200, `Success create Sale.`);
      }),
    ],
  },
];

export const registRoutes = (app) => {
  const loopRoutes = (routes, parentPath = "") => {
    routes.forEach((route) => {
      if (route.handlers) {
        app[route.method](`${parentPath}/${route.path}`, route.handlers);

        routesSet.add(`${parentPath}/${route.path}`);
        logger(`\`registRoutes\` register route: ${parentPath}/${route.path}`);
      }

      if (route.children)
        loopRoutes(toArray(route.children), `${parentPath}/${route.path}`);
    });
  };

  try {
    loopRoutes(routes);
  } catch (error) {
    console.log("`registRoutes` error: ", error);
  }
};
