// @ts-nocheck
const blockColors = require("../utils/json/colors.json");
const JSONSender = require("../utils/JSONSender");
const CFrame = require("../utils/cframe");
const { Vec3 } = require("vec3");
const fs = require("fs");
const { randomInteger } = require("../utils/math");

/**
* @typedef {import("./client")} Client
*/

var globalTick = 0;

function removeSpaces(str) {
    return str.split(" ").join("");
}

function trunc3(x) {
    return Number(x.toFixed(3));
}

function rad(angle) {
    return angle * (Math.PI / 180);
}

function findColor(col) {
    var closestPos = new Vec3(0, 0, 0);
    var closestBlock = "stone";

    for (let i = 0; i < blockColors.length; i++) {
        var color = new Vec3(blockColors[i].color.r, blockColors[i].color.g, blockColors[i].color.b);

        if (color.distanceTo(col) < closestPos.distanceTo(col)) {
            closestPos = color;
            closestBlock = blockColors[i].name;
        }
    }

    return closestBlock;
}

function lerp(v0, v1, t) {
    return (1 - t) * v0 + t * v1;
}

function catmullRomInterpolation(t, p0, p1, p2, p3) {
    const v0 = (p2 - p0) * 0.5;
    const v1 = (p3 - p1) * 0.5;
    const t2 = t * t;
    const t3 = t * t * t;

    const a = 2 * p1 - 2 * p2 + v0 + v1;
    const b = -3 * p1 + 3 * p2 - 2 * v0 - v1;
    const c = v0;
    const d = p1;

    return a * t3 + b * t2 + c * t + d;
}

function convertKeyframes(frames) {
    const result = {};

    if (frames[0] != undefined) {
        for (let i = 0; i < frames.length; i++) {
            const keyframe = frames[i];
            const time = keyframe.tm;
    
            for (let [name, value] of Object.entries(keyframe)) {
                name = removeSpaces(name);
    
                if (name !== "tm") {
                    if (result[name] == null) {
                        result[name] = [];
                    }
    
                    // Assume value.cf contains a flat array for CFrame
                    const cf = CFrame.new(
                        value.cf[0], value.cf[1], value.cf[2],
                        value.cf[3], value.cf[4], value.cf[5],
                        value.cf[6], value.cf[7], value.cf[8],
                        value.cf[9], value.cf[10], value.cf[11]
                    );
    
                    result[name].push([time, cf]);
                }
            }
        }
    } else {
        for (let [name, bone] of Object.entries(frames)) {
            result[name] = {};
            var temp = [];

            if (bone.position) {
                for (let [time, value] of Object.entries(bone.position)) {
                    result[name][time] = CFrame.new(value[0], value[1], value[2]);
                }
            }

            if (bone.rotation) {
                if (bone.rotation[0] == undefined) {
                    for (let [time, value] of Object.entries(bone.rotation)) {
                        if (result[name][time] != undefined) {
                            result[name][time] = result[name][time].multiply(CFrame.fromEulerAnglesXYZ(rad(value[0]), rad(value[1]), rad(value[2])));
                        } else {
                            result[name][time] = CFrame.fromEulerAnglesXYZ(rad(value[0]), rad(value[1]), rad(value[2]));
                        }
                    }
                } else {
                    if (result[name]["0.0"] != undefined) {
                        result[name]["0.0"] = result[name]["0.0"].multiply(CFrame.fromEulerAnglesXYZ(rad(bone.rotation[0]), rad(bone.rotation[1]), rad(bone.rotation[2])));
                    } else {
                        result[name]["0.0"] = CFrame.fromEulerAnglesXYZ(rad(bone.rotation[0]), rad(bone.rotation[1]), rad(bone.rotation[2]));
                    }
                }
            }

            for (let [time, cf] of Object.entries(result[name])) {
                temp.push([Number(time), cf]);
            }

            result[name] = temp;
        }
    }

    return result;
}

