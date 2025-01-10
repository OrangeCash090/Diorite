/**
 * @param {string} string
 * @param {string} subString
 * @param {number} index
 */
function getPosition(string, subString, index) {
    return string.split(subString, index).join(subString).length;
}

/**
* @typedef {import("./client")} Client
*/

/**
 * A class that runs custom commands.
 */
class CommandHandler {
    /**
    * @param {Client} client - The Client instance.
    */
    constructor(client) {
        /** @type {Client} */
        this.client = client;

        /** @type {object} */
        this.commands = require("../utils/commandList").commandList;

        /** @type {boolean} */
        this.enabled = true;

        /** @type {string} */
        this.prefix = "!";

        this.client.on("chatMessage", (/** @type {string} */ sender, /** @type {string} */ message) => {
            if (this.enabled) {
                var msgArgs = message.split(" ");
    
                if (message.includes(`'`)) {
                    msgArgs[1] = message.slice(getPosition(message, `'`, 1), getPosition(message, `'`, 2) + 1);
                }
    
                if (sender == this.client.localPlayer.username) {
                    var cmdName = msgArgs[0].substring(1, msgArgs[0].length).toLowerCase();
    
                    if (msgArgs[0].substring(0, 1) == this.prefix) {
                        this.callCommand(cmdName, msgArgs.splice(1, msgArgs.length));
                    }
                }
            }
        })
    }

    /**
    * Creates a new command.
    * @param {string} name - The name of the command.
    * @param {object} meta - Metadata for the command.
    * @param {Function} cb - The function the command executes.
    */
    addCommand(name, meta, cb) {
        this.commands[name] = {
            meta: meta,
            callback: cb
        }
    }

    /**
    * Creates a new command.
    * @param {string} name - The name of the command.
    * @param {Array} args - The arguments for the command.
    */
    callCommand(name, args) {
        if (this.commands[name] != undefined) {
            this.commands[name].callback(this.client, args);
        }
    }
}

module.exports = CommandHandler;