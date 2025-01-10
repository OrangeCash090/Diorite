const JSONSender = require("../utils/JSONSender");
const EventEmitter = require("node:events");
const fs = require("fs");

const WorldHandler = require("./world");
const CommandHandler = require("./command");
const EventHandler = require("./event");
const GUIHandler = require("./graphics");
const DisplayHandler = require("./display");
const { PlayerHandler, Player } = require("./player");

/**
* @typedef {import("../utils/response")} Response
*/

class FunctionPack {
    constructor(client, structure) {
        this.client = client;
        this.structure = structure;
        this.tickedFunctions = this.structure["tick.json"] ? JSON.parse(this.structure["tick.json"]).values : [];
    }

    async runFunction(path, selector = "") {
        var ping = await this.client.getPing();

        return new Promise(async (resolve, reject) => {
            var files = `${path}.mcfunction`.split("/");
            var final = this.structure
    
            for (let i = 0; i < files.length; i++) {
                final = final[files[i]];
            }
    
            var lines = final.split("\r\n");

            for (let i = 0; i < lines.length; i++) {
                if (!lines[i].includes("#") && lines[i].length > 3) {
                    if (lines[i].includes("run function ")) {
                        var name = lines[i].split("run function ")[1];
                        await this.runFunction(name, lines[i].split("function ")[0]);
                    } else {
                        this.client.runCommand(`${selector}${lines[i]}`);
                    }
                }

                if (i % 98 == 0) {
                    await new Promise(resolve => setTimeout(resolve, ping));
                }
            }

            resolve();
        })
    }

    async start() {
        while (true) {
            for (let i = 0; i < this.tickedFunctions.length; i++) {
                await this.runFunction(this.tickedFunctions[i]);
            }
        }
    }
}

/**
 * Represents a client connection.
 * @extends EventEmitter
*/
class Client extends EventEmitter {
    /**
     * @param {any} socket - The WebSocket instance.
     * @param {any} server - The server instance.
     */
    constructor(socket, server) {
        super();

        /** @type {any} */
        this.socket = socket;

        /** @type {any} */
        this.server = server;

        this.socket.responseResolvers = new Map();

        /** @type {WorldHandler} */
        this.World = new WorldHandler(this);

        /** @type {CommandHandler} */
        this.CommandRunner = new CommandHandler(this);

        /** @type {EventHandler} */
        this.Events = new EventHandler(this);

        /** @type {PlayerHandler} */
        this.Players = new PlayerHandler(this);

        /** @type {GUIHandler} */
        this.GUI = new GUIHandler(this);

        /** @type {DisplayHandler} */
        this.DisplayBlock = new DisplayHandler(this);

        /** @type {null | Player} */
        this.localPlayer = null;

        /** @type {boolean} */
        this.isHost = true;

        /** @type {number} */
        this.permission = 0;

        /** @type {null | string} */
        this.uuid = null;
    }

    /**
     * Runs a command on the server.
     * @param {string} command - The command to execute.
     * @returns {Promise<Response>} - The result of the command.
     */
    async runCommand(command) {
        return await JSONSender.commandWithResponse(this.socket, command);
    }

    async getPing(amount = 1) {
        return await JSONSender.getPing(this.socket, amount);
    }

    /**
     * Sends rawtext to the chat.
     * @param {string} text - The text to send.
     * @param {string} player - The targets that see the text.
     */
    sayText(text, player = "@a") {
        JSONSender.sayText(this.socket, text, player);
    }

    /**
     * Subscribes to an event.
     * @param {string} eventName - The event to subscribe to.
     */
    async subscribeTo(eventName) {
        JSONSender.sendSubscribe(this.socket, eventName);
    }

    /**
     * Sets up the client by fetching initial data.
     */
    async _setup() {
        var data = (await this.runCommand("/geteduclientinfo")).body;

        this.localPlayer = this.Players.getPlayer(
            (await this.runCommand("/getlocalplayername")).getMessage()
        );

        this.isHost = data.isHost;
        this.permission = data.permission;
        this.uuid = data.clientuuid;
    }
}

module.exports = Client;