// @ts-nocheck
const uuid4 = require("uuid4");
const { Vec3 } = require("vec3");
const Response = require("./response");

const fs = require("fs");
const nbt = require("prismarine-nbt");
const { Schematic } = require("prismarine-schematic");
const j2b = JSON.parse(fs.readFileSync(require.resolve("./json/java-to-bedrock.json")));
const blockMap = JSON.parse(fs.readFileSync(require.resolve("./json/items.json")));

class CommandQueue {
    constructor(limit, maxQueueSize) {
        this.queue = [];
        this.inFlight = 0;
        this.limit = limit;
        this.maxQueueSize = maxQueueSize; // Maximum number of queued commands
    }

    enqueue(fn) {
        return new Promise((resolve, reject) => {
            if (this.queue.length >= this.maxQueueSize) {
                this.queue.shift(); // Drop the oldest command to make room
            }
    
            this.queue.push({ fn, resolve, reject });
            this.processQueue();
        });
    }    

    async processQueue() {
        if (this.inFlight >= this.limit || this.queue.length === 0) {
            return; // Stop processing if limit is reached or queue is empty
        }

        const { fn, resolve, reject } = this.queue.shift();
        this.inFlight++;

        try {
            const result = await fn();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this.inFlight--;
            this.processQueue(); // Process next command
        }
    }
}

function rad(angle) {
    return angle * (Math.PI / 180);
}

function getDynamicBlockIdentifier(blkobject) {
    //Clone the blockobject so any operations don't affect it
    var blockobject = JSON.parse(JSON.stringify(blkobject));
    var stateslist = {
        //{name: 'direction', value: '0'}
    };

    var baseidentifier;
    var properties;

    if (blockobject.Name != undefined) {
        baseidentifier = blockobject.Name.value;

        if (blockobject.Properties != undefined) {
            for (let statename of Object.keys(blockobject.Properties.value)) {
                var state = blockobject.Properties.value[statename];
                stateslist[statename] = state.value
            }
        }

        //Create dynamic properties list
        properties = [];
        for (let statename of Object.keys(stateslist).sort()) {
            properties.push(statename + "=" + stateslist[statename]);
        }
    } else {
        baseidentifier = "minecraft:" + blockobject.name;

        if (blockobject._properties != undefined) {
            for (let statename of Object.keys(blockobject._properties)) {
                var state = blockobject._properties[statename];
                stateslist[statename] = state
            }
        }

        properties = [];
        for (let statename of Object.keys(stateslist).sort()) {
            properties.push(statename + "=" + stateslist[statename]);
        }
    }

    return baseidentifier + "[" + properties.join(",") + "]";
}

function convertBlock(javaId, identifier, oldName) {
    var fullName = "";

    if (javaId == undefined) {
        var baseName = identifier.split("[")[0];
        var baseProps = identifier.split("[")[1].replaceAll("]", "");
        baseProps = (baseProps.split(",")[0] != '' ? baseProps.split(",") : []);

        for (let i = 0; i < baseProps.length; i++) {
            if (j2b[`${baseName}[${baseProps[i]}]`] != undefined) {
                javaId = j2b[`${baseName}[${baseProps[i]}]`];
                break;
            }
        }

        if (javaId == undefined && j2b[identifier.split("[")[0] + "[]"] != undefined) {
            javaId = j2b[identifier.split("[")[0] + "[]"];
        }
    }

    if (javaId != undefined) {
        var blockName = javaId.split("[")[0]
        var blockProps = javaId.split("[")[1].replaceAll("]", "");
        blockProps = (blockProps.split(",")[0] != '' ? blockProps.split(",") : []);

        for (let i = 0; i < blockProps.length; i++) {
            var temp = blockProps[i].split("=");

            if (!isNaN(temp[1]) || (temp[1] == "true" || temp[1] == "false")) {
                blockProps[i] = `"${temp[0]}" = ${temp[1]}`;
            } else {
                blockProps[i] = `"${temp[0]}" = "${temp[1]}"`;
            }
        }

        blockName = `${blockName} [${blockProps.join(", ")}]`;
        fullName = blockName;
    } else {
        fullName = oldName;
    }

    return fullName;
}

async function sendWithResponse(ws, data, reqID, cmd) {
    return new Promise((resolve, reject) => {
        ws.responseResolvers.set(reqID, { resolve, reject, cmd: cmd });

        ws.send(data, (error) => {
            if (error) {
                ws.responseResolvers.delete(reqID); // Clean up on error
                reject(error);
            }
        });
    });
}

