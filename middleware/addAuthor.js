// currently use han for all author field
const author = {
  create_name: "han",
  create_id: "admin",
  modify_name: "han",
  modify_id: "admin",
};

const addAuthorMiddleware = (req, res, next) => {
  // req.body = {
  //   ...req.body,
  //   ...author,
  //   _author: author
  // };
  next();
};

export default addAuthorMiddleware;
