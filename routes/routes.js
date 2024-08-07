import { Op } from "sequelize";

import { routesSet } from "../globalVariable.js";
import { logger, toArray, serverErrorWrapper } from "../model/helper.js";

import { createBulkConnectMiddleware } from "../model/schemaHelper.js";

const routes = [
  // receiver
  {
    path: "receiver",
    children: [
      {
        path: ":memberId",
        method: "get",
        handlers: [
          createBulkConnectMiddleware(["Member", "MemberContactPerson"]),
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
        path: ":memberId",
        method: "get",
        handlers: [
          createBulkConnectMiddleware([
            "Member",
            "Stock",
            "Level_Price",
            "Role_Price",
          ]),
          serverErrorWrapper(async (req, res, next) => {
            const { Member, Stock, Level_Price, Role_Price } = req.app;
            const keyword = req.query.keyword;

            const role_fk = "member_role_id";
            const level_fk = "member_level_id";

            const member_id = req.params.memberId;
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
              where: {
                ...(keyword && {
                  [Op.or]: ["name", "code", "short_desc"].map(
                    (fieldName) => ({
                      [fieldName]: { [Op.like]: `%${keyword}%` },
                    })
                  ),
                }),
              },
            });

            const stockList = stockData.map((stock) => {
              const lowPrice = Math.min(
                +levelPriceDict.get(stock.id) || Infinity,
                +rolePriceDict.get(stock.id) || Infinity
              );
              lowPrice !== Infinity && stock.setDataValue("price", lowPrice);

              return stock;
            });

            res.response(200, stockList);
          }),
        ],
      },
    ],
  },
];

export const registRoutes = (app) => {
  const loopRoutes = (routes, parentPath = "") => {
    routes.forEach((route) => {
      if (route.handlers) {
        app[route.method](`${parentPath}/${route.path}`, route.handlers);

        routesSet.add(`${parentPath}/${route.path}`);
        logger(`register route: ${parentPath}/${route.path}`);
      }

      if (route.children)
        loopRoutes(toArray(route.children), `${parentPath}/${route.path}`);
    });
  };

  try {
    loopRoutes(routes);
  } catch (error) {
    console.log(error);
  }
};