function interpolateLinear(t, keyframes) {
    const numKeyframes = keyframes.length;

    if (numKeyframes === 0) {
        return null;
    }

    for (let i = 0; i < numKeyframes - 1; i++) {
        const startTime = keyframes[i][0];
        const endTime = keyframes[i + 1][0];

        if (t >= startTime && t <= endTime) {
            const cf1 = keyframes[i][1];
            const cf2 = keyframes[i + 1][1];

            // Calculate the interpolation factor
            const localT = (t - startTime) / (endTime - startTime);

            // Use CFrame.lerp to interpolate between cf1 and cf2
            return cf1.lerp(cf2, localT);
        }
    }

    // Return the last CFrame if t is greater than the last keyframe time
    return keyframes[numKeyframes - 1][1];
}

function scaleIllusion(targetScale) {
    let { x, y, z } = targetScale;

    // Measure absolute differences
    let dx = Math.abs(x - y);
    let dy = Math.abs(y - z);
    let dz = Math.abs(x - z);

    // Find the smallest difference
    if (dx <= dy && dx <= dz) {
        // x and y are closest
        let avg = (x + y) / 2;
        x = y = avg;
    } else if (dy <= dx && dy <= dz) {
        // y and z are closest
        let avg = (y + z) / 2;
        y = z = avg;
    } else {
        // x and z are closest
        let avg = (x + z) / 2;
        x = z = avg;
    }

    // Ensure at least two values are the same, otherwise return null
    if (x !== z && x !== y && y !== z) return null;

    // Return corrected scale and transformation
    if (x === z) {
        return {
            scale: new Vec3(x, y, z),
            rotation: new Vec3(0, 0, 0)
        };
    } else if (y === z) {
        return {
            scale: new Vec3(y, x, z),
            rotation: new Vec3(0, 0, 90)
        };
    } else if (x === y) {
        return {
            scale: new Vec3(x, z, y),
            rotation: new Vec3(90, 0, 0)
        };
    }
}

class Animation {
    constructor(name, object, keyframes, length, loop, speed) {
        this.name = name;
        this.object = object;
        this.keyframes = keyframes;

        this.length = length;
        this.speed = speed;
        this.loop = loop
        this.playLoop = null;
        this.currentTime = 0;
    }

    play() {
        if (this.playLoop == null) {
            this.playLoop = setInterval(() => {
                if (this.currentTime >= this.length) {
                    this.currentTime = 0;

                    if (!this.loop) {
                        clearInterval(this.playLoop);

                        setTimeout(() => {
                            this.object.resetWelds();
                        }, 50);
                    }
                }

                for (let [name, bone] of Object.entries(this.keyframes)) {
                    const boneCF = interpolateLinear(this.currentTime, bone);
                    this.object.setWeldCFrame(name, boneCF);
                }

                this.currentTime += ((20 * this.speed) / 1000);
            }, 20);
        }
    }

    stop() {
        if (this.playLoop != null) {
            clearInterval(this.playLoop);
            this.currentTime = 0;

            setTimeout(() => {
                this.object.resetWelds();
            }, 50);
        }
    }
}

class Weld {
    constructor(part0, part1, c0, c1, name, active = true) {
        this.part0 = part0;
        this.part1 = part1;
        this.c0 = c0;
        this.c1 = c1;
        this.name = name;
        this.active = active;

        this.base = {
            c0: c0,
            c1: c1
        };
    }

    setCFrame(cf) {
        this.c0 = this.base.c0.multiply(cf);
    }

    resetCFrame() {
        this.c0 = this.base.c0;
        this.c1 = this.base.c1;
    }
}

/**
 * Represents a block to be displayed in the 3D world.
 */
class DisplayBlock {
    /**
     * Creates a DisplayBlock instance.
     * @param {WebSocket} ws - The websocket client.
     * @param {string} name - The name of the block.
     * @param {string} block - The type of block (e.g., "stone", "air").
     * @param {Vec3} size - The size of the block.
     * @param {boolean} rendered - Whether the block is rendered or not.
     */
    constructor(ws, name, block, size, rendered = true) {
        /** @type {WebSocket} */
        this.ws = ws;

        /** @type {string} */
        this.name = name;

        /** @type {Vec3} */
        this.size = size;

        /** @type {string} */
        this.block = block;

        /** @type {boolean} */
        this.rendered = rendered;

        /** @type {CFrame} */
        this.cframe = CFrame.new(0, 0, 0);

        /** @type {Vec3} */
        this.rotOffset = new Vec3(0, 0, 0);

        /** @type {string} */
        this.modelId = "";

        /**
         * Variables used for position and rotation.
         * @type {{ position: string[], rotation: string[] }}
         */
        this.variables = {
            position: [
                `t.xp${this.name}`,
                `t.yp${this.name}`,
                `t.zp${this.name}`,
            ],
            rotation: [
                `t.xr${this.name}`,
                `t.yr${this.name}`,
                `t.zr${this.name}`,
            ],
        };
    }

