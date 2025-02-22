// @ts-nocheck
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
        this.client.runCommand(`/setblock ${pos.x} ${pos.y} ${pos.z} ${block}`);
    }

    /**
    * Gets the block at the specified position.
    * @param {Vec3} pos - The position as a Vec3.
    * @returns {Promise<string>} - The block at that position.
    */
    async getBlock(pos) {
        return await JSONSender.getBlock(this.client, pos);
    }

    /**
    * Gets all blocks in an area from start to end.
    * @param {Vec3} start - The starting position.
    * @param {Vec3} end - The ending position.
    * @returns {Promise<Array>} - An array of blocks and coordinates.
    */
    async getArea(start, end) {
        return await JSONSender.getArea(this.client, start, end);
    }

    /**
    * Fills the specified area from start to end with the given block and what blocks to replace.
    * @param {Vec3} start - The starting position.
    * @param {Vec3} end - The ending position.
    * @param {string} block - The block to fill with.
    * @param {string} replace - The block to replace.
    */
    fill(start, end, block, replace) {
        function getNextCoord(current, end, iterator) {
            if (iterator > 0) {
                return Math.min(current + iterator - 1, end);
            } else {
                return Math.max(current + iterator + 1, end);
            }
        }

        var xIterator = end.x < start.x ? -30 : 30;
        var yIterator = end.y < start.y ? -30 : 30;
        var zIterator = end.z < start.z ? -30 : 30;

        fill_loop: for (let x = start.x; (xIterator > 0 ? x <= end.x : x >= end.x); x += xIterator) {
            for (let y = start.y; (yIterator > 0 ? y <= end.y : y >= end.y); y += yIterator) {
                for (let z = start.z; (zIterator > 0 ? z <= end.z : z >= end.z); z += zIterator) {
                    // Calculate the end positions for the current fill command
                    let fillEndX = getNextCoord(x, end.x, xIterator);
                    let fillEndY = getNextCoord(y, end.y, yIterator);
                    let fillEndZ = getNextCoord(z, end.z, zIterator);

                    this.client.runCommand(`/fill ${x} ${y} ${z} ${fillEndX} ${fillEndY} ${fillEndZ} ${block}` + (replace != undefined ? ` replace ${replace}` : ""));

                    // Break if the current fill reaches the end coordinates
                    if (fillEndX === end.x && fillEndY === end.y && fillEndZ === end.z) {
                        break fill_loop;
                    }
                }
            }
        }

        // Final fill command for any remaining blocks
        if (start.x <= end.x && start.y <= end.y && start.z <= end.z) {
            this.client.runCommand(`/fill ${start.x} ${start.y} ${start.z} ${end.x} ${end.y} ${end.z} ${block}` + (replace != undefined ? ` replace ${replace}` : ""));
        }
    }

    /**
    * Casts a ray from the origin in the specified direction and returns the first block that is not air.
    * @param {Vec3} origin - The starting position.
    * @param {Vec3} direction - The direction of the ray.
    * @param {number} range - The length of the ray in blocks.
    * @param {number} precision - How many blocks the ray steps per check.
    */
    async raycast(origin, direction, range, precision) {
        return await JSONSender.raycastBlock(this.client, origin, direction, range, precision);
    }

    /**
    * Builds a structure from a file. Supports nbt, schem, schematic, and mcstructure.
    * @param {string} path - The path to the file.
    */
    buildStructure(path) {
        var extension = null;

        if (path.includes("schem") || path.includes("schematic")) {
            extension = "schematic";
        } else if (path.includes("mcstructure")) {
            extension = "mcstructure";
        } else if (path.includes("nbt")) {
            extension = "nbt"
        }

        fs.readFile(path, (err, data) => {
            JSONSender.loadStructure(this.client, data, extension);
        })
    }
}

module.exports = WorldHandler;