const { register } = require("../utils/commandList");
const JSONSender = require("../utils/JSONSender");

register("test", {}, async (client, args) => {
    while (true) {
        console.log(await client.localPlayer.getRotation());
    }
})