    /**
     * Sets the displayed block's texture.
     * @param {string} name - The name of the minecraft block.
     */
    switchTexture(name) {
        this.block = name;
        JSONSender.sendCommand(this.ws, `/replaceitem entity @e[type=fox,name=${this.name},tag=${this.modelId}] slot.weapon.mainhand 0 ${name}`);
    }
}

/**
 * Represents a 3D model composed of multiple blocks and welds.
 */
class DisplayModel {
    /**
     * Creates a DisplayModel instance.
     * @param {WebSocket} ws - The WebSocket for communication.
     * @param {string} name - The name of the model.
     * @param {Vec3} origin - The origin of the model.
     * @param {string} attachedTo - If the model is attached to an entity.
     */
    constructor(ws, name, origin, attachedTo) {
        /** @type {WebSocket} */
        this.ws = ws;

        /** @type {Vec3} */
        this.origin = origin;

        /** @type {string} */
        this.attachedTo = attachedTo;

        /** @type {Object.<string, DisplayBlock>} */
        this.blocks = {};

        /** @type {Object.<string, DisplayBlock>} */
        this.fakeBlocks = {};

        /** @type {Object.<string, Weld>} */
        this.welds = {};

        /** @type {Object.<string, Animation>} */
        this.animations = {};

        /** @type {string} */
        this.root = "root" + randomInteger(0, 500);

        /** @type {string} */
        this.id = name || "model" + randomInteger(0, 100);

        /** @type {string} */
        this.importType = "none";

        /** @type {string} */
        this.rootCommand = `v.tick=0;`;
        this.createBlock(this.root, "air");
    }

    /**
     * Creates a new block and adds it to the model.
     * @param {string} name - The name of the block.
     * @param {string} [block="stone"] - The type of block.
     * @param {Vec3} [size=new Vec3(1, 1, 1)] - The size of the block.
     * @param {boolean} rendered - Whether the block is rendered or not.
     * @returns {DisplayBlock} The created block.
     */
    createBlock(name, block = "stone", size = new Vec3(1, 1, 1), rendered = true) {
        if (this.blocks[name] != undefined) {
            name = `P${Object.keys(this.blocks).length}`;
        }

        var newDisplay = new DisplayBlock(this.ws, name, block, size, rendered);
        var adjustments = scaleIllusion(size);

        newDisplay.size = adjustments.scale;
        newDisplay.rotOffset = adjustments.rotation;
        newDisplay.modelId = this.id;

        if (rendered) {
            this.blocks[name] = newDisplay;
        } else {
            this.fakeBlocks[name] = newDisplay;
        }

        return newDisplay;
    }

    /**
     * Creates a weld between two blocks.
     * @param {DisplayBlock} part0 - The first block.
     * @param {DisplayBlock} part1 - The second block.
     * @param {CFrame} c0 - The offset for the first block.
     * @param {CFrame} c1 - The offset for the second block.
     * @param {string} name - The name of the weld.
     * @param {boolean} active - Whether or not the weld moves.
     * @returns {Weld} The created weld.
     */
    createWeld(part0, part1, c0, c1, name, active = true) {
        var newWeld = new Weld(part0, part1, c0, c1, name, active);
        this.welds[name] = newWeld;

        return newWeld;
    }

    /**
     * Retrieves a block by name.
     * @param {string} name - The name of the block.
     * @returns {DisplayBlock|undefined} The block or undefined if not found.
     */
    getBlock(name) {
        return this.blocks[name] || this.fakeBlocks[name];
    }

    /**
     * Retrieves a weld by name.
     * @param {string} name - The name of the weld.
     * @returns {Weld|undefined} The weld or undefined if not found.
     */
    getWeld(name) {
        return this.welds[name];
    }

    /**
     * Sets the CFrame of a weld by name.
     * @param {string} name - The name of the weld.
     * @param {CFrame} cf - The new CFrame.
     */
    setWeldCFrame(name, cf) {
        if (this.welds[name] != undefined) {
            this.welds[name].setCFrame(cf);
        }
    }

