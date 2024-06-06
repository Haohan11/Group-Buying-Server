import { PermissionTypeSchema } from "../model/schema/rawSchema.js";
import createSchema from "../model/createSchema.js";

const getUserPermission = async (req, user) => {
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
      raw: true
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

export default getUserPermission;
