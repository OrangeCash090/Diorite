const JSONSender = require("../utils/JSONSender");
const { Vec3 } = require("vec3");

/**
* @typedef {import("./client")} Client
*/

/**
 * Represents a Minecraft player.
 */
class Player {
    /**
     * @param {Client} client - The WebSocket instance.
     * @param {string} username - The username of the player.
     */
    constructor(client, username) {
        /** @type {Client} */
        this.client = client;

        /** @type {string} */
        this.username = username;
    }

    async doesExist() {
        return (await this.client.runCommand(`/testfor ${this.username}`)).getStatusCode() != -2147352576;
    }

    async getGameMode() {
        var modes = ["adventure", "creative", "survival", "spectator"];
        var result = "survival";

        for (let i = 0; i < modes.length; i++) {
            var isMode = (await this.client.runCommand(`/testfor @e[name=${this.username},m=${modes[i]}]`)).getStatusCode() != -2147352576;

            if (isMode) {
                result = modes[i];
                break;
            }
        }

        return result;
    }

    async getPosition(round = false) {
        return (await JSONSender.queryTarget(this.client.socket, this.username))[round ? "roundedPosition" : "position"];
    }

    async getYRotation() {
        var data = (await JSONSender.queryTarget(this.client.socket, this.username))
        return data.yRot;
    }

    async getRotation() {
        var data = (await JSONSender.queryTarget(this.client.socket, this.username, true))
        return new Vec3(data.xRot, data.yRot, 0);
    }

    async getLookVector() {
        return (await JSONSender.queryTarget(this.client.socket, this.username, true)).lookVector;
    }

    async getTransform() {
        var data = (await JSONSender.queryTarget(this.client.socket, this.username, true));
        
        return {
            position: data.position,
            rotation: new Vec3(data.xRot, data.yRot, 0),
            lookVector: data.lookVector
        }
    }

    async raycast(range, precision = 0.2) {
        var transform = await this.getTransform();
        return await JSONSender.raycastBlock(this.client.socket, transform.position.offset(0, 1.6200103759765625, 0), transform.lookVector, range, precision);
    }

    async isInArea(min, max) {
        const point = await this.getPosition();

        if (point) {
            const minX = Math.min(min.x, max.x);
            const minY = Math.min(min.y, max.y);
            const minZ = Math.min(min.z, max.z);
            const maxX = Math.max(min.x, max.x);
            const maxY = Math.max(min.y, max.y);
            const maxZ = Math.max(min.z, max.z);
        
            const isInXRange = point.x >= minX && point.x <= maxX;
            const isInYRange = point.y >= minY && point.y <= maxY;
            const isInZRange = point.z >= minZ && point.z <= maxZ;

            return isInXRange && isInYRange && isInZRange;
        }

        return false;
    }

    async getScores() {
        var result = {};
        var data = (await this.client.runCommand(`/scoreboard players list ${this.username}`)).getMessage().split("\n");
        
        for (let i = 1; i < data.length; i++) {
            var lines = data[i].replace("- ", "").split(" ");

            var objective = lines[0].replace(":", "");
            var score = Number(lines[1]);

            result[objective] = score;
        }

        return result;
    }

    async hasTag(tag) {
        return (await this.client.runCommand(`/testfor @e[name=${this.username},tag=${tag}]`)).getStatusCode() != -2147352576;
    }

    async getAllTags() {
        var result = [];
        var data = (await this.client.runCommand(`/tag ${this.username} list`)).getMessage().split(" ");
        
        for (let i = 4; i < data.length; i++) {
            result.push(data[i].replace("§a", "").replace("§r", "").replace(",", ""));
        }

        return result;
    }
}

/**
 * A class for interacting with players in a Minecraft world.
 */
class PlayerHandler {
    /**
    * @param {Client} client - The Client instance.
    */
    constructor(client) {
        /** @type {Client} */
        this.client = client;
    }

    /**
    * Gets the player with the specified username in the world.
    * @param {string} username - The player's username.
    * @returns {Player} - The Player object.
    */
    getPlayer(username) {
        return new Player(this.client, username);
    }

    async getAllPlayers() {
        var players = {};
    
        var response = (await this.client.runCommand(`/testfor @a`)).getMessage().replace("Found ", "").split(", ");
    
        for (let i = 0; i < response.length; i++) {
            players[response[i]] = new Player(this.client, response[i]);
        }
    
        return players;
    }
}

module.exports = { PlayerHandler, Player }