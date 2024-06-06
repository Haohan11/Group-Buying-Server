const getAllPermission = async (req, option) => {
  const { 
    permission: Permission, 
    permission_type: PermissionType 
  } = req.app.sequelize.models;

  const permissionTypeList = await PermissionType.findAll({
    attributes: ["id", "code", "name"],
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

  const permissionList = await Permission.findAll({
    attributes: ["id", "code", "name", "parent_id", "permission_type_id"],
    ...option
  });

  const permissionDict = permissionList.reduce(
    (dict, perm) => ({
      ...dict,
      [perm.id]: {
        id: perm.id,
        name:
          perm.name === "index_item"
            ? typeDict[perm.permission_type_id].name
            : perm.name,
        code: perm.code || typeDict[perm.permission_type_id].code,
        ...(perm.name !== "index_item" && { childs: [] }),
      },
    }),
    {}
  );

  const handledPermissionList = permissionList.reduce((dict, currentItem) => {
    [null, 0, currentItem.id].includes(currentItem.parent_id)
      ? dict.push(permissionDict[currentItem.id])
      : permissionDict[currentItem.parent_id].childs.push(
          permissionDict[currentItem.id]
        );
    return dict;
  }, []);

  return handledPermissionList;
};

export default getAllPermission;
