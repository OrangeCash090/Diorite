/**
 * A class that represents a command's response
 */
class Response {
    /**
     * @param {object} data - The command's response data.
     */
    constructor(data) {
        /** @type {object} */
        this.header = data.header;

        /** @type {object} */
        this.body = data.body;
    }

    /**
     * Gets the status message of the command.
     * @returns {string} - The command's status message.
     */
    getMessage() {
        return this.body.message || this.body.statusMessage;
    }

    /**
     * Gets the status code of the command.
     * @returns {number} - The command's status code.
     */
    getStatusCode() {
        return this.body.statusCode;
    }
}

module.exports = Response;