import jwt from "jsonwebtoken";

const authenticationMiddleware = (req, res, next) => {
  let token;
  try {
    token = req.headers["authorization"].split(" ")[1];
  } catch (e) {
    token = "";
  }

  const result = [false, false];

  jwt.verify(token, "front_secret_key", function (err, decoded) {
    if (err) return;

    const {
      payload: { user_account },
    } = decoded;

    req._user = { user_account };
    result[0] = true;
  });

  jwt.verify(token, "my_secret_key", function (err, decoded) {
    if (err) return;

    const {
      payload: { user_account },
    } = decoded;

    req._user = { user_account };

    result[1] = true;
  });

  result.includes(true) ? next() : res.response(401);
};

export default authenticationMiddleware;