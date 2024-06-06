import allValidator from "../model/validate/validator.js";
import multer from "multer";
import fs from "fs";
import { Op } from "sequelize";

import findStock from "./findStock.js";
import getAllPermission from "./getAllPermission.js";

import {
  goHash,
  getPage,
  not0Falsy2Undefined,
  createUploadImage,
  toArray,
  transFilePath,
  filePathAppend,
  queryParam2False,
  formatTime,
} from "../model/helper.js";

const uploadStockImage = createUploadImage("stock");
const uploadEnvImage = createUploadImage("env");

/*
  About regularController:

  create "create", "read", "update" method for "get", "post", "put" request api in router.js.

  Using tableName to access model instance ( req.app[tableName] ) which created by connectionMiddleware ( check connectToTable.js ).

  Using tableName to get validator ( check validator.js ).

  Creates a regular controller object for handling database operations.
  @author haohan
  
  @param {Object} options - The options for creating the controller.
  @param {string} options.tableName - The name of the database table.
  @param {array} options.queryAttribute - The attribute to use in queries.

  @returns {Object} A controller object with CRUD methods.
*/

const makeRegularController = ({
  tableName,
  create = {},
  read = {},
  update = {},
}) => {
  const validator = allValidator[`validate${tableName}`];
  return {
    create: [
      multer().none(),
      async (req, res) => {
        const tableConnection = req.app[tableName];
        const { handleData = (req, data) => data } = create;

        const validatedData = await validator({ ...req.body, ...req._user });
        if (validatedData === false)
          return res.response(400, "Invalid format.");

        const data = await handleData(req, validatedData);
        if (data === false) return res.response(500);

        try {
          await tableConnection.create(data);
          res.response(200, `Success added ${tableName}`);
        } catch (error) {
          // log sql message with error.original.sqlMessage
          console.log(error);
          res.response(500);
        }
      },
    ],
    read: async (req, res) => {
      const tableConnection = req.app[tableName];
      const { queryAttribute = [] } = read;
      queryAttribute.includes("create_time") ||
        queryAttribute.push("create_time");
      const keywordArray = [
        {
          name: { [Op.like]: `%${req.query.keyword}%` },
        },
        {
          code: { [Op.like]: `%${req.query.keyword}%` },
        },
        {
          email: { [Op.like]: `%${req.query.keyword}%` },
        },
        {
          id_code: { [Op.like]: `%${req.query.keyword}%` },
        },
        {
          phone_number: { [Op.like]: `%${req.query.keyword}%` },
        },
      ];

      const opArray = keywordArray.filter((item) =>
        queryAttribute.includes(Object.keys(item)[0])
      );

      const onlyEnable = queryParam2False(req.query.onlyEnable);
      const onlyDisable = queryParam2False(req.query.onlyDisable);

      const whereOption = {
        where: {
          ...(onlyEnable && { enable: true }),
          ...(onlyDisable && { enable: false }),
          ...(req.query.keyword && {
            [Op.or]: opArray,
          }),
        },
      };
      // console.log("req.query.item", req.query.item);

      const createSort =
        req.query.sort === undefined ||
        req.query.sort === "undefined" ||
        req.query.sort === ""
          ? []
          : ["create_time", req.query.sort];
      const nameSort =
        req.query.item === undefined ||
        req.query.item === "undefined" ||
        req.query.item === ""
          ? []
          : ["name", req.query.item];

      const sortArray = [createSort, nameSort];

      const filterArray = sortArray.filter((item) =>
        queryAttribute.includes(item[0])
      );

      try {
        const total = await tableConnection.count(whereOption);
        const { start, size, begin, totalPages } = getPage({
          total,
          ...req.query,
        });

        const list = await tableConnection.findAll({
          offset: begin,
          limit: size,
          attributes: queryAttribute,
          ...whereOption,
          ...(filterArray.length > 0 && { order: filterArray }),
        });

        return res.response(200, {
          start,
          size,
          begin,
          total,
          totalPages,
          list,
        });
      } catch (error) {
        // log sql message with error.original.sqlMessage
        console.log(error);
        res.response(500);
      }
    },
    update: [
      multer().none(),
      async (req, res) => {
        const tableConnection = req.app[tableName];
        const { handleData = (req, data) => data } = update;

        // get id before check because checkdata will also remove data that is not in validate schema
        const id = parseInt(req.body.id);
        if (isNaN(id)) return res.response(400, "Invalid id.");

        const validatedData = await validator({ ...req.body, ...req._user });
        if (validatedData === false)
          return res.response(400, "Invalid format.");

        const data = await handleData(req, validatedData);
        if (data === false) return res.response(500);

        try {
          await tableConnection.update(data, {
            where: {
              id,
            },
          });
          res.response(200, `Updated ${tableName} data success.`);
        } catch (error) {
          // log sql message with error.original.sqlMessage
          console.log(error);
          res.response(500);
        }
      },
    ],
  };
};

export const SeriesController = makeRegularController({
  tableName: "Series",
  read: {
    queryAttribute: ["id", "enable", "code", "name", "comment"],
  },
});

export const ColorSchemeController = makeRegularController({
  tableName: "ColorScheme",
  read: {
    queryAttribute: ["id", "enable", "name", "comment"],
  },
});

