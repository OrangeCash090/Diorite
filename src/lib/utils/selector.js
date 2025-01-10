/**
 * A class that helps with defining Minecraft target selectors.
 */
class Selector {
    /**
     * @param {string} base - The base selector (ex: @a).
     * @param {object} parameters - An object that stores parameters (ex: { name: "bob" }).
     */
    constructor(base, parameters) {
        this.base = base;
        this.parameters = parameters;

        this.toString = () => {
            let str = `${this.base}`;
            let fIteration1 = true;

            for (const [key, value] of Object.entries(this.parameters)) {
                if (fIteration1) {
                    str += "[";
                    fIteration1 = false;
                } else {
                    str += ",";
                }

                if (typeof value === "string" || typeof value === "number") {
                    str += `${key}=${value}`;
                } else if (typeof value === "object") {
                    let fIteration2 = true;

                    if (Array.isArray(value)) {
                        str += `${key}=[`;
                        let fIteration3 = true;

                        for (const item of value) {
                            if (!fIteration3) {
                                str += ",";
                            } else {
                                fIteration3 = false;
                            }

                            str += "{";

                            for (const [deepKey, deepValue] of Object.entries(item)) {
                                if (!fIteration2) {
                                    str += ",";
                                } else {
                                    fIteration2 = false;
                                }

                                str += `${deepKey}=${deepValue}`;
                            }

                            str += "}";
                        }

                        str += "]";
                    } else {
                        str += `${key}={`;

                        for (const [deepKey, deepValue] of Object.entries(value)) {
                            if (!fIteration2) {
                                str += ",";
                            } else {
                                fIteration2 = false;
                            }

                            str += `${deepKey}=${deepValue}`;
                        }

                        str += "}";
                    }
                }
            }

            str += "]";
            return str;
        };

        this.add = (key, value) => {
            this.parameters[key] = value;
            return this.toString();
        };

        this.remove = (key) => {
            delete this.parameters[key];
            return this.toString();
        };
    }
}

module.exports = Selector;