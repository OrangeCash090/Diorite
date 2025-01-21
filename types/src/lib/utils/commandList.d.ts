export type Client = import("../classes/client");
/**
 * Registers a new command.
 * @param {string} name - The name of the command.
 * @param {object} meta - The command's metadata.
 * @param {(client: Client, args: any[]) => void} cb - The function the command executes.
 */
export function register(name: string, meta: object, cb: (client: Client, args: any[]) => void): void;
export var commandList: {};