export const ColorNameController = (() => {
  const { create, read } = makeRegularController({
    tableName: "ColorName",
    read: {
      queryAttribute: ["id", "enable", "name", "comment"],
    },
  });

  const update = [
    multer().none(),
    async (req, res) => {
      const { ColorName, StockColor } = req.app;

      // get id before check because checkdata will also remove data that is not in validate schema
      const id = parseInt(req.body.id);
      if (isNaN(id)) return res.response(400, "Invalid id.");

      const { validateColorName: validator } = allValidator;

      const colorNameData = await validator({ ...req.body, ...req._user });
      if (colorNameData === false) return res.response(400, "Invalid format.");

      try {
        await ColorName.update(colorNameData, {
          where: {
            id,
          },
        });

        const { name, modify_id, modify_name } = colorNameData;
        await StockColor.update(
          { name, modify_id, modify_name },
          {
            where: {
              color_name_id: id,
            },
          }
        );

        res.response(200, `Updated ${tableName} data success.`);
      } catch (error) {
        // log sql message with error.original.sqlMessage
        console.log(error);
        res.response(500);
      }
    },
  ];

  return { create, read, update };
})();

export const DesignController = makeRegularController({
  tableName: "Design",
  read: {
    queryAttribute: ["id", "enable", "name", "comment"],
  },
});

export const MaterialController = makeRegularController({
  tableName: "Material",
  read: {
    queryAttribute: ["id", "enable", "name", "comment"],
  },
});

export const SupplierController = makeRegularController({
  tableName: "Supplier",
  read: {
    queryAttribute: ["id", "enable", "code", "name", "comment"],
  },
});

export const EmployeeController = {
  create: [
    multer().none(),
    async (req, res) => {
      const { Employee, User, User_Role } = req.app;

      const role_id = parseInt(req.body.role);
      if (isNaN(role_id)) return res.response(400, "Invalid role id.");

      const { validateEmployee: validator } = allValidator;
      const validatedData = await validator({ ...req.body, ...req._user });
      if (validatedData === false) return res.response(400, "Invalid format.");

      const { password } = validatedData;
      const hashedPassword = await goHash(password);

      const code = await generateCode(Employee);
      if (code === false) return res.response(500);

      try {
        const { name, email } = validatedData;
        const { id: user_id } = await User.create({
          name,
          account: email,
          email,
          password: hashedPassword,
          ...req._user,
        });

        await Employee.create({
          ...validatedData,
          user_id,
          password: hashedPassword,
          code,
        });

        await User_Role.create({
          ...req._user,
          user_id,
          role_id,
        });

        res.response(200, `Success added Employee and User.`);
      } catch (error) {
        // log sql message with error.original.sqlMessage
        if (error.name === "SequelizeUniqueConstraintError")
          return res.response(400, "Duplicate account.");
        console.log(error);
        res.response(500);
      }
    },
  ],
  read: async (req, res) => {
    const { Employee, User_Role, Role } = req.app;
    const queryAttribute = [
      "id",
      "enable",
      "role",
      "code",
      "name",
      "id_code",
      "phone_number",
      "email",
      "user_id",
      "create_time",
    ];

    const keywordArray = [
      "name",
      "code",
      "email",
      "id_code",
      "phone_number",
    ].map((name) => ({
      [name]: { [Op.like]: `%${req.query.keyword}%` },
    }));

    const opArray = keywordArray.filter((item) =>
      queryAttribute.includes(Object.keys(item)[0])
    );

    const onlyEnable = queryParam2False(req.query.onlyEnable);
    const onlyDisable = queryParam2False(req.query.onlyDisable);

    const whereOption = {
      where: {
        ...(onlyEnable && { enable: true }),
        ...(onlyDisable && { enable: false }),
        ...(req.query.keyword && {
          [Op.or]: opArray,
        }),
      },
    };

    const createSort =
      req.query.sort === undefined ||
      req.query.sort === "undefined" ||
      req.query.sort === ""
        ? []
        : ["create_time", req.query.sort];
    const nameSort =
      req.query.item === undefined ||
      req.query.item === "undefined" ||
      req.query.item === ""
        ? []
        : ["name", req.query.item];

    const sortArray = [createSort, nameSort];

    const filterArray = sortArray.filter((item) =>
      queryAttribute.includes(item[0])
    );

    try {
      const total = await Employee.count(whereOption);
      const { start, size, begin, totalPages } = getPage({
        total,
        ...req.query,
      });

      const employeeList = await Employee.findAll({
        offset: begin,
        limit: size,
        attributes: queryAttribute,
        ...whereOption,
        ...(filterArray.length > 0 && { order: filterArray }),
        raw: true,
      });

      const list = await Promise.all(
        employeeList.map(async (employee) => {
          const result = await User_Role.findOne({
            attributes: ["role_id"],
            where: {
              user_id: employee.user_id,
            },
          });

          if (!result) return employee;

          const { name } = await Role.findByPk(result.role_id, {
            attributes: ["name"],
          });

          return {
            ...employee,
            enable: !!employee.enable,
            ...(result && { role: result.role_id, role_name: name }),
          };
        })
      );

      return res.response(200, {
        start,
        size,
        begin,
        total,
        totalPages,
        list,
      });
    } catch (error) {
      // log sql message with error.original.sqlMessage
      console.log(error);
      res.response(500);
    }
  },
  update: [
    multer().none(),
    async (req, res) => {
      const { Employee, User, User_Role } = req.app;

      const id = parseInt(req.body.id);
      if (isNaN(id)) return res.response(400, "Invalid id.");

      const role_id = parseInt(req.body.role);
      if (isNaN(role_id)) return res.response(400, "Invalid role id.");

      try {
        const employeeData = await Employee.findByPk(id, {
          attributes: ["user_id", "email", "password"],
        });
        if (!employeeData) return res.response(400, "Employee Not Found.");

        const {
          user_id,
          email: oldEmail,
          password: oldPassword,
        } = employeeData;

        const { validateEmployee: validator } = allValidator;
        const validatedData = await validator({
          ...req.body,
          ...req._user,
          password: req.body.password || oldPassword,
        });
        if (validatedData === false)
          return res.response(400, "Invalid format.");

        const { password } = validatedData;
        const hashedPassword = req.body.password
          ? await goHash(password)
          : oldPassword;

        const { name, email } = validatedData;
        user_id !== null &&
          (await User.update(
            {
              name,
              ...(oldEmail !== email && {
                account: email,
              }),
              email,
              password: hashedPassword,
              ...req._user,
            },
            {
              where: {
                id: user_id,
              },
            }
          ));

        await Employee.update(
          { ...validatedData, password: hashedPassword },
          {
            where: {
              id,
            },
          }
        );

        const { create_id, create_name, modify_id, modify_name } = req._user;
        const ur = await User_Role.findOne({
          where: {
            user_id,
          },
        });
        ur === null
          ? await User_Role.create({
              user_id,
              create_id,
              create_name,
              modify_id,
              modify_name,
              role_id,
            })
          : await User_Role.update(
              { create_id, create_name, modify_id, modify_name, role_id },
              {
                where: {
                  user_id,
                },
              }
            );

        res.response(200, `Updated Employee and User data success.`);
      } catch (error) {
        // log sql message with error.original.sqlMessage
        if (error.name === "SequelizeUniqueConstraintError")
          return res.response(400, "Duplicate account.");
        console.log(error);
        res.response(500);
      }
    },
  ],
};

