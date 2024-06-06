const createSchema = (sequelize, data) => {
  const { name, cols, option } = data;
  const table = sequelize.define(name, cols, option);
  return table;
};

export default createSchema;
