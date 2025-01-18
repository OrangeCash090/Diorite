const { register } = require("../utils/commandList");
const JSONSender = require("../utils/JSONSender");

register("test", {}, async (client, args) => {
    client.on("mouseDown", async () => {
        var ray = await client.localPlayer.raycast();
        client.World.setBlock(ray.position, "gold_block");
    })
})