const generateCode = async (Employee) => {
  const date = new Date();
  const yearString = (date.getFullYear() - 1911).toString();
  const month = (date.getMonth() + 1).toString();
  const monthString = padding(month, 2);

  const id = await getId(Employee);
  if (id === false) return false;

  const idString = padding(id, 3);

  return yearString + monthString + idString;
};

const getId = async (Employee) => {
  try {
    const row = await Employee.findOne({
      attributes: ["id"],
      order: [["id", "DESC"]],
    });
    return row?.id || 0;
  } catch (error) {
    console.log(error);
    return false;
  }
};

const padding = (num, digits) => {
  let str = num.toString();
  while (str.length < digits) str = "0" + str;
  return str;
};

export const AccountController = {
  read: [
    async (req, res) => {
      const { Employee } = req.app;
      const { user_id } = req._user;

      try {
        const employee = await Employee.findOne({
          attributes: ["code", "email", "phone_number", "name"],
          where: {
            user_id,
          },
        });

        res.response(200, employee);
      } catch (error) {
        // log sql message with error.original.sqlMessage
        console.log(error);
        res.response(500);
      }
    },
  ],
  update: [
    multer().none(),
    async (req, res) => {
      const { Employee, User } = req.app;
      const { user_id } = req._user;
      const { validateEmployee: validator } = allValidator;

      const employeeData = await Employee.findOne({
        where: { user_id },
        raw: true,
      });

      if (!employeeData) return res.response(400, "No such employee.");

      const {
        email: oldEmail,
        password: oldPassword,
        ...oldData
      } = employeeData;

      const validatedData = await validator({
        ...oldData,
        ...req.body,
        ...req._user,
        password: req.body.password || oldPassword,
      });
      if (validatedData === false) return res.response(400, "Invalid format.");

      const { id_code, email, name, phone_number, password } = validatedData;
      const hashedPassword = req.body.password
        ? await goHash(password)
        : oldPassword;

      try {
        await Employee.update(
          { ...validatedData, password: hashedPassword },
          { where: { user_id } }
        );
        await User.update(
          {
            name,
            id_code,
            ...(oldEmail !== email && {
              account: email,
            }),
            phone_number,
            email,
            password: hashedPassword,
            ...req._user,
          },
          {
            where: { id: user_id },
          }
        );

        res.response(200);
      } catch (error) {
        // log sql message with error.original.sqlMessage
        console.log(error);
        res.response(500);
      }
    },
  ],
};

