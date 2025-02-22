const { register } = require("../utils/commandList");

register("ping", {}, async (client, args) => {
    client.sayText(`Ping: ${(await client.getPing())}`);
})