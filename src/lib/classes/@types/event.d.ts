export = EventHandler;
/**
* @typedef {import("./client")} Client
*/
/**
 * A class for listening for events.
*/
declare class EventHandler {
    /**
    * @param {Client} client - The Client instance.
    */
    constructor(client: Client);
    /** @type {Client} */
    client: Client;
    lastInteract: number;
    isHoldingRight: boolean;
}
declare namespace EventHandler {
    export { Client };
}
type Client = import("../client");
