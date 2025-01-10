const { register } = require("../utils/commandList");
const JSONSender = require("../utils/JSONSender");

register("test", {}, async (client, args) => {
    client.runCommand(`me ${args[0]}`);
})