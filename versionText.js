import packageInfo from "./package.json" assert { type: "json" };

const { version = "1.0.1" } = packageInfo;

export default version;