const Socket = require("./src/server");
const addGlobalCommand = require("./src/lib/utils/commandList").register

module.exports = {Socket, addGlobalCommand}