import Socket = require("./src/server");
import Client = require("./src/lib/classes/client");

// BedrockSocket class declaration
export class Socket extends EventEmitter {
    constructor(port: number);
    on(event: "connect", listener: (client: Client) => void): this;
}

// Command registration function
export interface CommandMeta {
    // Define metadata fields if needed
    [key: string]: any;
}

export function addGlobalCommand(
    name: string,
    meta: CommandMeta,
    cb: (client: Client, args: any[]) => void
): void;