export const EnvironmentController = {
  create: [
    uploadEnvImage.fields([{ name: "env_image" }, { name: "mask_image" }]),
    async (req, res) => {
      const { Environment } = req.app;

      const { validateEnvironment: validator } = allValidator;
      const validatedData = await validator({ ...req.body, ...req._user });
      if (validatedData === false) return res.response(400, "Invalid format.");

      try {
        await Environment.create({
          ...validatedData,
          env_image_name: req.files["env_image"][0].originalname,
          env_image: transFilePath(req.files["env_image"][0].path),
          mask_image_name: req.files["mask_image"][0].originalname,
          mask_image: transFilePath(req.files["mask_image"][0].path),
        });
        res.response(200, "Success added Environment.");
      } catch (error) {
        console.log(error);
        res.response(500);
      }
    },
  ],
  update: [
    uploadEnvImage.fields([{ name: "env_image" }, { name: "mask_image" }]),
    async (req, res) => {
      const { Environment } = req.app;

      const { validateEnvironment: validator } = allValidator;
      const validatedData = await validator({ ...req.body, ...req._user });
      if (validatedData === false) return res.response(400, "Invalid format.");

      const id = parseInt(req.body.id);
      if (isNaN(id)) return res.response(400, "Invalid id.");

      const { count: enableCount, rows: enableEnvList } =
        await Environment.findAndCountAll({
          where: {
            enable: true,
          },
        });

      if (
        enableCount === 1 &&
        enableEnvList.map((item) => item.id).includes(id) &&
        !validatedData.enable
      ) {
        return res.response(403, "NotAllowDisableAll");
      }

      delete validatedData.env_image;
      delete validatedData.mask_image;

      const envImageChanged = !!req.files["env_image"]?.[0];
      const maskImageChanged = !!req.files["mask_image"]?.[0];

      try {
        await Environment.update(
          {
            ...validatedData,
            ...(envImageChanged && {
              env_image_name: req.files["env_image"][0].originalname,
              env_image: transFilePath(req.files["env_image"][0].path),
            }),
            ...(maskImageChanged && {
              mask_image_name: req.files["mask_image"][0].originalname,
              mask_image: transFilePath(req.files["mask_image"][0].path),
            }),
          },
          { where: { id } }
        );
        res.response(200, "Success updated Environment.");
      } catch (error) {
        console.log(error);
        res.response(500);
      }
    },
  ],
  read: makeRegularController({
    tableName: "Environment",
    read: {
      queryAttribute: [
        "id",
        "enable",
        "name",
        "env_image",
        "mask_image",
        "cropline",
        "comment",
        "width",
        "perspect",
      ],
    },
  })["read"],
};

