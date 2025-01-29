const Socket = require("./src/server");
const addGlobalCommand = require("./src/lib/utils/commandList").register
const CFrame = require("./src/lib/utils/cframe");
const { Vec3 } = require("vec3");
const { randomInteger } = require("./src/lib/utils/math");

module.exports = {Socket, addGlobalCommand, CFrame, Vec3, randomInteger}