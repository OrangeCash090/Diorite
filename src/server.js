const EventEmitter = require("node:events");
const WebSocket = require('ws');
const Client = require("./lib/classes/client");

/**
 * Represents a WebSocket Server.
 * @extends EventEmitter
 */
class BedrockSocket extends EventEmitter {
    /**
     * @param {number} port - The port the WebSocket server runs on.
     */
    constructor(port) {
        super();

        this.websocket = new WebSocket.Server({port: port});
        this.websocket.on("connection", (conn) => {
            const newClient = new Client(conn, this.websocket);

            newClient._setup().then(() => {
                this.emit("connect", newClient);
            });

            setInterval(() => {
                conn.send("keepalive");
            }, 3000);
        });
    }

    /**
     * @param {"connect"} event - The event name.
     * @param {(client: Client) => void} listener - Listener for the event.
     * @returns {this}
     */
    on(event, listener) {
        return super.on(event, listener);
    }
}

module.exports = BedrockSocket;