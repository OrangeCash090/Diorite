import EventEmitter from "events";
import Client from "./src/lib/classes/client";
import { Vec3 } from "vec3";
import CFrame from "./src/lib/utils/cframe";
import { randomInteger } from "./src/lib/utils/math";

// Socket class declaration
export declare class Socket extends EventEmitter {
    constructor(port: number);
    on(event: "connect", listener: (client: Client) => void): this;
}

// Command registration function
export interface CommandMeta {
    [key: string]: any; // Define metadata fields if specific fields are needed
}

export declare function addGlobalCommand(
    name: string,
    meta: CommandMeta,
    cb: (client: Client, args: any[]) => void
): void;

export { CFrame };
export { Vec3 };
export { randomInteger };
