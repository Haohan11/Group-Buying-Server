
const controllerDict = {
  Test: {
    read: [async (req, res) => res.response(200, "In Test route.")]
  }
}

export const getController = (name) => controllerDict[name];