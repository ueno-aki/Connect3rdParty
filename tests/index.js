require("dotenv").config();
const { ip, ms_account } = process.env;

//@ts-check
const { ThirdPartyConnection } = require("../dist/index");
ThirdPartyConnection.create({
  ip,
  port: 19132,
  ms_account,
  cache_path: "./auth",
  auto_friending: true,
  logging: "default",
}).finally(() => {
  console.log("started");
});
