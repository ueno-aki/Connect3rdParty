const { ip, port, ms_account } = process.env;
const { ThirdPartyConnection } = require("../dist/index");
ThirdPartyConnection.create({
  ip,
  port: parseInt(port),
  ms_account,
  cache_path: "./auth",
  auto_friending: true,
  logging: "default",
}).finally(() => {
  console.log("Connect3rdParty Launched");
});
