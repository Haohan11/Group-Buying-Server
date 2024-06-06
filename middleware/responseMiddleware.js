import { customResponse } from "../model/helper.js";

const responseMiddleware = (req, res, next) => {
  res.response = (statusCode, message, data) =>
    customResponse(res, statusCode, message, data);
  next();
};

export default responseMiddleware;
