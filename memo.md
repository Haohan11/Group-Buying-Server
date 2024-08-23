### add qty fiedld to stock table for store to InventorySchema, and create a default data "現貨倉" for warehouse_id

### default member_role: "一般", "經銷商"

### default member_level: "A", "B", "C", "D", "E"

### Store to MemberContactTypeSchema
```
  contact_type_id: "line"
  im_visible_id: [line_id],
  im_id: ** dynamic insert *,
```

### codeium command for transform php schema to js

turn to this format:
export const TestSchema = {
name: "test",
cols: {
test: {
type: DataTypes.INTEGER,
defaultValue: 1,
},
},
option: {
tableName: "test",
},
};
with replace LONGTEXT to TEXT("long"),
remove `name`, `code`, `sorting` cols,
ignore `description`, `create_id`, `create_name`, `modify_id`, `modify_name` in cols,
and also ignore `id` cols if its format is like this: {
type: DataTypes.INTEGER,
autoIncrement: true,
primaryKey: true,
},
add `allowNull: false` property for those dont have nullable().
remove `allowNull` for those who have nullable().
add comment for table if it's exist.
