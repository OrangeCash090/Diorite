const JSONSender = require("../utils/JSONSender");
const { Vec3 } = require("vec3");
const fs = require("fs");

/**
* @typedef {import("./client")} Client
*/

/**
 * Represents the Minecraft world the Client is in.
*/
class WorldHandler {
    /**
    * @param {Client} client - The Client instance.
    */
    constructor(client) {
        /** @type {Client} */
        this.client = client;

        /** @type {string} */
        this.worldName = "";

        /** @type {object} */
        this.gameRules = {};
    }

    /**
    * Sets the specified position to a certain block.
    * @param {Vec3} pos - The position as a Vec3.
    * @param {string} block - A Minecraft block.
    */
    setBlock(pos, block) {
        JSONSender.sendCommand(this.client.socket, `/setblock ${pos.x} ${pos.y} ${pos.z} ${block}`);
    }

    /**
    * Gets the block at the specified position.
    * @param {Vec3} pos - The position as a Vec3.
    * @returns {Promise<string>} - The block at that position.
    */
    async getBlock(pos) {
        return await JSONSender.getBlock(this.client.socket, pos);
    }

    /**
    * Gets all blocks in an area from start to end.
    * @param {Vec3} start - The starting position.
    * @param {Vec3} end - The ending position.
    * @returns {Promise<Array>} - An array of blocks and coordinates.
    */
    async getArea(start, end) {
        return await JSONSender.getArea(this.client.socket, start, end);
    }

    async raycast(origin, direction, range) {
        return await JSONSender.raycastBlock(this.client.socket, origin, direction, range);
    }

    /**
    * Loads a structure from a file.
    * @param {string} path - The path to the file.
    */
    async loadStructure(path) {
        var extension = null;

        if (path.includes("schem") || path.includes("schematic")) {
            extension = "schematic";
        } else if (path.includes("mcstructure")) {
            extension = "mcstructure";
        } else if (path.includes("nbt")) {
            extension = "nbt"
        }

        fs.readFile(path, (err, data) => {
            JSONSender.loadStructure(this.client.socket, data, extension);
        })
    }
}

module.exports = WorldHandler;