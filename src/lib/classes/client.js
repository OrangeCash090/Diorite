// @ts-nocheck
const JSONSender = require("../utils/JSONSender");
const EventEmitter = require("node:events");

const WorldHandler = require("./world");
const CommandHandler = require("./command");
const EventHandler = require("./event");
const GUIHandler = require("./graphics");
const DisplayHandler = require("./display");
const { PlayerHandler, Player } = require("./player");

/**
 * @typedef {import("../utils/response")} Response
 */

/**
 * @typedef {Object} ClientEvents
 * @property {[sender: string, message: string]} chatMessage - Fired when a chat message is received. Arguments: sender, message.
 * @property {[name: string, enchants: Object]} itemInteracted - Fired when an item is interacted with. Arguments: item, enchants
 * @property {[name: string, enchants: Object]} mouseDown - Fired when right click is pressed. Arguments: item, enchants
 * @property {[]} mouseUp - Fired when right click is released.
 */

/**
 * Represents a client connection.
 * @extends {EventEmitter}
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

        /** @type {JSONSender.CommandQueue} */
        this.commandQueue = new JSONSender.CommandQueue(100, 200);

        /** @type {Map} */
        this.responseResolvers = new Map();

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
        this.DisplayHandler = new DisplayHandler(this);

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
     * Registers an event listener.
     * @template {keyof ClientEvents} K
     * @param {K} event - The event name.
     * @param {(...args: ClientEvents[K]) => void} listener - The callback function for the event.
     * 
     * @example
     * client.on('chatMessage', (sender, message) => {
     *     console.log(`${sender}: ${message}`);
     * });
     */
    on(event, listener) {
        return super.on(event, listener);
    }

    /**
     * Sends data with encryption. Used internally.
     * @param {string} data - The data to send.
     */
    sendPacket(data) {
        this.socket.send(data);
    }

    /**
     * Runs a command on the server.
     * @param {string} command - The command to execute.
     * @returns {Promise<Response>} - The result of the command.
     */
    async runCommand(command) {
        return await JSONSender.commandWithResponse(this, command);
    }

    async getPing(amount = 1) {
        return await JSONSender.getPing(this, amount);
    }

    /**
     * Sends rawtext to the chat.
     * @param {string} text - The text to send.
     * @param {string} player - The targets that see the text.
     */
    sayText(text, player = "@a") {
        JSONSender.sayText(this, text, player);
    }

    /**
     * Subscribes to an event.
     * @param {string} eventName - The event to subscribe to.
     */
    async subscribeTo(eventName) {
        JSONSender.sendSubscribe(this, eventName);
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