export const StockController = {
  create: [
    uploadStockImage.array("colorImages"),
    async (req, res) => {
      const {
        Stock,
        Stock_Material,
        Stock_Design,
        Stock_Environment,
        StockColor,
        ColorName,
        StockColor_ColorScheme,
      } = req.app;

      const { validateStock: validator } = allValidator;

      const validatedData = await validator({
        ...req.body,
        ...req._user,
        series_id: req.body.series,
        supplier_id: not0Falsy2Undefined(req.body.supplier),
      });

      if (validatedData === false) return res.response(400, "Invalid format.");

      const { create_name, create_id, modify_name, modify_id } = req._user;
      const author = { create_name, create_id, modify_name, modify_id };

      const result = {
        message: "Success inserted",
        data: {},
      };

      try {
        /*  
          req.body may contain color data like: 
          { 
            color_0: id, 
            color_1: id, ...,
            colorScheme_0: [...],  
            colorScheme_1: [...], ..., 
          }
          Loop req.body for wrap color_index and colorScheme_index to 
          object in array like: [{ color: id, colorScheme: []}, ...] 
        */
        const colorData = Object.entries(req.body)
          .reduce((list, [key, value]) => {
            const [target, _index] = key.split("_");
            const index = parseInt(_index);
            if (
              (target !== "color" && target !== "colorScheme") ||
              isNaN(index)
            )
              return list;

            if (target === "color" && isNaN(parseInt(value))) return list;

            list[index] = {
              ...list[index],
              [target]: target === "color" ? value : toArray(value),
            };

            return list;
          }, [])
          .filter(Boolean);

        if (colorData.length * 3 !== req.files.length) return res.response(400);

        // only color data is validate then we create stock
        const stock = await Stock.create(validatedData);

        // save material, design, environment
        await Promise.all(
          Object.entries({
            material: Stock_Material,
            design: Stock_Design,
            environment: Stock_Environment,
          }).map(async ([modelName, Model]) => {
            const insert_data =
              req.body[modelName] &&
              toArray(req.body[modelName]).reduce(
                (list, id) =>
                  not0Falsy2Undefined(id) === undefined
                    ? list
                    : [
                        ...list,
                        {
                          ...author,
                          stock_id: stock.id,
                          [`${modelName}_id`]: +not0Falsy2Undefined(id),
                        },
                      ],
                []
              );

            if (!insert_data) return;

            Model.removeAttribute("id");
            await Model.bulkCreate(insert_data);

            result.message += ` "${modelName}",`;
          })
        );

        // save color data
        await Promise.all(
          colorData.map(async ({ color, colorScheme }, index) => {
            if ((color !== 0 && !color) || !colorScheme)
              return console.warn(
                `Invalid ${!colorScheme ? "colorScheme" : "color"}_${index}.`
              );

            const { name } = await ColorName.findByPk(color);
            if (!name) return;

            const { id: stock_color_id } = await StockColor.create({
              ...author,
              stock_id: stock.id,
              name,
              color_name_id: color,
              stock_image_name: req.files[index * 3].originalname,
              stock_image: transFilePath(req.files[index * 3].path),
              color_image_name: req.files[index * 3 + 1].originalname,
              color_image: transFilePath(req.files[index * 3 + 1].path),
              removal_image_name: req.files[index * 3 + 2].originalname,
              removal_image: transFilePath(req.files[index * 3 + 2].path),
            });
            result.message += " stock_color,";

            // save colorScheme data
            const insert_data = colorScheme.reduce((list, scheme) => {
              const schemeId = parseInt(scheme);
              return isNaN(schemeId)
                ? list
                : [
                    ...list,
                    {
                      ...author,
                      color_scheme_id: schemeId,
                      stock_color_id,
                    },
                  ];
            }, []);

            // junction table has no id column
            StockColor_ColorScheme.removeAttribute("id");
            await StockColor_ColorScheme.bulkCreate(insert_data);

            result.message += " stockcolor_colorscheme,";
          })
        );

        res.response(200, result.message, req.body);
      } catch (error) {
        // log sql message with error.original.sqlMessage
        console.log(error);
        res.response(500, `Internal server error and ${result.message}.`);
      }
    },
  ],
  read: async (req, res) => {
    const {
      Stock,
      StockColor,
      StockColor_ColorScheme,
      ColorScheme,
      Series,
      Supplier,
      Material,
      Design,
      Environment,
      Stock_Material,
      Stock_Design,
      Stock_Environment,
    } = req.app;

    // 搜尋商品維護
    //
    try {
      const onlyEnable = queryParam2False(req.query.onlyEnable);
      const onlyDisable = queryParam2False(req.query.onlyDisable);

      const keyword = req.query.keyword;

      const seriesArray = await Series.findAll({
        where: {
          name: {
            [Op.like]: `%${keyword}%`,
          },
        },
      });

      const supplierArray = await Supplier.findAll({
        where: {
          name: {
            [Op.like]: `%${keyword}%`,
          },
        },
      });

      const stockColorArray = await StockColor.findAll({
        where: {
          name: {
            [Op.like]: `%${keyword}%`,
          },
        },
      });

      const ColorSchemeSearch = await ColorScheme.findAll({
        where: {
          name: {
            [Op.like]: `%${keyword}%`,
          },
        },
      });
      const stockColorSchemeSearch = await StockColor_ColorScheme.findAll({
        where: {
          color_scheme_id: ColorSchemeSearch.map((v) => v.id),
        },
      });
      const stockColorIdArray = await StockColor.findAll({
        where: {
          id: stockColorSchemeSearch.map((v) => v.stock_color_id),
        },
      });

      const materialNameSearch = await Material.findAll({
        where: {
          name: {
            [Op.like]: `%${keyword}%`,
          },
        },
      });

      const StockMaterialArray = await Stock_Material.findAll({
        where: {
          material_id: materialNameSearch.map((v) => v.id),
        },
      });
      const designNameSearch = await Design.findAll({
        where: {
          name: {
            [Op.like]: `%${keyword}%`,
          },
        },
      });

      const StockDesignArray = await Stock_Design.findAll({
        where: {
          design_id: designNameSearch.map((v) => v.id),
        },
      });

      const whereOption = {
        where: {
          ...(onlyEnable && { enable: true }),
          ...(onlyDisable && { enable: false }),
          ...(req.query.keyword && {
            [Op.or]: [
              {
                name: { [Op.like]: `%${req.query.keyword}%` },
              },
              { code: { [Op.like]: `%${req.query.keyword}%` } },
              { description: { [Op.like]: `%${req.query.keyword}%` } },
              { series_id: seriesArray.map((v) => v.id) },
              { supplier_id: supplierArray.map((v) => v.id) },
              { id: stockColorArray.map((v) => v.stock_id) },
              { id: stockColorIdArray.map((v) => v.stock_id) },
              { id: StockMaterialArray.map((v) => v.stock_id) },
              { id: StockDesignArray.map((v) => v.stock_id) },
            ],
          }),
        },
      };

      // handle filter
      const where = whereOption.where;
      const idDict = [];

      const filterTime =
        req.query.sort === "" ||
        req.query.sort === "undefined" ||
        req.query.sort === undefined
          ? req.query.item === "ASC" || req.query.item === "DESC"
            ? []
            : ["create_time", "DESC"]
          : ["create_time", req.query.sort];
      const filterName =
        req.query.item === "" ||
        req.query.item === undefined ||
        req.query.item === "undefined"
          ? []
          : ["name", req.query.item];

      const sortArray = [filterTime, filterName].filter((v) => v.length > 0);
      req.query.colorScheme &&
        (await (async () => {
          const colorScheme = JSON.parse(req.query.colorScheme);
          const colorIdList = await StockColor_ColorScheme.findAll({
            attributes: ["stock_color_id"],
            where: { color_scheme_id: colorScheme },
          });

          const stockIdList = await StockColor.findAll({
            attributes: ["stock_id"],
            where: {
              id: colorIdList.map((color) => color.stock_color_id),
            },
          });

          idDict.push([...new Set(stockIdList.map((stock) => stock.stock_id))]);
        })());

      await Promise.all(
        Object.entries({
          design: Stock_Design,
          material: Stock_Material,
        }).map(async ([name, Model]) => {
          if (!req.query[name]) return;
          const target = JSON.parse(req.query[name]);
          const stockIdList = await Model.findAll({
            attributes: ["stock_id"],
            where: { [`${name}_id`]: target },
          });

          idDict.push(stockIdList.map((stock) => stock.stock_id));
        })
      );

      idDict.length === 1 && (where.id = idDict[0]);
      idDict.length === 2 &&
        (where.id = idDict[0].filter((id) => idDict[1].includes(id)));
      idDict.length === 3 &&
        (where.id = idDict[0].filter(
          (id) => idDict[1].includes(id) && idDict[2].includes(id)
        ));

      req.query.stockName &&
        (where.name = { [Op.like]: `%${req.query.stockName}%` });

      ["block", "absorption"].forEach((fieldName) => {
        ["1", "2", "3", "4", "5"].includes(req.query[fieldName]) &&
          (where[fieldName] = req.query[fieldName]);
      });

      const total = await Stock.count(whereOption);
      const { start, size, begin, totalPages } = getPage({
        ...req.query,
        total,
      });

      const stockList = (
        await Stock.findAll({
          offset: begin,
          limit: size,
          attributes: [
            "id",
            "enable",
            "code",
            "name",
            "series_id",
            "supplier_id",
            "block",
            "absorption",
            "description",
            "create_time",
          ],
          ...whereOption,
          order: sortArray,
          raw: true,
        })
      ).map((stock) => ({
        ...stock,
        create_time: formatTime(stock.create_time),
      }));

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

      res.response(200, {
        start,
        size,
        begin,
        total,
        totalPages,
        list,
      });
    } catch (error) {
      // log sql message with error.original.sqlMessage
      console.log("error in controller.js:", error);
      res.response(500);
    }
  },
  update: [
    uploadStockImage.any(),
    (req, res, next) => {
      req.files = req.files.reduce(
        (dict, fileData) => ({
          ...dict,
          [fileData.fieldname]: { ...fileData },
        }),
        {}
      );
      next();
    },
    async (req, res) => {
      const {
        Stock,
        Stock_Material,
        Stock_Design,
        Stock_Environment,
        StockColor,
        ColorName,
        StockColor_ColorScheme,
      } = req.app;

      const { validateStock: validator } = allValidator;

      const validatedData = await validator({
        ...req.body,
        ...req._user,
        series_id: req.body.series,
        supplier_id: not0Falsy2Undefined(JSON.parse(req.body.supplier)),
      });

      if (validatedData === false) return res.response(400, "Invalid format.");

      const { id: stockId } = req.body;
      if (isNaN(parseInt(stockId))) return res.response(400, "Invalid id.");

      const { create_name, create_id, modify_name, modify_id } = req._user;
      const author = { create_name, create_id, modify_name, modify_id };

      const result = { message: "success updated: " };
      try {
        const preserveIds = [];

        req.body.colorList &&
          (await Promise.all(
            toArray(req.body.colorList).map(async (rawData) => {
              const color = JSON.parse(rawData);
              const { id: colorId, color_name_id, colorSchemes } = color;
              const isNewColor = colorId < 0;

              const { name } = await ColorName.findByPk(color_name_id);
              if (!name) {
                const wrongNameError = new Error("Invalid name id.");
                wrongNameError.name = "wrongNameId";
                throw wrongNameError;
              }

              const newData = {
                ...(!isNewColor && { id: colorId }),
                stock_id: stockId,
                color_name_id,
                name,
                ...author,
                ...["stock", "color", "removal"].reduce(
                  (imageDict, name, index) => {
                    if (!req.files[`colorImages_${colorId}_${index}`]) {
                      if (!isNewColor) return imageDict;
                      const loseImageError = new Error(`Lose ${name} image.`);
                      loseImageError.name = "ImageLose";
                      throw loseImageError;
                    }
                    return {
                      ...imageDict,
                      [`${name}_image_name`]:
                        req.files[`colorImages_${colorId}_${index}`]
                          .originalname,
                      [`${name}_image`]: transFilePath(
                        req.files[`colorImages_${colorId}_${index}`].path
                      ),
                    };
                  },
                  {}
                ),
              };

              const stock_color_id = await {
                async true() {
                  const { id } = await StockColor.create(newData);
                  return id;
                },
                async false() {
                  await StockColor.update(newData, { where: { id: colorId } });
                  return colorId;
                },
              }[isNewColor.toString()]();
              preserveIds.push(stock_color_id);

              const insert_data = colorSchemes.reduce((list, scheme) => {
                const schemeId = parseInt(scheme);
                return isNaN(schemeId)
                  ? list
                  : [
                      ...list,
                      {
                        ...author,
                        color_scheme_id: schemeId,
                        stock_color_id,
                      },
                    ];
              }, []);

              StockColor_ColorScheme.removeAttribute("id");
              await StockColor_ColorScheme.bulkCreate(insert_data, {
                updateOnDuplicate: Object.keys(author),
              });
              !isNewColor &&
                (await StockColor_ColorScheme.destroy({
                  where: {
                    stock_color_id,
                    color_scheme_id: {
                      [Op.notIn]: colorSchemes,
                    },
                  },
                }));
            })
          ));
        result.message += "color schemes, ";

        // save material, design, environment
        await Promise.all(
          Object.entries({
            material: Stock_Material,
            design: Stock_Design,
            environment: Stock_Environment,
          }).map(async ([modelName, Model]) => {
            const listData = req.body[modelName] ?? [];
            const insert_data = toArray(listData).reduce(
              (list, id) =>
                not0Falsy2Undefined(id) === undefined
                  ? list
                  : [
                      ...list,
                      {
                        ...author,
                        stock_id: stockId,
                        [`${modelName}_id`]: +not0Falsy2Undefined(id),
                      },
                    ],
              []
            );

            Model.removeAttribute("id");
            await Model.bulkCreate(insert_data, {
              updateOnDuplicate: Object.keys(author),
            });

            await Model.destroy({
              where: {
                stock_id: stockId,
                [`${modelName}_id`]: {
                  [Op.notIn]: toArray(listData),
                },
              },
            });
            result.message += `"${modelName}", `;
          })
        );

        await Stock.update(validatedData, {
          where: { id: stockId },
        });
        result.message += "stock, ";

        // delete image file
        try {
          const imagePath = await StockColor.findAll({
            where: {
              stock_id: stockId,
              id: {
                [Op.notIn]: preserveIds,
              },
            },
            attributes: ["stock_image", "color_image", "removal_image"],
          });

          await Promise.all(
            imagePath.map(async (item) => {
              ["stock_image", "color_image", "removal_image"].map((name) => {
                if (!item[name]) return;
                const path = filePathAppend(item[name]).replace(/\\/g, "/");
                fs.unlink(path, () => {
                  console.log(`Success deleted ${path}.`);
                });
              });
            })
          );
        } catch (error) {
          console.warn(error);
        }

        await StockColor.destroy({
          where: {
            stock_id: stockId,
            id: {
              [Op.notIn]: preserveIds,
            },
          },
        });
        result.message += "stock color.";

        res.response(200, result.message);
      } catch (error) {
        // log sql message with error.original.sqlMessage
        console.log(error);
        if (["ImageLose", "wrongNameId"].includes(error.name))
          return res.response(400, error.message);

        res.response(500, `Internal server error and ${result.message}.`);
      }
    },
  ],
};

