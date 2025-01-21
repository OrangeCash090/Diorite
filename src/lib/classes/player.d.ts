export type Client = import("./client");
/**
 * A class for interacting with players in a Minecraft world.
 */
export class PlayerHandler {
    /**
    * @param {Client} client - The Client instance.
    */
    constructor(client: Client);
    /** @type {Client} */
    client: Client;
    /**
    * Gets the player with the specified username in the world.
    * @param {string} username - The player's username.
    * @returns {Player} - The Player object.
    */
    getPlayer(username: string): Player;
    getAllPlayers(): Promise<{}>;
}
/**
* @typedef {import("./client")} Client
*/
/**
 * Represents a Minecraft player.
 */
export class Player {
    /**
     * @param {Client} client - The WebSocket instance.
     * @param {string} username - The username of the player.
     */
    constructor(client: Client, username: string);
    /** @type {Client} */
    client: Client;
    /** @type {string} */
    username: string;
    doesExist(): Promise<boolean>;
    getGameMode(): Promise<string>;
    getPosition(round?: boolean): Promise<Vec3>;
    getYRotation(): Promise<any>;
    getRotation(): Promise<Vec3>;
    getLookVector(): Promise<any>;
    getTransform(): Promise<{
        position: Vec3;
        rotation: Vec3;
        lookVector: any;
    }>;
    raycast(range: any): Promise<any>;
    isInArea(min: any, max: any): Promise<boolean>;
    getScores(): Promise<{}>;
    hasTag(tag: any): Promise<boolean>;
    getAllTags(): Promise<string[]>;
}
import { Vec3 } from "vec3";
