const { Vec3 } = require("vec3");
const { register } = require("../utils/commandList");
const JSONSender = require("../utils/JSONSender");

register("freecam", {}, async (client, args) => {
    var moving = false;
    var inUse = false;

    client.runCommand("/give @s emerald");
    client.runCommand("/give @s amethyst_shard");

    client.runCommand(`/kill @e[name="CAMERA"]`);
    client.runCommand(`/summon bat CAMERA ~~~`);
    client.runCommand(`/effect @e[name="CAMERA"] invisibility infinite 255 true`);
    client.runCommand(`/effect @e[name="CAMERA"] resistance infinite 255 true`);
    client.runCommand(`/effect @e[name="CAMERA"] fire_resistance infinite 255 true`);

    client.on("mouseDown", (item, enchants) => {
        if (item == "amethyst_shard") {
            moving = !moving;
        } else if (item == "emerald") {
            if (inUse) {
                setTimeout(() => {
                    client.runCommand(`/camera @s clear`);
                    client.runCommand(`/tp @e[name="CAMERA"] ~~~`)
                }, 100);
            }

            inUse = !inUse;
            moving = false;
        }
    })

    setInterval(() => {
        client.runCommand(`/execute as @e[name="CAMERA"] rotated as ${client.localPlayer.username} positioned as @s run tp @s ^ ^ ^${moving ? 0.2 : 0} ~ ~`);

        if (inUse) {
            client.runCommand(`/execute as @e[name="CAMERA"] at @s rotated as @s run camera ${client.localPlayer.username} set minecraft:free ease 0.2 linear pos ~~~ rot ~ ~`);
        }
    }, 20);
})