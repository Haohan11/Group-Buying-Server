import versionText from "../versionText.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";

import { routesSet } from "../globalVariable.js";
import {
  logger,
  toArray,
  serverErrorWrapper,
  getPage,
} from "../model/helper.js";

import {
  frontAuthMiddleware,
  backAuthMiddleware,
} from "../middleware/middleware.js";

import { createConnectMiddleware } from "../model/schemaHelper.js";

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
            const { Member, Stock, StockMedia, Level_Price, Role_Price } = req.app;
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

            stockData.setDataValue("stock_image", stockImages.map(data => data.name));

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
            lowPrice !== Infinity && stockData.setDataValue("member_price", lowPrice);

            res.response(200, stockData);
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
            "Level_Price",
            "Role_Price",
          ]),
          serverErrorWrapper(async (req, res) => {
            const { Member, Stock, Level_Price, Role_Price } = req.app;
            const { keyword } = req.query;

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
  // sign-in
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