function sendCommand(ws, cmd) {
    ws.commandQueue.enqueue(() => {
        ws.send(JSON.stringify({
            header: {
                version: 1,
                requestId: uuid4(),
                messageType: "commandRequest",
                messagePurpose: "commandRequest"
            },
            body: {
                version: 70,
                commandLine: cmd,
                origin: {
                    type: "server"
                }
            }
        }));

        // Add a delay of 100 ms before resolving
        return new Promise(resolve => setTimeout(resolve, 100));
    }).catch(error => {
        console.error("Failed to send command:", error.message);
    });
}

async function commandWithResponse(ws, cmd) {
    return ws.commandQueue.enqueue(async () => {
        const reqID = uuid4();
        const response = await sendWithResponse(ws, JSON.stringify({
            header: {
                version: 1,
                requestId: reqID,
                messageType: "commandRequest",
                messagePurpose: "commandRequest"
            },
            body: {
                version: 70,
                commandLine: cmd,
                origin: {
                    type: "server"
                }
            }
        }), reqID, cmd);

        return new Response(response); // Return the required Response object
    });
}

function sendSubscribe(ws, event) {
    ws.send(JSON.stringify({
        header: {
            version: 1,
            requestId: uuid4(),
            messagePurpose: "subscribe"
        },
        body: {
            eventName: event
        }
    }))
}

function sayText(ws, text, player = "@a") {
    sendCommand(ws, `/tellraw ${player} {"rawtext":[{"text":"${text}"}]}`);
}

function sendTitle(ws, text, player, type = "actionbar") {
    sendCommand(ws, `/titleraw ${player} ${type} {"rawtext":[{"text":"${text}"}]}`);
}

async function getPing(ws, amount = 1) {
    var responsesTimes = [];
    var ping = 0;

    for (let i = 0; i < amount; i++) {
        var start = Date.now();
        await commandWithResponse(ws, `/help`);
        responsesTimes.push(Date.now() - start);
    }

    for (let i = 0; i < responsesTimes.length; i++) {
        ping += responsesTimes[i];
    }

    return ping / responsesTimes.length;
}

async function queryTarget(ws, target, extra = false) {
    var response = (await commandWithResponse(ws, `/querytarget ${target}`)).body
    var data = {}

    if (response.details != undefined && response.statusCode != -2147352576) {
        var parsed = JSON.parse(response.details)[0];

        data.position = new Vec3(parsed.position.x, parsed.position.y - 1.6200103759765625, parsed.position.z);
        data.roundedPosition = new Vec3(Math.floor(parsed.position.x), Math.floor(parsed.position.y - 1.6200103759765625), Math.floor(parsed.position.z));
        data.yRot = parsed.yRot;
        data.id = parsed.id;

        if (extra == true) {
            var tag = "__LOOKMARKER";

            sendCommand(ws, `/execute as ${target} anchored eyes run summon armor_stand ${tag} ^ ^ ^20`);
            sendCommand(ws, `/effect @e[name="${tag}"] invisibility 99999 255 true`);

            var loop = setInterval(() => {
                sendCommand(ws, `/execute as ${target} anchored eyes run summon armor_stand ${tag} ^ ^ ^20`);
            }, 20);

            await queryTarget(ws, `@e[name="${tag}",c=1]`).then(async (properties) => {
                sendCommand(ws, `/kill @e[name="${tag}"]`);
                clearInterval(loop);

                if (properties.position != undefined) {
                    var otherPos = properties.position;

                    var dx = otherPos.x - data.position.x
                    var dy = (otherPos.y + 0.1) - data.position.y
                    var dz = otherPos.z - data.position.z

                    var distanceXZ = Math.sqrt(dx * dx + dz * dz);
                    var pitch = Math.atan2(dy, distanceXZ);

                    data.xRot = ((pitch * 180) / Math.PI)
                    data.lookVector = new Vec3(-(Math.cos(pitch) * Math.sin(rad(data.yRot))), Math.sin(pitch), Math.cos(pitch) * Math.cos(rad(data.yRot)));
                }
            })
        }
    }

    return data;
}

async function getBlock(ws, pos) {
    return new Promise(async (resolve, reject) => {
        var response = (await commandWithResponse(ws, `/testforblock ${pos.x} ${pos.y} ${pos.z} structure_void`)).body;
        var block = response.statusMessage.split(" is ")[1];
        block = blockMap[block.substring(0, block.indexOf(" ("))];

        resolve(block);
    })
}

