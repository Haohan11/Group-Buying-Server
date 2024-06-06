const findStock = async (req, option) => {
  const {
    stock: Stock,
    stock_color: StockColor,
    stock_color_color_scheme: StockColor_ColorScheme,
    color_scheme: ColorScheme,
    series: Series,
    supplier: Supplier,
    material: Material,
    design: Design,
    environment: Environment,
    stock_material: Stock_Material,
    stock_design: Stock_Design,
    stock_environment: Stock_Environment,
  } = req.app.sequelize.models;

  const stockList = await Stock.findAll({...option, raw: true});

  const MDEdict = {
    material: [Material, Stock_Material],
    design: [Design, Stock_Design],
    environment: [Environment, Stock_Environment],
  };

  const list = await Promise.all(
    stockList.map(async (stockData) => {
      const { id, series_id, supplier_id, enable } = stockData;
      // option raw will cause sequlize query give 0 or 1
      stockData.enable = !!enable;

      // get material, design, environment data
      await Promise.all(
        Object.entries(MDEdict).map(async ([name, models]) => {
          const idList = await models[1].findAll({
            where: {
              stock_id: id,
            },
            attributes: [`${name}_id`],
            raw: true,
          });

          stockData[name] = await models[0].findAll({
            where: {
              id: idList.map((item) => item[`${name}_id`]),
            },
            attributes: ["name", "id", "enable"],
            raw: true,
          });
        })
      );

      stockData.series = await Series.findByPk(series_id);
      stockData.supplier = await Supplier.findByPk(supplier_id);

      const colorList = await StockColor.findAll({
        where: { stock_id: id },
        attributes: [
          "id",
          "name",
          "color_name_id",
          "stock_image",
          "stock_image_name",
          "color_image",
          "color_image_name",
          "removal_image",
          "removal_image_name",
        ],
        raw: true,
      });

      const colorSchemeSet = new Map();
      stockData.colorList = await Promise.all(
        colorList.map(async (colorData) => {
          const { id } = colorData;

          // will give array like: [{color_scheme_id: id}, {color_scheme_id: id}, ...]
          const colorSchemeIdList = await StockColor_ColorScheme.findAll({
            where: {
              stock_color_id: id,
            },
            attributes: ["color_scheme_id"],
            raw: true,
          });

          colorData.colorSchemeList = await Promise.all(
            colorSchemeIdList.map(async ({ color_scheme_id }) => {
              const scheme = await ColorScheme.findOne({
                where: {
                  id: color_scheme_id,
                },
                attributes: ["id", "enable", "name"],
                raw: true,
              });
              colorSchemeSet.set(scheme.id, scheme);
              return scheme;
            })
          );

          return colorData;
        })
      );

      stockData.colorScheme = [...colorSchemeSet.values()];

      return stockData;
    })
  );

  return list;
};

export default findStock;
