export = DisplayHandler;
/**
 * Handles the creation and management of display models.
 */
declare class DisplayHandler {
    /**
     * Creates a DisplayHandler instance.
     * @param {Client} client - The client instance.
     */
    constructor(client: Client);
    /** @type {Client} */
    client: Client;
    /**
     * Creates a new DisplayModel.
     * @param {string} name - The name of the model.
     * @param {Vec3} origin - The origin of the model.
     * @param {string} attachedTo - If the model is attached to an entity.
     * @returns {DisplayModel} The created model.
     */
    createModel(name: string, origin: Vec3, attachedTo: string): DisplayModel;
}
declare namespace DisplayHandler {
    export { Client };
}
import { Vec3 } from "vec3";
/**
 * Represents a 3D model composed of multiple blocks and welds.
 */
declare class DisplayModel {
    /**
     * Creates a DisplayModel instance.
     * @param {WebSocket} ws - The WebSocket for communication.
     * @param {string} name - The name of the model.
     * @param {Vec3} origin - The origin of the model.
     * @param {string} attachedTo - If the model is attached to an entity.
     */
    constructor(ws: WebSocket, name: string, origin: Vec3, attachedTo: string);
    /** @type {WebSocket} */
    ws: WebSocket;
    /** @type {Vec3} */
    origin: Vec3;
    /** @type {string} */
    attachedTo: string;
    /** @type {Object.<string, DisplayBlock>} */
    blocks: {
        [x: string]: DisplayBlock;
    };
    /** @type {Object.<string, Weld>} */
    welds: {
        [x: string]: Weld;
    };
    /** @type {string} */
    root: string;
    /** @type {string} */
    id: string;
    /** @type {string} */
    rootCommand: string;
    /**
     * Creates a new block and adds it to the model.
     * @param {string} name - The name of the block.
     * @param {string} [block="stone"] - The type of block.
     * @param {Vec3} [size=new Vec3(1, 1, 1)] - The size of the block.
     * @returns {DisplayBlock} The created block.
     */
    createBlock(name: string, block?: string, size?: Vec3): DisplayBlock;
    /**
     * Creates a weld between two blocks.
     * @param {DisplayBlock} part0 - The first block.
     * @param {DisplayBlock} part1 - The second block.
     * @param {CFrame} c0 - The offset for the first block.
     * @param {CFrame} c1 - The offset for the second block.
     * @param {string} name - The name of the weld.
     * @returns {Weld} The created weld.
     */
    createWeld(part0: DisplayBlock, part1: DisplayBlock, c0: any, c1: any, name: string): Weld;
    /**
     * Retrieves a block by name.
     * @param {string} name - The name of the block.
     * @returns {DisplayBlock|undefined} The block or undefined if not found.
     */
    getBlock(name: string): DisplayBlock | undefined;
    /**
     * Retrieves a weld by name.
     * @param {string} name - The name of the weld.
     * @returns {Weld|undefined} The weld or undefined if not found.
     */
    getWeld(name: string): Weld | undefined;
    /**
     * Sets the CFrame of a weld by name.
     * @param {string} name - The name of the weld.
     * @param {CFrame} cf - The new CFrame.
     */
    setWeldCFrame(name: string, cf: any): void;
    /**
     * Resets all welds to their initial state.
     */
    resetWelds(): void;
    /**
     * Sets the root CFrame of the model.
     * @param {Vec3} pos - The new root CFrame.
     */
    setRootPos(pos: Vec3): void;
    /**
     * Loads a model from a Roblox JSON file.
     * @param {string} path - The file path to the JSON.
     */
    loadFromRoblox(path: string): void;
    /**
     * Loads an animation from a file.
     * @param {string} path - The file path to the animation.
     * @param {number} [speed=1.5] - The playback speed.
     * @param {boolean} [loop=false] - Whether the animation should loop.
     * @returns {Animation} The loaded animation.
     */
    loadAnimation(path: string, speed?: number, loop?: boolean): Animation;
    /**
     * Aligns the model with the position of an entity
     * @param {string} entity - The name of the entity
     */
    alignTo(entity: string): void;
    /**
     * Spawns the model in the world.
     */
    spawn(): Promise<void>;
    /**
     * Resets the root entity of the model.
     */
    resetRoot(): Promise<void>;
    /**
     * Updates only the position of the root.
     */
    updatePosition(): void;
    /**
     * Updates the state of the model.
     */
    update(): void;
}
type Client = import("./client");
/**
 * Represents a block to be displayed in the 3D world.
 */
declare class DisplayBlock {
    /**
     * Creates a DisplayBlock instance.
     * @param {WebSocket} ws - The websocket client.
     * @param {string} name - The name of the block.
     * @param {string} block - The type of block (e.g., "stone", "air").
     * @param {Vec3} size - The size of the block.
     */
    constructor(ws: WebSocket, name: string, block: string, size: Vec3);
    /** @type {WebSocket} */
    ws: WebSocket;
    /** @type {string} */
    name: string;
    /** @type {Vec3} */
    size: Vec3;
    /** @type {string} */
    block: string;
    /** @type {Object} */
    cframe: Object;
    /** @type {Vec3} */
    rotOffset: Vec3;
    /** @type {string} */
    modelId: string;
    /**
     * Variables used for position and rotation.
     * @type {{ position: string[], rotation: string[] }}
     */
    variables: {
        position: string[];
        rotation: string[];
    };
    /**
     * Sets the displayed block.
     * @param {string} name - The name of the minecraft block.
     */
    switchBlock(name: string): void;
}
declare class Weld {
    constructor(part0: any, part1: any, c0: any, c1: any, name: any);
    part0: any;
    part1: any;
    c0: any;
    c1: any;
    name: any;
    base: {
        c0: any;
        c1: any;
    };
    setCFrame(cf: any): void;
    resetCFrame(): void;
}
declare class Animation {
    constructor(name: any, object: any, keyframes: any, length: any, loop: any, speed: any);
    name: any;
    object: any;
    keyframes: any;
    length: any;
    speed: any;
    loop: any;
    playLoop: any;
    currentTime: number;
    play(): void;
    stop(): void;
}