async function getArea(ws, start, end) {
    return new Promise(async (resolve, reject) => {
        var ping = await getPing(ws);
        var blocks = [];
        var coords = [];

        var xIterator = end.x < start.x ? -1 : 1;
        var yIterator = end.y < start.y ? -1 : 1;
        var zIterator = end.z < start.z ? -1 : 1;

        // Collect all coordinates within the given start and end bounds
        for (let x = start.x; (xIterator > 0 ? x <= end.x : x >= end.x); x += xIterator) {
            for (let y = start.y; (yIterator > 0 ? y <= end.y : y >= end.y); y += yIterator) {
                for (let z = start.z; (zIterator > 0 ? z <= end.z : z >= end.z); z += zIterator) {
                    coords.push(new Vec3(x, y, z));
                }
            }
        }

        for (let i = 0; i < coords.length; i++) {
            for (let j = 0; j < 99; j++) {
                if (coords[(i * 99) + j] != undefined) {
                    blocks.push(getBlock(ws, coords[(i * 99) + j]));
                } else {
                    await new Promise(resolve => setTimeout(resolve, ping));
                    resolve([await Promise.all(blocks), coords]);
                }
            }

            await new Promise(resolve => setTimeout(resolve, ping));
        }
    })
}

async function raycastBlock(ws, origin, direction, range = 5) {
    return new Promise(async (resolve, reject) => {
        var blocks = [];

        for (let i = 0; i <= range; i+=0.1) {
            var pos = new Vec3(origin.x + (direction.x * (i)), origin.y + (direction.y * (i)), origin.z + (direction.z * (i)));

            blocks.push({
                name: getBlock(ws, pos),
                pos: pos
            });
        }

        for (let i = 0; i < blocks.length; i++) {
            if (await blocks[i].name != "air") {
                resolve({name: await blocks[i].name, position: blocks[i].pos})
            }
        }

        resolve({name: "air", position: new Vec3(0, 0, 69420)});
    });
}

async function locateEntity(ws, name) {
    let { x, y, z, dx, dy, dz } = {
        x: -10000000,
        y: -64,
        z: -10000000,
        dx: 20000000,
        dy: 376,
        dz: 20000000
    };

    // Minimum offset size for narrowing down
    const minSize = 1;

    // Function to execute the command and check if the entity is in the volume
    async function checkVolume(x, y, z, dx, dy, dz) {
        const command = `/w @s @a[name=${name},x=${x},y=${y},z=${z},dx=${dx},dy=${dy},dz=${dz}]`;
        return (await commandWithResponse(ws, command)).body.message != "";
    }

    // Function to refine search along one axis
    async function refineAxis(axis) {
        let start, offset;
        if (axis === 'x') {
            start = x;
            offset = dx;
        } else if (axis === 'y') {
            start = y;
            offset = dy;
        } else {
            start = z;
            offset = dz;
        }

        while (Math.abs(offset) > minSize) {
            // Halve the offset to narrow down
            const halfOffset = Math.floor(offset / 2);

            // Determine the new volume based on the current axis
            const newX = axis === 'x' ? start + (offset > 0 ? halfOffset : -halfOffset) : x;
            const newY = axis === 'y' ? start + (offset > 0 ? halfOffset : -halfOffset) : y;
            const newZ = axis === 'z' ? start + (offset > 0 ? halfOffset : -halfOffset) : z;
            const newDx = axis === 'x' ? halfOffset : dx;
            const newDy = axis === 'y' ? halfOffset : dy;
            const newDz = axis === 'z' ? halfOffset : dz;

            // Check if the entity is within the refined volume
            const response = await checkVolume(newX, newY, newZ, newDx, newDy, newDz);

            // If found, adjust the origin and offset to the new volume
            if (response) {
                if (axis === 'x') {
                    x = newX;
                    dx = newDx;
                } else if (axis === 'y') {
                    y = newY;
                    dy = newDy;
                } else {
                    z = newZ;
                    dz = newDz;
                }
                start += offset > 0 ? halfOffset : -halfOffset;
                offset = halfOffset;
            } else {
                offset = halfOffset;
            }
        }
    }

    // Refine each axis independently
    await refineAxis('x');
    await refineAxis('y');
    await refineAxis('z');

    // Return the approximate position of the entity
    return new Vec3(x, y - 1, z);
}

