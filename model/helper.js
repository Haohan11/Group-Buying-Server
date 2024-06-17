import dotenv from "dotenv";
import { Sequelize } from "sequelize";
import bcrypt from "bcrypt";
import multer from "multer";
import crypto from "crypto";

import Schemas from "../model/schema/schema.js";
import { PermissionTypeSchema } from "../model/schema/rawSchema.js";

import staticPathName from "../model/staticPathName.js";

export const connectToDataBase = async () => {
  dotenv.config();
  const { DB_NAME, DB_USERNAME, DB_PASSWORD, DB_HOST, DB_PORT } = process.env;

  const sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: "mysql",
  });

  try {
    await sequelize.authenticate();
    // console.log('Connection has been established successfully.');
    return sequelize;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    return false;
  }
};

export const createSchema = (sequelize, data) => {
  const { name, cols, option } = data;
  const table = sequelize.define(name, cols, option);
  return table;
};

export const createConnectMiddleware = (tableName, schema) => {
  return async (req, res, next) => {
    const { sequelize } = req.app;
    try {
      const Table = createSchema(sequelize, schema);
      await Table.sync();
      req.app[tableName] = Table;
    } catch (error) {
      return res.response(500);
    }
    next();
  };
};

export const createBulkConnectMiddleware = (tableNames) => {
  if (!Array.isArray(tableNames))
    throw new Error(
      "createBulkConnectMiddleware must accept array type input."
    );
  const schemas = tableNames.map((tableName) => Schemas[`${tableName}Schema`]);
  const noSchemaId = schemas.findIndex((schema) => schema === undefined);

  if (noSchemaId !== -1)
    throw new Error(`Schema not found: ${tableNames[noSchemaId]}`);

  return async (req, res, next) => {
    const { sequelize } = req.app;
    try {
      schemas.forEach((schema, index) => {
        const Table = createSchema(sequelize, schema);
        req.app[tableNames[index]] = Table;
      });
      await sequelize.sync();
    } catch (error) {
      return res.response(500);
    }
    next();
  };
};

export const getConnectMiddleware = (name) =>
  Schemas[`${name}Schema`] &&
  createConnectMiddleware(name, Schemas[`${name}Schema`]);

export const goHash = (() => {
  const saltRound = 10;

  return async (target) => {
    const salt = await bcrypt.genSalt(saltRound);
    const result = await bcrypt.hash(target, salt);
    return result;
  };
})();

export const goHashSync = (() => {
  const saltRound = 10;

  return (target) => {
    const salt = bcrypt.genSaltSync(saltRound);
    const result = bcrypt.hashSync(target, salt);
    return result;
  };
})();

export const customResponse = (() => {
  const httpStatusMessage = {
    100: "Continue",
    101: "Switching Protocols",
    102: "Processing",
    103: "Early Hints",
    200: "OK",
    201: "Created",
    202: "Accepted",
    203: "Non-Authoritative Information",
    204: "No Content",
    205: "Reset Content",
    206: "Partial Content",
    207: "Multi-Status",
    208: "Already Reported",
    226: "IM Used",
    300: "Multiple Choices",
    301: "Moved Permanently",
    302: "Found",
    303: "See Other",
    304: "Not Modified",
    305: "Use Proxy",
    307: "Temporary Redirect",
    308: "Permanent Redirect",
    400: "Bad Request",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    406: "Not Acceptable",
    407: "Proxy Authentication Required",
    408: "Request Timeout",
    409: "Conflict",
    410: "Gone",
    411: "Length Required",
    412: "Precondition Failed",
    413: "Payload Too Large",
    414: "URI Too Long",
    415: "Unsupported Media Type",
    416: "Range Not Satisfiable",
    417: "Expectation Failed",
    418: "I'm a teapot",
    421: "Misdirected Request",
    422: "Unprocessable Entity",
    423: "Locked",
    424: "Failed Dependency",
    425: "Too Early",
    426: "Upgrade Required",
    428: "Precondition Required",
    429: "Too Many Requests",
    431: "Request Header Fields Too Large",
    451: "Unavailable For Legal Reasons",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
    505: "HTTP Version Not Supported",
    506: "Variant Also Negotiates",
    507: "Insufficient Storage",
    508: "Loop Detected",
    510: "Not Extended",
    511: "Network Authentication Required",
  };

  return (res, statusCode, first, second) => {
    if (!res.status)
      throw Error(
        '"customResponse" should receive express res object as first parameter.'
      );

    const codeType = typeof statusCode;
    if (codeType !== "number")
      throw TypeError(`statusCode should be "number" but get ${codeType}.`);

    const result = {
      status: statusCode >= 200 && statusCode <= 299,
      message: httpStatusMessage[statusCode] || "",
      data: {},
    };

    const firstType = typeof first;
    const secondType = typeof second;

    if (secondType === "string") result.message = second;
    if (firstType === "string") result.message = first;

    if (secondType === "object") result.data = second;
    if (firstType === "object") result.data = first;

    return res.status(statusCode).send(result).end();
  };
})();