    /**
     * Resets all welds to their initial state.
     */
    resetWelds() {
        for (let [name, bone] of Object.entries(this.welds)) {
            bone.resetCFrame();
        }
    }

    /**
     * Sets the root CFrame of the model.
     * @param {Vec3} pos - The new root CFrame.
     */
    setRootPos(pos) {
        this.origin = pos;
    }

    /**
     * Loads a Roblox animation from a file.
     * @param {string} path - The file path to the animation.
     * @param {number} [speed=1.5] - The playback speed.
     * @param {boolean} [loop=false] - Whether the animation should loop.
     * @returns {Animation} The loaded animation.
     */
    loadRobloxAnimation(path, speed = 1.5, loop = false) {
        var name = path.split("/").pop().replace(".json", "");
        var data = JSON.parse(fs.readFileSync(path));
        var length = data[data.length - 1].tm;

        var keyframes = convertKeyframes(data);
        var anim = new Animation(name, this, keyframes, length, loop, speed);

        this.animations[name] = anim;
        return anim;
    }

    /**
     * Loads a Minecraft animation from a file.
     * @param {string} path - The file path to the animation.
     * @param {number} [speed=1.5] - The playback speed.
     * @returns {Object.<string, Animation>} The loaded animations.
     */
    loadMinecraftAnimation(path, speed = 1.5) {
        var animations = {};
        var data = JSON.parse(fs.readFileSync(path));
        
        for (let [name, sequence] of Object.entries(data.animations)) {
            var length = sequence.length;
            var keyframes = convertKeyframes(sequence.bones);
            var anim = new Animation(name, this, keyframes, length, sequence.loop, speed);

            this.animations[name] = anim;
            animations[name] = anim;
        }

        return animations;
    }

    /**
     * Aligns the model with the position of an entity
     * @param {string} entity - The name of the entity
     */
    alignTo(entity) {
        JSONSender.sendCommand(this.ws, `/execute as @e[name=${entity}] at @s rotated as @s run tp @e[type=fox,tag=!dead,tag=${this.id}] ~${this.origin.x} ~${this.origin.y} ~${this.origin.z} ~ ~`);
    }

