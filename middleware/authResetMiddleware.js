import jwt from "jsonwebtoken";

const authResetMiddleware = (req, res, next) => {
  let token;
  try {
    token = req.headers['authorization'].split(' ')[1];
  } catch (e) {
    token = '';
  }

  jwt.verify(token, 'reset_secret_key', function (err, decoded) {
    if (err) {
      return res.response(401);
    } else {
      const { payload: { user_account } } = decoded
      req._user = { user_account }
      next();
    }
  });
};

export default authResetMiddleware;