//@ts-check
const { ThirdPartyConnection } = require("../dist/index");
ThirdPartyConnection.create({ cache_path: "./auth", port: 19132, ip: "doiserver.net", ms_account: "uenomut384@gmail.com" }).then((v) => {
  console.log(v);
});