    /**
     * Spawns the model in the world.
     */
    async spawn() {
        for (let block of Object.values(this.blocks)) {
            JSONSender.sendCommand(this.ws, `/summon fox ~~~ ~ ~ minecraft:ageable_grow_up ${block.name}`);
            JSONSender.sendCommand(this.ws, `/tag @e[type=fox,name=${block.name}] add ${this.id}`);
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        for (let i = 0; i < Object.values(this.blocks).length; i += 3) {
            var blocks = [Object.values(this.blocks)[i], Object.values(this.blocks)[i + 1], Object.values(this.blocks)[i + 2]];

            for (let j = 0; j < 3; j++) {
                if (blocks[j] != undefined) {
                    this.rootCommand += `${blocks[j].variables.position[0]}=0;${blocks[j].variables.position[1]}=0;${blocks[j].variables.position[2]}=0;${blocks[j].variables.rotation[0]}=0;${blocks[j].variables.rotation[1]}=0;${blocks[j].variables.rotation[2]}=0;`;
                }
            }

            await JSONSender.commandWithResponse(this.ws, `/playanimation @e[type=fox,name=${this.root},tag=${this.id}] animation.player.attack.positions none 0 "${this.rootCommand}" rootset${i}`);
            this.rootCommand = `v.tick=0;`;
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        for (let block of Object.values(this.blocks)) {
            JSONSender.sendCommand(this.ws, `/replaceitem entity @e[type=fox,name=${block.name},tag=${this.id}] slot.weapon.mainhand 0 ${block.block}`);
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        for (let block of Object.values(this.blocks)) {
            JSONSender.sendCommand(this.ws, `/playanimation @e[type=fox,name=${block.name},tag=${this.id}] animation.player.attack.positions none 0 "v.scale=1;v.xzscale=${block.size.x};v.yscale=${block.size.y};v.xpos=${block.variables.position[0]}*16;v.ypos=${block.variables.position[1]}*16;v.zpos=${block.variables.position[2]}*16;v.xrot=${block.variables.rotation[0]};v.yrot=${block.variables.rotation[1]};v.zrot=${block.variables.rotation[2]};" tempset`);
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        await JSONSender.commandWithResponse(this.ws, `/effect @e[type=fox,tag=${this.id}] instant_health infinite 255 true`);
        await JSONSender.commandWithResponse(this.ws, `/effect @e[type=fox,tag=${this.id}] invisibility infinite 255 true`);
        await JSONSender.commandWithResponse(this.ws, `/playanimation @e[type=fox,tag=${this.id}] animation.player.sleeping none 0 "" controller.animation.fox.move`);
        await JSONSender.commandWithResponse(this.ws, `/playanimation @e[type=fox,tag=${this.id}] animation.creeper.swelling none 0 "v.xbasepos=v.xbasepos??0;v.ybasepos=v.ybasepos??0;v.zbasepos=v.zbasepos??0;v.xpos=v.xpos??0;v.ypos=v.ypos??0;v.zpos=v.zpos??0;v.xrot=v.xrot??0;v.yrot=v.yrot??0;v.zrot=v.zrot??0;v.scale=v.scale??1;v.xzscale=v.xzscale??1;v.yscale=v.yscale??1;v.swelling_scale1=2.1385*math.sqrt(v.xzscale)*math.sqrt(v.scale);v.swelling_scale2=2.1385*math.sqrt(v.yscale)*math.sqrt(v.scale);" scale`);
        await JSONSender.commandWithResponse(this.ws, `/playanimation @e[type=fox,tag=${this.id}] animation.ender_dragon.neck_head_movement none 0 "v.head_rotation_x=0;v.head_rotation_y=0;v.head_rotation_z=0;v.head_position_x=(v.xbasepos*3741/8000)*math.sqrt(v.xzscale)*math.sqrt(v.scale);v.head_position_y=(10.6925+v.ybasepos*3741/8000)*math.sqrt(v.yscale)*math.sqrt(v.scale);v.head_position_z=(17.108-v.zbasepos*3741/8000)*math.sqrt(v.xzscale)*math.sqrt(v.scale);" posshift`);
        await JSONSender.commandWithResponse(this.ws, `/playanimation @e[type=fox,tag=${this.id}] animation.warden.move none 0 "v.body_x_rot=-v.zrot - 90;v.body_z_rot=-v.yrot;" xyrot`);
        await JSONSender.commandWithResponse(this.ws, `/playanimation @e[type=fox,tag=${this.id}] animation.player.attack.rotations none 0 "v.attack_body_rot_y=v.xrot;" zrot`);
        await JSONSender.commandWithResponse(this.ws, `/playanimation @e[type=fox,tag=${this.id}] animation.parrot.moving none 0 "v.wing_flap=(16-v.xpos)/0.3;" xpos`);
        await JSONSender.commandWithResponse(this.ws, `/playanimation @e[type=fox,tag=${this.id}] animation.minecart.move.v1.0 none 0 "v.rail_offset.x=0;v.rail_offset.y=1.6562+v.ypos/16+(math.cos(v.yrot)-1)*0.00769;v.rail_offset.z=0;" ypos`);
        await JSONSender.commandWithResponse(this.ws, `/playanimation @e[type=fox,tag=${this.id}] animation.parrot.dance none 0 "v.dance.x=-v.zpos-math.sin(v.yrot)*0.123;v.dance.y=0;" zpos`);

        this.update();
    }

    /**
     * Resets the root entity of the model.
     */
    async resetRoot() {
        JSONSender.sendCommand(this.ws, `/tag @e[type=fox,name=${this.root},tag=${this.id}] add dead`);
        JSONSender.sendCommand(this.ws, `/tp @e[type=fox,name=${this.root},tag=${this.id}] 0 10000 0`);
        await new Promise(resolve => setTimeout(resolve, 500));

        JSONSender.sendCommand(this.ws, `/kill @e[type=fox,name=${this.root},tag=${this.id}]`);
        JSONSender.sendCommand(this.ws, `/summon fox ${this.root} 0 10000 0`);
        JSONSender.sendCommand(this.ws, `/tag @e[type=fox,name=${this.root}] add ${this.id}`);
        JSONSender.sendCommand(this.ws, `/effect @e[type=fox,name=${this.root},tag=${this.id}] instant_health infinite 255 true`);
        JSONSender.sendCommand(this.ws, `/effect @e[type=fox,name=${this.root},tag=${this.id}] invisibility infinite 255 true`);
        JSONSender.sendCommand(this.ws, `/replaceitem entity @e[type=fox,name=${this.root},tag=${this.id}] slot.weapon.mainhand 0 air`);
        this.rootCommand = `v.tick=0;`;
    }

    /**
     * Updates only the position of the root.
     */
    updatePosition() {
        if (this.attachedTo) {
            this.alignTo(this.attachedTo);
        } else {
            JSONSender.sendCommand(this.ws, `/tp @e[type=fox,tag=!dead,tag=${this.id}] ${this.origin.x} ${this.origin.y} ${this.origin.z}`);
        }
    }

    /**
     * Updates the state of the model.
     */
    update() {
        this.rootCommand = `v.tick=${globalTick};`;

        for (let [name, bone] of Object.entries(this.welds)) {
            if (bone.active) {
                bone.part1.cframe = bone.part0.cframe.multiply(bone.c0).multiply(bone.c1.inverse());
            }
        }

        for (let i = 0; i < Object.values(this.blocks).length; i += 3) {
            var blocks = [Object.values(this.blocks)[i], Object.values(this.blocks)[i + 1], Object.values(this.blocks)[i + 2]];

            for (let j = 0; j < 3; j++) {
                if (blocks[j] != undefined) {
                    this.rootCommand += `${blocks[j].variables.position[0]}=${trunc3(blocks[j].cframe.position.x)};${blocks[j].variables.position[1]}=${trunc3(blocks[j].cframe.position.y)};${blocks[j].variables.position[2]}=${trunc3(blocks[j].cframe.position.z)};${blocks[j].variables.rotation[0]}=${trunc3(blocks[j].cframe.rotation.x) + blocks[j].rotOffset.x};${blocks[j].variables.rotation[1]}=${trunc3(blocks[j].cframe.rotation.y) + blocks[j].rotOffset.y};${blocks[j].variables.rotation[2]}=${trunc3(blocks[j].cframe.rotation.z) + blocks[j].rotOffset.z};`;
                }
            }

            JSONSender.sendCommand(this.ws, `/playanimation @e[type=fox,name=${this.root},tag=${this.id}] animation.player.attack.positions none 0 "${this.rootCommand}" rootset${i}`);
            this.rootCommand = `v.tick=${globalTick};`;
        }

        this.updatePosition();

        JSONSender.sendCommand(this.ws, `/stopsound @a mob.fox.ambient`);
        globalTick++;

        if (globalTick == 2000) {
            this.resetRoot();
            globalTick = 0;
        }
    }
}

/**
 * Handles the creation and management of display models.
 */
class DisplayHandler {
    /**
     * Creates a DisplayHandler instance.
     * @param {Client} client - The client instance.
     */
    constructor(client) {
        /** @type {Client} */
        this.client = client;
    }

    /**
     * Creates a new DisplayModel.
     * @param {string} name - The name of the model.
     * @param {Vec3} origin - The origin of the model.
     * @param {string} attachedTo - If the model is attached to an entity.
     * @returns {DisplayModel} The created model.
     */
    createModel(name, origin, attachedTo) {
        return new DisplayModel(this.client, name, origin || new Vec3(0, 0, 0), attachedTo);
    }

    /**
    * Creates a model from a Roblox JSON file.
    * @param {string} path - The file path to the JSON.
    * @param {Vec3} origin - The origin of the model.
    * @param {string} attachedTo - If the model is attached to an entity.
    * @returns {DisplayModel} The created model.
    */
    createFromRoblox(name, path, origin, attachedTo) {
        var model = this.createModel(name, origin, attachedTo);
        var data = JSON.parse(fs.readFileSync(path));

        var parts = data.Parts;
        var welds = data.Welds;
        var root = data.Root;

        for (let i = 0; i < parts.length; i++) {
            var texture = parts[i].block || (parts[i].transparency == 0 ? findColor(new Vec3(parts[i].color[0] / 255, parts[i].color[1] / 255, parts[i].color[2] / 255)) : "air");
            var block = model.createBlock(removeSpaces(parts[i].name), texture, new Vec3(parts[i].size[0], parts[i].size[1], parts[i].size[2]));
            var cf = parts[i].cframe;

            block.cframe = CFrame.new(cf[0], cf[1], cf[2], cf[3], cf[4], cf[5], cf[6], cf[7], cf[8], cf[9], cf[10], cf[11]);
        }

        for (let i = 0; i < welds.length; i++) {
            var c0 = welds[i].c0;
            var c1 = welds[i].c1;

            model.createWeld(model.getBlock(removeSpaces(welds[i].part0)), model.getBlock(removeSpaces(welds[i].part1)), CFrame.new(c0[0], c0[1], c0[2], c0[3], c0[4], c0[5], c0[6], c0[7], c0[8], c0[9], c0[10], c0[11]), CFrame.new(c1[0], c1[1], c1[2], c1[3], c1[4], c1[5], c1[6], c1[7], c1[8], c1[9], c1[10], c1[11]), removeSpaces(welds[i].name));
        }

        if (root != null) {
            delete model.blocks[model.root];
            JSONSender.sendCommand(this.client, `/kill @e[type=fox,name=${model.root},tag=${model.id}]`);
            model.root = root;
        }

        model.importType = "Roblox";
        return model;
    }

    /**
    * Creates a model from a Minecraft Geometry File.
    * @param {string} path - The file path to the JSON.
    * @param {Vec3} origin - The origin of the model.
    * @param {string} attachedTo - If the model is attached to an entity.
    * @returns {DisplayModel} The created model.
    */
    createFromGeo(name, path, origin, attachedTo) {
        var model = this.createModel(name, origin, attachedTo);
        var data = JSON.parse(fs.readFileSync(path));
        var bones = data["minecraft:geometry"][0].bones;

        for (let i = 0; i < bones.length; i++) {
            var name = bones[i].name;
            var cubes = bones[i].cubes;
            var pivot = bones[i].pivot;
            var parent = bones[i].parent;

            if (cubes != null) {
                for (let j = 0; j < cubes.length; j++) {
                    var cube = cubes[j];
    
                    var origin = new Vec3(cube.origin[0] / 16, cube.origin[1] / 16, cube.origin[2] / 16);
                    var size = new Vec3(cube.size[0] / 16, cube.size[1] / 16, cube.size[2] / 16);
                    var pos = new Vec3(origin.x + (size.x / 2), origin.y + (size.y / 2), origin.z + (size.z / 2));
                    var inflate = cube.inflate ? cube.inflate / 8 : 0;
    
                    var block = model.createBlock(name + (j == 0 ? "" : j), "smooth_stone", new Vec3(size.x + inflate, size.y + inflate, size.z + inflate));
                    block.cframe = CFrame.new(pos);
    
                    var center = pivot != null ? new Vec3(pivot[0] / 16, pivot[1] / 16, pivot[2] / 16) : pos;
    
                    if (j == 0) {
                        if (parent == null) {
                            var c0 = CFrame.new(center);
                            var c1 = CFrame.new(center.minus(pos));
        
                            model.createWeld(model.getBlock(model.root), block, c0, c1, name);
                        } else {
                            var c0 = CFrame.new(center.minus(model.getBlock(parent).cframe.position));
                            var c1 = CFrame.new(center.minus(pos));
        
                            model.createWeld(model.getBlock(parent), block, c0, c1, name);
                        }
                    } else {
                        var c0 = CFrame.new(center.minus(model.getBlock(name).cframe.position));
                        var c1 = CFrame.new(center.minus(pos));
    
                        model.createWeld(model.getBlock(name), block, c0, c1, name + j);
                    }
                }
            } else {
                var pos = model.getBlock(parent).cframe.position;
                var center = pivot != null ? new Vec3(pivot[0] / 16, pivot[1] / 16, pivot[2] / 16) : pos;

                var c0 = CFrame.new(center.minus(model.getBlock(parent).cframe.position));
                var c1 = CFrame.new(pos);

                var block = model.createBlock(name, "NULL", new Vec3(1,1,1), false);
                block.cframe = CFrame.new(center);

                model.createWeld(model.getBlock(parent), block, c0, c1, name);
            }
        }

        model.importType = "Minecraft";
        return model;
    }
}

module.exports = DisplayHandler