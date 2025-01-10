const { register } = require("../utils/commandList");
const JSONSender = require("../utils/JSONSender");

register("locate", {}, async (client, args) => {
    var location = await JSONSender.locateEntity(client.socket, args[0]);
    client.runCommand(`/w @s (${location.x}, ${location.y}, ${location.z})`);
})