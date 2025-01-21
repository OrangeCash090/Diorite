var commandList = {};

/**
* @typedef {import("../classes/client")} Client
*/

/**
 * Registers a new command.
 * @param {string} name - The name of the command.
 * @param {object} meta - The command's metadata.
 * @param {(client: Client, args: any[]) => void} cb - The function the command executes. 
 */
function register(name, meta, cb) {
    commandList[name] = {
        meta: meta,
        callback: cb
    };
}

module.exports = { register, commandList }