export const CombinationController = {
  create: [
    multer().none(),
    async (req, res) => {
      const { Combination, Combination_Stock } = req.app;

      // check stock list first
      try {
        const stockList = JSON.parse(req.body.stockList);
        if (!Array.isArray(stockList)) throw new Error();
      } catch {
        return res.response(400, "Invalid stock list.");
      }

      const { validateCombination: validator } = allValidator;

      const validatedData = await validator({ ...req.body, ...req._user });

      if (validatedData === false) return res.response(400, "Invalid format.");

      const { create_name, create_id, modify_name, modify_id } = req._user;
      const author = { create_name, create_id, modify_name, modify_id };

      try {
        const { id: combination_id } = await Combination.create(validatedData);

        const stockList = JSON.parse(req.body.stockList);

        const insert_data = stockList.map((stockId) => {
          const stock_id = parseInt(stockId);
          if (isNaN(stock_id)) {
            const error = new Error("Invalid stock id.");
            error.name = "wrongStockId";
            throw error;
          }
          return { ...author, combination_id, stock_id };
        });

        Combination_Stock.removeAttribute("id");
        await Combination_Stock.bulkCreate(insert_data);

        res.response(200, "Success added Combination.");
      } catch (error) {
        // log sql message with error.original.sqlMessage
        console.log(error);
        if (error.name === "wrongStockId")
          return res.response(400, error.message);
        res.response(500);
      }
    },
  ],
  read: [
    async (req, res) => {
      const { Combination, Combination_Stock, Environment } = req.app;
      const { user_id } = req._user;

      try {
        const total = await Combination.count({
          where: {
            user_id,
          },
        });
        const { start, size, begin, totalPages } = getPage({
          ...req.query,
          total,
        });

        const combList = await Combination.findAll({
          offset: begin,
          limit: size,
          attributes: ["id", "name", "environment_id", "create_time"],
          where: {
            user_id,
          },
          order: [["create_time", "DESC"]],
        });

        const list = await Promise.all(
          combList.map(async (comb) => {
            const { name: environment_name, env_image } =
              await Environment.findByPk(comb.environment_id);
            const stockIdList = await Combination_Stock.findAll({
              attributes: ["stock_id"],
              where: { combination_id: comb.id },
            });
            const stockList = await findStock(req, {
              attributes: [
                "id",
                "enable",
                "code",
                "name",
                "series_id",
                "supplier_id",
                "block",
                "absorption",
                "description",
                "create_time",
              ],
              where: {
                id: stockIdList.map((item) => item.stock_id),
              },
            });
            return {
              ...comb.get({ plain: true }),
              environment_name,
              env_image,
              stockList,
            };
          })
        );

        return res.response(200, {
          start,
          size,
          begin,
          total,
          totalPages,
          list,
        });
      } catch (error) {
        // log sql message with error.original.sqlMessage
        console.log(error);
        res.response(500);
      }
    },
  ],
  update: [
    multer().none(),
    async (req, res) => {
      // return res.response(200, {...req.body, ...req._user})
      const { Combination, Combination_Stock } = req.app;

      // check stock list first
      try {
        const stockList = JSON.parse(req.body.stockList);
        if (!Array.isArray(stockList)) throw new Error();
      } catch {
        return res.response(400, "Invalid stock list.");
      }

      const { validateCombination: validator } = allValidator;

      const validatedData = await validator({ ...req.body, ...req._user });

      if (validatedData === false) return res.response(400, "Invalid format.");

      const combination_id = parseInt(req.body.id);
      if (isNaN(combination_id)) return res.response(400, "Invalid comb id.");

      const { create_name, create_id, modify_name, modify_id } = req._user;
      const author = { create_name, create_id, modify_name, modify_id };

      try {
        await Combination.update(validatedData, {
          where: { id: combination_id },
        });

        const stockIdList = JSON.parse(req.body.stockList);

        await Combination_Stock.destroy({
          where: {
            combination_id,
            stock_id: {
              [Op.notIn]: stockIdList,
            },
          },
        });

        const insert_data = stockIdList.map((stock_id) => ({
          ...author,
          combination_id,
          stock_id,
        }));

        await Combination_Stock.bulkCreate(insert_data, {
          updateOnDuplicate: Object.keys(author),
        });

        res.response(200, "Success updated Combination.");
      } catch (error) {
        console.log(error);
        res.response(500);
      }
    },
  ],
  delete: [
    multer().none(),
    async (req, res) => {
      const { Combination } = req.app;
      const id = parseInt(req.body.id);

      if (isNaN(id)) return res.response(400);

      const { user_id } = req._user;

      try {
        await Combination.destroy({ where: { id, user_id } });
      } catch (error) {
        console.log(error);
        return res.response(500);
      }

      res.response(200, "Success deleted combination.");
    },
  ],
};

