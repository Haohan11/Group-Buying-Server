import { Op } from "sequelize";

import { routesSet } from "../globalVariable.js";
import { logger, toArray } from "../model/helper.js";

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
          async (req, res, next) => {
            const { Member, MemberContactPerson } = req.app;

            const member_id = req.params.memberId;
            const keyword = req.query.keyword;

            const memberData = await Member.findByPk(member_id);
            if (!memberData || !keyword) return next();

            const personData = await MemberContactPerson.findAll({
              where: {
                member_id,
                name: { [Op.like]: `%${keyword}%` },
              },
            });

            res.response(200, personData);
          },
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