export const getPage = ({ total, size: qSize, page: qPage, start: qStart }) => {
  const size = parseInt(qSize) || total;
  const totalPages =
    total % size === 0 ? total / size : Math.floor(total / size + 1);
  const page = parseInt(qPage);
  const start = parseInt(qStart) || 0;
  const begin = page ? (page - 1) * size : start;

  return { start, size, begin, totalPages, page };
};

export const addPadding = (() => {
  const checkType = (target) => {
    const type = typeof target;
    if (type === "string") return true;
    throw Error(`addPadding only accept string input but get "${type}" type.`);
  };

  return (symbol) => {
    checkType(symbol);

    return (str, digits) => {
      checkType(str);
      while (str.length < digits) str = symbol + str;
      return str;
    };
  };
})();

export const not0Falsy2Undefined = (target) =>
  target || target === 0 ? target : undefined;

export const createUploadImage = (() => {
  const extMap = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
  };

  return (destination) => {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, `storage/app/public/${destination}`);
      },
      filename: (req, file, cb) => {
        const ext = extMap[file.mimetype];
        file.originalname = Buffer.from(file.originalname, "binary").toString();
        cb(null, crypto.randomUUID() + ext);
      },
    });

    const fileFilter = (req, file, cb) => {
      cb(null, !!extMap[file.mimetype]);
    };

    return multer({ storage, fileFilter });
  };
})();

export const transFilePath = (path) => {
  return path.replace(staticPathName, "");
};

export const queryParam2False = (target) =>
  !(target === undefined || target === "false");

export const filePathAppend = (path) => `${staticPathName}/${path}`;

export const toArray = (target) => (Array.isArray(target) ? target : [target]);

export const formatTime = (time) =>
  time
    ?.toISOString()
    ?.replace(/T/, " ")
    ?.replace(/\..+/, "")
    ?.replace(/-/g, "/");

export const getPermission = async (req, user) => {
  if (!req.app || !req.app.sequelize)
    throw new Error(
      "Invalid req object. Make sure all middleware is setting correctly."
    );

  const {
    role_permission: Role_Permission,
    user_role: User_Role,
    permission: Permission,
  } = req.app.sequelize.models;

  const PermissionType = createSchema(req.app.sequelize, PermissionTypeSchema);

  try {
    const urResult = await User_Role.findOne({ where: { user_id: user.id } });
    if (!urResult || !urResult.role_id) return "NoPermission";

    const permissionTypeList = await PermissionType.findAll({
      attributes: ["id", "code", "name"],
      raw: true,
    });

    const typeDict = permissionTypeList.reduce(
      (dict, type) => ({
        ...dict,
        [type.id]: {
          code: type.code,
          name: type.name,
        },
      }),
      {}
    );

    const permissionIdList = (
      await Role_Permission.findAll({
        attributes: ["permission_id"],
        where: {
          role_id: urResult.role_id,
        },
      })
    ).map((pid) => pid.permission_id);

    const allPermission = await Permission.findAll({
      attributes: ["id", "code", "name", "parent_id", "permission_type_id"],
      raw: true,
    });

    const permissionDict = allPermission.reduce(
      (dict, perm) => ({
        ...dict,
        [perm.id]: perm,
      }),
      {}
    );

    return allPermission.reduce((dict, per) => {
      if (!permissionIdList.includes(per.id)) return dict;

      if (per.name !== "index_item")
        return {
          ...dict,
          [per.code]: {
            ...dict[per.code],
            [typeDict[per.permission_type_id].code]: true,
          },
        };

      return {
        ...dict,
        [permissionDict[per.parent_id].code]: {
          [typeDict[per.permission_type_id].code]: true,
          ...dict[permissionDict[per.parent_id].code],
        },
      };
    }, {});
  } catch {
    return false;
  }
};
