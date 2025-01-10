const { register } = require("../utils/commandList");
const JSONSender = require("../utils/JSONSender");

register("arrow", {}, async (client, args) => {
    console.log(await client.localPlayer.getRotation())
})