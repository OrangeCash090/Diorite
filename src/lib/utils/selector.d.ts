export = Selector;
/**
 * A class that helps with defining Minecraft target selectors.
 */
declare class Selector {
    /**
     * @param {string} base - The base selector (ex: @a).
     * @param {object} parameters - An object that stores parameters (ex: { name: "bob" }).
     */
    constructor(base: string, parameters: object);
    base: string;
    parameters: object;
    toString: () => string;
    add: (key: any, value: any) => string;
    remove: (key: any) => string;
}
