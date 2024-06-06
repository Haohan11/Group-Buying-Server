const addUserMiddleware = async (req, res, next) => {
  if (!req._user) return next();

  try {
    const account = req._user.user_account;
    const { user: User } = req.app.sequelize.models;
    const { id, name } = await User.findOne({ where: { account } });
    req._user.user_id = id
    req._user.create_name = req._user.modify_name = name
    req._user.create_id = req._user.modify_id = account
    next();
  } catch {
    res.response(500);
  }
};

export default addUserMiddleware;
