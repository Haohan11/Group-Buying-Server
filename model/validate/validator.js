import validateSchemas from "./validateSchema.js";

const allvalidator = Object.entries(validateSchemas).reduce((dict, [schemaName, validateSchema]) => ({
  ...dict,
  [schemaName.replace("Schema", "")]: async (data) => {
    try {
      return await validateSchema.validate(
        validateSchema.cast(data),
        {
          stripUnknown: true,
        }
      );
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}), {})

export default allvalidator;