export const RoleController = {
  create: [
    multer().none(),
    async (req, res) => {
      const { Role, Role_Permission } = req.app;
      const { validateRole: validator } = allValidator;

      const { permission } = req.body;

      try {
        if (!Object.values(JSON.parse(permission)).includes(true))
          throw new Error("Invalid permission.");
      } catch {
        return res.response(400, "Invalid permission format.");
      }

      const validatedData = await validator({ ...req.body, ...req._user });
      if (validatedData === false) {
        return res.response(400, "Invalid format.");
      }

      try {
        const { id: role_id } = await Role.create(validatedData);

        const bulkData = Object.entries(JSON.parse(permission)).reduce(
          (insert_data, [per_id, status]) => {
            const permission_id = parseInt(per_id);
            return isNaN(permission_id) || !status
              ? insert_data
              : [...insert_data, { permission_id, role_id, ...req._user }];
          },
          []
        );

        await Role_Permission.bulkCreate(bulkData);

        res.response(200, "Success create Role data.");
      } catch (error) {
        // log sql message with error.original.sqlMessage
        console.log(error);
        res.response(500);
      }
    },
  ],
  read: [
    async (req, res) => {
      const { Role, Role_Permission, Permission } = req.app;

      try {
        const roleList = await Role.findAll({
          attributes: ["id", "name", "comment"],
          where: {
            ...(req.query.keyword && {
              name: { [Op.like]: `%${req.query.keyword}%` },
            }),
          },
          raw: true,
        });

        const list = await Promise.all(
          roleList.map(async (role) => {
            const enablePermList = await Role_Permission.findAll({
              attributes: ["permission_id"],
              where: {
                role_id: role.id,
              },
            });
            const enableIds = enablePermList.map((perm) => perm.permission_id);
            const permissionList = await Permission.findAll({
              attributes: ["id"],
            });

            return {
              ...role,
              permission: permissionList.reduce(
                (dict, { id }) => ({
                  ...dict,
                  [`${id}`]: enableIds.includes(id),
                }),
                {}
              ),
            };
          })
        );

        return res.response(200, { list });
      } catch (error) {
        // log sql message with error.original.sqlMessage
        console.log(error);
        res.response(500);
      }
    },
  ],
  update: [
    multer().none(),
    async (req, res) => {
      const role_id = parseInt(req.body.id);
      if (isNaN(role_id)) return res.response(400, "Invalid Role id.");

      const permList = (() => {
        try {
          return Object.entries(JSON.parse(req.body.permission)).reduce(
            (arr, [id, status]) => {
              const parseId = parseInt(id);
              return isNaN(parseId) || !status ? arr : [...arr, parseId];
            },
            []
          );
        } catch {
          return false;
        }
      })();

      if (!permList) return res.response(400, "Invalid Permissions.");

      const { validateRole: validator } = allValidator;
      const validatedData = await validator({ ...req.body, ...req._user });
      if (validatedData === false) {
        return res.response(400, "Invalid format.");
      }

      const { Role, Role_Permission } = req.app;

      try {
        await Role.update(validatedData, {
          where: {
            id: role_id,
          },
        });

        await Role_Permission.destroy({
          where: {
            role_id,
            permission_id: {
              [Op.notIn]: permList,
            },
          },
        });

        const insert_data = permList.map((permission_id) => ({
          role_id,
          permission_id,
          ...req._user,
        }));

        await Role_Permission.bulkCreate(insert_data, {
          updateOnDuplicate: Object.keys(req._user),
        });
        res.response(200, "Success updated Role data");
      } catch {
        res.response(500);
      }
    },
  ],
};

export const PermissionController = {
  read: [
    async (req, res) => {
      try {
        const handledPermissionList = await getAllPermission(req);
        res.response(200, { list: handledPermissionList });
      } catch {
        res.response(500);
      }
    },
  ],
};
