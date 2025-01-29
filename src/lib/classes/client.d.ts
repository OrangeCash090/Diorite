export = Client;
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
declare class Client extends EventEmitter<[never]> {
    /**
     * @param {any} socket - The WebSocket instance.
     * @param {any} server - The server instance.
     */
    constructor(socket: any, server: any);
    /** @type {any} */
    socket: any;
    /** @type {any} */
    server: any;
    /** @type {WorldHandler} */
    World: WorldHandler;
    /** @type {CommandHandler} */
    CommandRunner: CommandHandler;
    /** @type {EventHandler} */
    Events: EventHandler;
    /** @type {PlayerHandler} */
    Players: PlayerHandler;
    /** @type {GUIHandler} */
    GUI: GUIHandler;
    /** @type {DisplayHandler} */
    DisplayBlock: DisplayHandler;
    /**
     * @property {Object} CFrame - A reference to the CFrame type.
     * @property {Vec3} Vec3 - A reference to the Vec3 type.
     * @property {function(...args: any): number} randomInt - A function that generates random integers.
    */
    /** @type {null | Player} */
    localPlayer: null | Player;
    /** @type {boolean} */
    isHost: boolean;
    /** @type {number} */
    permission: number;
    /** @type {null | string} */
    uuid: null | string;
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
    on<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;
    /**
     * Runs a command on the server.
     * @param {string} command - The command to execute.
     * @returns {Promise<Response>} - The result of the command.
     */
    runCommand(command: string): Promise<Response>;
    getPing(amount?: number): Promise<number>;
    /**
     * Sends rawtext to the chat.
     * @param {string} text - The text to send.
     * @param {string} player - The targets that see the text.
     */
    sayText(text: string, player?: string): void;
    /**
     * Subscribes to an event.
     * @param {string} eventName - The event to subscribe to.
     */
    subscribeTo(eventName: string): Promise<void>;
    /**
     * Sets up the client by fetching initial data.
     */
    _setup(): Promise<void>;
}
declare namespace Client {
    export { Response, ClientEvents };
}
import EventEmitter = require("events");
import WorldHandler = require("./world");
import CommandHandler = require("./command");
import EventHandler = require("./event");
import { PlayerHandler } from "./player";
import GUIHandler = require("./graphics");
import DisplayHandler = require("./display");
import { Player } from "./player";
type Response = import("../utils/response");
type ClientEvents = {
    /**
     * - Fired when a chat message is received. Arguments: sender, message.
     */
    chatMessage: [sender: string, message: string];
    /**
     * - Fired when an item is interacted with. Arguments: item, enchants
     */
    itemInteracted: [name: string, enchants: any];
    /**
     * - Fired when right click is pressed. Arguments: item, enchants
     */
    mouseDown: [name: string, enchants: any];
    /**
     * - Fired when right click is released.
     */
    mouseUp: [];
};
