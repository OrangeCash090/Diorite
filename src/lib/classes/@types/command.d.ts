export = CommandHandler;
/**
* @typedef {import("./client")} Client
*/
/**
 * A class that runs custom commands.
 */
declare class CommandHandler {
    /**
    * @param {Client} client - The Client instance.
    */
    constructor(client: Client);
    /** @type {Client} */
    client: Client;
    /** @type {object} */
    commands: object;
    /** @type {boolean} */
    enabled: boolean;
    /** @type {string} */
    prefix: string;
    /**
     * Registers a new command.
     * @param {string} name - The name of the command.
     * @param {object} meta - The command's metadata.
     * @param {(client: Client, args: any[]) => void} cb - The function the command executes.
     */
    addCommand(name: string, meta: object, cb: (client: Client, args: any[]) => void): void;
    /**
    * Creates a new command.
    * @param {string} name - The name of the command.
    * @param {Array} args - The arguments for the command.
    */
    callCommand(name: string, args: any[]): void;
}
declare namespace CommandHandler {
    export { Client };
}
type Client = import("../client");
