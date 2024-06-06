import * as Yup from "yup";

/* 
  Schemas here will automatically be export as validator (check validateSchema.js and validator.js).
*/

export const validateEmployeeSchema = {
  enable: Yup.boolean(),
  role: Yup.number().integer(),
  email: Yup.string().email().required(),
  name: Yup.string().min(2).required(),
  id_code: Yup.string().matches(/^[A-Za-z]\d{9}$/).required(),
  phone_number: Yup.string()
    .matches(/^\d{10}$/)
    .required(),
  password: Yup.string()
    .matches(/^(?=.*[a-zA-Z0-9].*[a-zA-Z0-9].*[a-zA-Z0-9].*[a-zA-Z0-9]).+$/)
    .required(),
};

export const validateSeriesSchema = {
  enable: Yup.boolean(),
  name: Yup.string().max(15).required(),
  code: Yup.string().max(15).required(),
  comment: Yup.string(),
};

export const validateEnvironmentSchema = {
  enable: Yup.boolean(),
  name: Yup.string().max(30).required(),
  width: Yup.string(),
  cropline: Yup.string().required(),
  perspect: Yup.string().required(),
  comment: Yup.string(),
};

export const validateStockSchema = {
  name: Yup.string().max(15).required(),
  enable: Yup.boolean(),
  code: Yup.string().max(15).required(),
  series_id: Yup.number().integer().required(),
  supplier_id: Yup.number().integer(),
  block: Yup.string().matches(/^(1|2|3|4|5)$/),
  absorption: Yup.string().matches(/^(1|2|3|4|5)$/),
};

export const validateStockImageSchema = {
  name: Yup.string().max(15).required(),
};

export const validateColorNameSchema = {
  enable: Yup.boolean(),
  name: Yup.string().max(15).required(),
  comment: Yup.string(),
};

export const validateColorSchemeSchema = {
  enable: Yup.boolean(),
  name: Yup.string().max(15).required(),
  comment: Yup.string(),
};

export const validateMaterialSchema = {
  enable: Yup.boolean(),
  name: Yup.string().max(15).required(),
  comment: Yup.string(),
};

export const validateDesignSchema = {
  enable: Yup.boolean(),
  name: Yup.string().max(15).required(),
  comment: Yup.string(),
};

export const validateSupplierSchema = {
  enable: Yup.boolean(),
  name: Yup.string().max(15).required(),
  code: Yup.string().max(15).required(),
  comment: Yup.string(),
};

export const validateCombinationSchema = {
  name: Yup.string().max(50).required(),
  user_id: Yup.number().integer().required(),
  environment_id: Yup.number().integer().required(),
};

export const validateRoleSchema = {
  name: Yup.string().min(2).required(),
  comment: Yup.string(),
};