async function loadStructure(client, data, extension) {
    var ping = await getPing(client);
    var startPos = await (await queryTarget(client, "@s")).roundedPosition;

    if (extension == "mcfunction") {
        var lines = data.split("\n")

        for (let i = 0; i < lines.length; i++) {
            var line = lines[i]

            if (line[0] != "#") {
                //line = line.replace("minecraft:", "").replace(":", "=")
                sendCommand(client, `/execute positioned ${startPos.x} ${startPos.y} ${startPos.z} run ${line}`)
            }
        }
    } else {
        async function placeDelay(blockArray, currentIndex, batchEndIndex) {
            return new Promise((resolve) => {
                // Process the block array within the specified range
                for (let i = currentIndex; i < batchEndIndex; i++) {
                    if (blockArray[i] != undefined) {
                        const pos = blockArray[i].position;
                        const blockName = blockArray[i].name;
                        const blockCMDS = blockArray[i].extraCMDS;

                        sendCommand(client, `/execute positioned ${startPos.x} ${startPos.y} ${startPos.z} run setblock ~${pos.x} ~${pos.y} ~${pos.z} ${blockName}`);

                        if (blockCMDS != undefined) {
                            for (const cmd of blockCMDS) {
                                sendCommand(client, `/execute positioned ${startPos.x} ${startPos.y} ${startPos.z} run ${cmd}`);
                            }
                        }
                    }
                }

                setTimeout(() => {
                    resolve("done :D");
                }, ping);
            });
        }

        async function placeBlocksBatch(blockArray) {
            const batchSize = 90; // Number of blocks to place in each batch
            let currentIndex = 0;

            while (currentIndex < blockArray.length) {
                const batchEndIndex = Math.min(currentIndex + batchSize, blockArray.length);
                await placeDelay(blockArray, currentIndex, batchEndIndex);
                currentIndex += batchSize;
            }
        }

        async function processChunks(chunks) {
            for (const chunk of Object.values(chunks)) {
                await commandWithResponse(client, `/tickingarea remove area`);
                sendCommand(client, `/execute positioned ${startPos.x} ${startPos.y} ${startPos.z} run tickingarea add circle ~${chunk[0].position.x} ~${chunk[0].position.y} ~${chunk[0].position.z} 3 area`);
                await placeBlocksBatch(chunk);
            }
        }

        if (extension == "nbt") {
            var chunks = {};
            var blocks = [];

            nbt.parse(data, async (error, data) => {
                if (error) throw error;

                var oldBlocks = data.value.blocks.value.value
                var palette = data.value.palette.value.value

                for (let i = 0; i < oldBlocks.length; i++) {
                    var pos = oldBlocks[i].pos.value.value;
                    var state = oldBlocks[i].state.value;
                    var fullName = ""

                    var identifier = getDynamicBlockIdentifier(palette[state]);
                    var javaId = j2b[identifier];
                    var blockName = javaId.substring(0, javaId.indexOf("[")).replace("minecraft:", "");
                    var fullName = convertBlock(javaId, identifier, blockName);

                    blocks.push({ name: fullName, position: new Vec3(pos[0], pos[1], pos[2]) });
                }

                blocks.forEach(block => {
                    var chunkX = Math.floor(block.position.x / 16);
                    var chunkZ = Math.floor(block.position.z / 16);
                    var chunkKey = `${chunkX},${chunkZ}`;

                    if (!chunks[chunkKey]) {
                        chunks[chunkKey] = [];
                    }
                    chunks[chunkKey].push(block);
                });

                await processChunks(chunks);
            })
        }

        if (extension == "schem" || extension == "schematic") {
            var chunks = {};
            var blocks = [];

            Schematic.read(data).then(async (build) => {
                var start = build.start();
                var end = build.end();

                for (let x = start.x; x <= end.x; x++) {
                    for (let y = start.y; y <= end.y; y++) {
                        for (let z = start.z; z <= end.z; z++) {
                            var block = build.getBlock(new Vec3(x, y, z))
                            var position = new Vec3(x, y, z)

                            if (block.name != "air") {
                                var identifier = getDynamicBlockIdentifier(block);
                                var javaId = j2b[identifier];
                                var fullName = convertBlock(javaId, identifier, block.name);

                                blocks.push({ name: fullName, position: position });
                            }
                        }
                    }
                }

                blocks.forEach(block => {
                    var chunkX = Math.floor(block.position.x / 16);
                    var chunkZ = Math.floor(block.position.z / 16);
                    var chunkKey = `${chunkX},${chunkZ}`;

                    if (!chunks[chunkKey]) {
                        chunks[chunkKey] = [];
                    }
                    chunks[chunkKey].push(block);
                });

                await processChunks(chunks);
            })
        }

        if (extension == "mcstructure") {
            var chunks = {};
            var blocks = [];
            var counter = 0;

            nbt.parse(data, async function (error, data) {
                if (error) throw error;

                var size = new Vec3(data.value.size.value.value[0], data.value.size.value.value[1], data.value.size.value.value[2]);
                var origin = new Vec3(data.value.structure_world_origin.value.value[0], data.value.structure_world_origin.value.value[1], data.value.structure_world_origin.value.value[2]);
                var structure = data.value.structure.value;

                for (let i = 0; i < structure.entities.value.value.length; i++) {
                    var entity = structure.entities.value.value[i];

                    var name = entity.identifier.value
                    var customName = entity.CustomName ? entity.CustomName.value : `_${i}`
                    var pos = new Vec3(Math.floor(entity.Pos.value.value[0]), Math.floor(entity.Pos.value.value[1]), Math.floor(entity.Pos.value.value[2]))
                    var rot = entity.Rotation.value.value[0];

                    sendCommand(client, `/execute positioned ${startPos.x} ${startPos.y} ${startPos.z} run summon ${name} ${customName} ~${pos.x - origin.x} ~${pos.y - origin.y} ~${pos.z - origin.z}`);
                    sendCommand(client, `/execute at @e[name="_${i}"] tp @e[name="_${i}"] ~~~ facing ${rot} 0`)

                    if (entity.Armor != undefined) {
                        var armor = entity.Armor.value.value;
                        var armor_indices = ["head", "chest", "legs", "feet"];

                        for (let j = 0; j < armor.length; j++) {
                            if (armor[j].Name.value != "") {
                                sendCommand(client, `/replaceitem entity @e[name="_${i}"] slot.armor.${armor_indices[j]} 0 ${armor[j].Name.value}`);
                            }
                        }
                    }

                    if (entity.Mainhand && entity.Offhand) {
                        var mainItem = entity.Mainhand.value.value[0];
                        var offItem = entity.Offhand.value.value[0];

                        sendCommand(client, `/replaceitem entity @e[name="_${i}"] slot.weapon.mainhand 0 ${mainItem.Name.value}`);
                        sendCommand(client, `/replaceitem entity @e[name="_${i}"] slot.weapon.offhand 0 ${offItem.Name.value}`);
                    }
                }

                for (let x = 0; x < size.x; x++) {
                    for (let y = 0; y < size.y; y++) {
                        for (let z = 0; z < size.z; z++) {
                            var blockIndex = structure.block_indices.value.value[0].value[counter];
                            var blockName = structure.palette.value.default.value.block_palette.value.value[blockIndex].name.value;
                            var blockStates = "[";
                            var blockData = structure.palette.value.default.value.block_position_data.value[counter]

                            var numStates = Object.keys(structure.palette.value.default.value.block_palette.value.value[blockIndex].states.value).length;
                            var stateCounter = 0;
                            var blockCommands = [];

                            if (blockData != undefined) {
                                blockData = blockData.value.block_entity_data.value;

                                if (blockData.Items != undefined) {
                                    for (let i = 0; i < blockData.Items.value.value.length; i++) {
                                        var item = blockData.Items.value.value[i];

                                        var name = item.Name.value;
                                        var count = item.Count.value;
                                        var slot = item.Slot.value;

                                        blockCommands.push(`replaceitem block ~${x} ~${y} ~${z} slot.container ${slot} ${name} ${count}`);
                                    }
                                }
                            }

                            if (numStates > 0) {
                                for (let [key, value] of Object.entries(structure.palette.value.default.value.block_palette.value.value[blockIndex].states.value)) {
                                    var realVal = value.value

                                    switch (value.type) {
                                        case "byte":
                                            realVal = value.value == 0 ? "false" : "true";
                                            break;

                                        case "int":
                                            realVal = value.value;
                                            break;

                                        case "string":
                                            realVal = `"${value.value}"`;
                                            break;

                                        default:
                                            realVal = `"${value.value}"`;
                                            break;
                                    }

                                    blockStates += `"${key}"=${realVal}`
                                    stateCounter += 1;

                                    if (stateCounter < numStates) {
                                        blockStates += ","
                                    } else {
                                        blockStates += "]"
                                    }
                                }
                            } else {
                                blockStates = "[]"
                            }

                            if (blockName != "minecraft:air") {
                                blocks.push({ name: blockName + blockStates, position: new Vec3(x, y, z), extraCMDS: blockCommands });
                            }

                            counter += 1;
                        }
                    }
                }

                blocks.forEach(block => {
                    var chunkX = Math.floor(block.position.x / 16);
                    var chunkZ = Math.floor(block.position.z / 16);
                    var chunkKey = `${chunkX},${chunkZ}`;

                    if (!chunks[chunkKey]) {
                        chunks[chunkKey] = [];
                    }
                    chunks[chunkKey].push(block);
                });

                await processChunks(chunks);
            })
        }
    }
}

module.exports = { CommandQueue, sendCommand, commandWithResponse, sendSubscribe, sayText, sendTitle, queryTarget, getPing, getBlock, getArea, raycastBlock, locateEntity, loadStructure }