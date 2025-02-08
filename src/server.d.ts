export = BedrockSocket;
/**
 * Represents a WebSocket Server.
 * @extends EventEmitter
 */
declare class BedrockSocket {
    /**
     * @param {number} port - The port the WebSocket server runs on.
     */
    constructor(port: number);
    websocket: any;
    /**
     * @param {"connect"} event - The event name.
     * @param {(client: Client) => void} listener - Listener for the event.
     * @returns {this}
     */
    on(event: "connect", listener: (client: Client) => void): this;
}
import Client = require("./lib/classes/client");
