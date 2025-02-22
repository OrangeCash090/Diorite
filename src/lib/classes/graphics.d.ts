export = GUI;
/**
 * Represents the GUI system, managing pages and interactions.
 * @extends EventEmitter
 */
declare class GUI extends EventEmitter<[never]> {
    /**
     * Creates a GUI.
     * @param {Client} client - The client instance.
     */
    constructor(client: Client);
    /** @type {Client} */
    client: Client;
    /** @type {Object<string, Page>} */
    pages: {
        [x: string]: Page;
    };
    /** @type {Page|null} */
    currentPage: Page | null;
    /** @type {boolean} */
    editingText: boolean;
    /** @type {boolean} */
    visible: boolean;
    /**
     * Creates a new page.
     * @param {string} name - The name of the page.
     * @param {number} [sizeX=10] - The width of the page.
     * @param {number} [sizeY=5] - The height of the page.
     * @returns {Page} The created page.
     */
    createPage(name: string, sizeX?: number, sizeY?: number, scrollable?: boolean, scrollMode?: string): Page;
    /**
     * Sets the current page.
     * @param {Page} page - The page to set as the current page.
     */
    setPage(page: Page): void;
    /**
     * Renders the current page.
     */
    render(): void;
}
declare namespace GUI {
    export { Client };
}
import EventEmitter = require("events");
/**
 * Represents a page in the GUI.
 */
declare class Page {
    /**
     * Creates a Page.
     * @param {number} sizeX - The width of the page.
     * @param {number} sizeY - The height of the page.
     * @param {boolean} scrollable - Whether or not the page can scroll.
     */
    constructor(sizeX: number, sizeY: number, scrollable: boolean, scrollMode: any);
    /** @type {string} */
    text: string;
    /** @type {string[][]} */
    data: string[][];
    /** @type {(TextLabel|TextBox|TextButton)[]} */
    elements: (TextLabel | TextBox | TextButton)[];
    /** @type {(TextBox|TextButton)[]} */
    interactables: (TextBox | TextButton)[];
    /** @type {TextLabel|TextBox|TextButton} */
    selectedElement: TextLabel | TextBox | TextButton;
    /** @type {number} */
    elementIndex: number;
    /** @type {{x: number, y: number}} */
    size: {
        x: number;
        y: number;
    };
    /** @type {number} */
    scrollSizeY: number;
    /** @type {number} */
    scrollYOffset: number;
    /** @type {boolean} */
    scrollable: boolean;
    /** @type {string} */
    scrollMode: string;
    /**
     * Creates a new element on the page.
     * @param {"TextLabel"|"TextBox"|"TextButton"} type - The type of the element.
     * @param {string} text - The text content of the element.
     * @returns {TextLabel|TextBox|TextButton} The created element.
     */
    createElement(type: "TextLabel" | "TextBox" | "TextButton", text: string): TextLabel | TextBox | TextButton;
    /**
     * Clears the page content.
     */
    clear(): void;
    /**
     * Updates the page content and refreshes its layout.
     */
    update(): void;
}
type Client = import("./client");
/**
* @typedef {import("./client")} Client
*/
/**
 * Represents a basic text label element.
 * @extends EventEmitter
 */
declare class TextLabel extends EventEmitter<[never]> {
    /**
     * Creates a TextLabel.
     * @param {string} text - The text content of the label.
     * @param {"left"|"center"|"right"} [align="left"] - The alignment of the text.
     */
    constructor(text: string, align?: "left" | "center" | "right");
    /** @type {string} */
    text: string;
    /** @type {boolean} */
    visible: boolean;
    /** @type {{x: number, y: number}} */
    position: {
        x: number;
        y: number;
    };
    /** @type {"left"|"center"|"right"} */
    alignment: "left" | "center" | "right";
    /** @type {string} */
    type: string;
    /** @type {string} */
    color: string;
    /**
     * Sets the position of the TextLabel.
     * @param {number} x - The x-coordinate of the label.
     * @param {number} y - The y-coordinate of the label.
     */
    setPosition(x: number, y: number): void;
}
/**
 * Represents a text box element.
 * Emits a `click` event when interacted with.
 * @extends TextLabel
 * @fires TextBox#click
 */
declare class TextBox extends TextLabel {
    /** @type {string} */
    placeholder: string;
    /** @type {string} */
    highlightColor: string;
}
/**
 * Represents a text button element.
 * Emits a `click` event when interacted with.
 * @extends TextLabel
 * @fires TextButton#click
 */
declare class TextButton extends TextLabel {
    /** @type {string} */
    highlightColor: string;
}
