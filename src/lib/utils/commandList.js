const fs = require("fs");
var commandList = {};

/**
* @typedef {import("../classes/client")} Client
*/

fs.readdir("./src/lib/commands", (err, files) => {
    for (let i = 0; i < files.length; i++) {
        require(`../commands/${files[i]}`);
    }
})

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