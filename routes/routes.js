import { routesSet } from "../globalVariable.js";
import { logger, toArray } from "../model/helper.js";

import { createBulkConnectMiddleware } from "../model/schemaHelper.js";

const routes = [
  // stock
  {
    path: "receiver",
    children: [
      {
        path: ":memberId",
        method: "get",
        handlers: [
          createBulkConnectMiddleware(["MemberContactPerson"]),
          (req, res, next) => {
            // const member_id = req.params.memberId;

            res.response(200);
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
