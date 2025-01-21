export = Response;
/**
 * A class that represents a command's response
 */
declare class Response {
    /**
     * @param {object} data - The command's response data.
     */
    constructor(data: object);
    /** @type {object} */
    header: object;
    /** @type {object} */
    body: object;
    /**
     * Gets the status message of the command.
     * @returns {string} - The command's status message.
     */
    getMessage(): string;
    /**
     * Gets the status code of the command.
     * @returns {number} - The command's status code.
     */
    getStatusCode(): number;
}
