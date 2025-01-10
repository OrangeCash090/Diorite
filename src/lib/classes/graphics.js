const EventEmitter = require("node:events");
const JSONSender = require("../utils/JSONSender");

/**
* @typedef {import("./client")} Client
*/

/**
 * Represents a basic text label element.
 * @extends EventEmitter
 */
class TextLabel extends EventEmitter {
    /**
     * Creates a TextLabel.
     * @param {string} text - The text content of the label.
     * @param {"left"|"center"|"right"} [align="left"] - The alignment of the text.
     */
    constructor(text, align = "left") {
        super();

        /** @type {string} */
        this.text = text;
        /** @type {boolean} */
        this.visible = true;
        /** @type {{x: number, y: number}} */
        this.position = { x: 0, y: 0 };
        /** @type {"left"|"center"|"right"} */
        this.alignment = align;
        /** @type {string} */
        this.type = "TextLabel";
        /** @type {string} */
        this.color = "r";
    }

    /**
     * Sets the position of the TextLabel.
     * @param {number} x - The x-coordinate of the label.
     * @param {number} y - The y-coordinate of the label.
     */
    setPosition(x, y) {
        this.position = { x: x, y: y };
    }
}

/**
 * Represents a text box element.
 * Emits a `click` event when interacted with.
 * @extends TextLabel
 * @fires TextBox#click
 */
class TextBox extends TextLabel {
    /**
     * Creates a TextBox.
     * @param {string} text - The placeholder text.
     * @param {"left"|"center"|"right"} [align="left"] - The alignment of the text.
     */
    constructor(text, align) {
        super(text, align);

        /** @type {string} */
        this.placeholder = text;
        /** @type {string} */
        this.highlightColor = "e";
        /** @type {string} */
        this.type = "TextBox";
    }

    /**
     * Emitted when the text box is clicked.
     * @event TextBox#click
     */
}

/**
 * Represents a text button element.
 * Emits a `click` event when interacted with.
 * @extends TextLabel
 * @fires TextButton#click
 */
class TextButton extends TextLabel {
    /**
     * Creates a TextButton.
     * @param {string} text - The text content of the button.
     * @param {"left"|"center"|"right"} [align="left"] - The alignment of the text.
     */
    constructor(text, align) {
        super(text, align);

        /** @type {string} */
        this.highlightColor = "e";
        /** @type {string} */
        this.type = "TextButton";
    }

    /**
     * Emitted when the button is clicked.
     * @event TextButton#click
     */
}

/**
 * Represents a page in the GUI.
 */
class Page {
    /**
     * Creates a Page.
     * @param {number} sizeX - The width of the page.
     * @param {number} sizeY - The height of the page.
     * @param {boolean} scrollable - Whether or not the page can scroll.
     */
    constructor(sizeX, sizeY, scrollable, scrollMode) {
        /** @type {string} */
        this.text = "";
        /** @type {string[][]} */
        this.data = [];
        /** @type {(TextLabel|TextBox|TextButton)[]} */
        this.elements = [];
        /** @type {(TextBox|TextButton)[]} */
        this.interactables = [];
        /** @type {TextLabel|TextBox|TextButton} */
        this.selectedElement = null;
        /** @type {number} */
        this.elementIndex = 0;
        /** @type {{x: number, y: number}} */
        this.size = { x: sizeX, y: sizeY };
        /** @type {number} */
        this.scrollSizeY = sizeY;
        /** @type {number} */
        this.scrollYOffset = 0;
        /** @type {boolean} */
        this.scrollable = scrollable;
        /** @type {string} */
        this.scrollMode = scrollMode;

        this.clear();
    }

    /**
     * Creates a new element on the page.
     * @param {"TextLabel"|"TextBox"|"TextButton"} type - The type of the element.
     * @param {string} text - The text content of the element.
     * @returns {TextLabel|TextBox|TextButton} The created element.
     */
    createElement(type, text) {
        let element = null;
        let interact = false;

        switch (type) {
            case "TextLabel":
                element = new TextLabel(text);
                break;

            case "TextBox":
                element = new TextBox(text);
                interact = true;
                break;

            case "TextButton":
                element = new TextButton(text);
                interact = true;
                break;
        }

        this.elements.push(element);

        if (interact) {
            // @ts-ignore
            this.interactables.push(element);
        }

        return element;
    }

    /**
     * Clears the page content.
     */
    clear() {
        this.data = [];

        for (let element of this.elements) {
            if (element.position.y >= this.scrollSizeY) {
                this.scrollSizeY = element.position.y + 1;
            }
        }

        for (let y = 0; y < this.scrollSizeY; y++) {
            this.data[y] = [];
            for (let x = 0; x < this.size.x; x++) {
                this.data[y][x] = " ";
            }
        }
    }

    /**
     * Updates the page content and refreshes its layout.
     */
    update() {
        this.text = "";
        this.clear();

        for (let element of this.elements) {
            let text = element.text;
            let lines = text.split("\n");
            let pos = element.position;
            let alignment = element.alignment;

            for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
                let line = lines[lineIndex];
                let startX = pos.x;

                if (alignment === "center") {
                    startX = Math.max(0, Math.ceil((this.size.x - line.length) / 2));
                } else if (alignment === "right") {
                    startX = Math.max(0, this.size.x - line.length);
                }

                for (let charIndex = 0; charIndex < line.length; charIndex++) {
                    let char = line[charIndex];
                    if (lineIndex === 0 && charIndex === 0) {
                        char = `§${element.color}${char}`;
                    }
                    let x = startX + charIndex;
                    let y = pos.y + lineIndex;

                    if (y < this.scrollSizeY && x < this.size.x) {
                        this.data[y][x] = char;
                    }
                }
            }
        }

        for (let y = 0; y < this.size.y; y++) {
            for (let x = 0; x < this.size.x; x++) {
                this.text += this.data[y + this.scrollYOffset][x];
            }

            this.text += "\n";
        }
    }
}

/**
 * Represents the GUI system, managing pages and interactions.
 * @extends EventEmitter
 */
class GUI extends EventEmitter {
    /**
     * Creates a GUI.
     * @param {Client} client - The client instance.
     */
    constructor(client) {
        super();

        /** @type {Client} */
        this.client = client;
        /** @type {Object<string, Page>} */
        this.pages = {};
        /** @type {Page|null} */
        this.currentPage = null;
        /** @type {boolean} */
        this.editingText = false;
        /** @type {boolean} */
        this.visible = false;

        this.client.on("mouseDown", (item, enchants) => {
            if (this.visible == true) {
                if (item == "slime_ball") {
                    if (this.currentPage.selectedElement != null) {
                        switch (this.currentPage.selectedElement.type) {
                            case "TextButton":
                                this.currentPage.selectedElement.color = "8";
                                this.currentPage.selectedElement.emit("click");
                                break;
    
                            case "TextBox":
                                this.currentPage.selectedElement.color = "8";
                                this.currentPage.selectedElement.text = "___";
                                this.currentPage.selectedElement.emit("click");
                                this.editingText = true;
                                break;
                        }
                    }
                } else if (item == "magma_cream") {
                    if (this.currentPage.selectedElement != null) {
                        this.currentPage.selectedElement.color = "r";
                        
                        if (this.currentPage.selectedElement.type == "TextBox" && this.editingText == true) {
                            this.editingText = false;
    
                            // @ts-ignore
                            this.currentPage.selectedElement.text = this.currentPage.selectedElement.placeholder;
                        }
                    }
    
                    this.currentPage.selectedElement = this.currentPage.interactables[this.currentPage.elementIndex];
    
                    // @ts-ignore
                    this.currentPage.selectedElement.color = this.currentPage.selectedElement.highlightColor;
                    this.currentPage.elementIndex ++;
    
                    if (this.currentPage.scrollMode == "smooth") {
                        this.currentPage.scrollYOffset = this.currentPage.selectedElement.position.y > (this.currentPage.size.y - 1) ? this.currentPage.selectedElement.position.y - (this.currentPage.size.y - 1) : 0;
                    } else if (this.currentPage.scrollMode == "fixed") {
                        this.currentPage.scrollYOffset = Math.floor((this.currentPage.selectedElement.position.y) / this.currentPage.size.y) * this.currentPage.size.y;
                    }
    
                    if (this.currentPage.elementIndex > this.currentPage.interactables.length - 1) {
                        this.currentPage.elementIndex = 0;
                    }
                }
            }
        })

        this.client.on("mouseUp", () => {
            if (this.visible == true) {
                if (this.currentPage.selectedElement != null && this.currentPage.selectedElement.type == "TextButton") {
                    // @ts-ignore
                    this.currentPage.selectedElement.color = this.currentPage.selectedElement.highlightColor;
                }
            }
        })

        this.client.on("chatMessage", (sender, text) => {
            if (this.visible == true) {
                if (sender == this.client.localPlayer.username && this.editingText == true) {
                    if (this.currentPage.selectedElement != null) {
                        // @ts-ignore
                        this.currentPage.selectedElement.color = this.currentPage.selectedElement.highlightColor;
                        this.currentPage.selectedElement.text = text;
                        this.editingText = false;
    
                        this.emit("textEdited", this.currentPage.selectedElement, text);
                    }
                }
            }
        })

        setInterval(() => {
            if (this.visible) {
                this.render();
            }
        }, 100);
    }

    /**
     * Creates a new page.
     * @param {string} name - The name of the page.
     * @param {number} [sizeX=10] - The width of the page.
     * @param {number} [sizeY=5] - The height of the page.
     * @returns {Page} The created page.
     */
    createPage(name, sizeX = 40, sizeY = 5, scrollable = false, scrollMode = "smooth") {
        const page = new Page(sizeX, sizeY, scrollable, scrollMode);
        this.pages[name] = page;
        this.setPage(page);
        return page;
    }

    /**
     * Sets the current page.
     * @param {Page} page - The page to set as the current page.
     */
    setPage(page) {
        if (this.currentPage && this.currentPage.selectedElement) {
            this.currentPage.selectedElement.color = "r";

            if (this.currentPage.selectedElement.type === "TextBox" && this.editingText) {
                // @ts-ignore
                this.currentPage.selectedElement.text = this.currentPage.selectedElement.placeholder;
                this.editingText = false;
            }

            this.currentPage.selectedElement = null;
        }

        this.emit("pageChange");
        this.currentPage = page;
    }

    /**
     * Renders the current page.
     */
    render() {
        if (this.currentPage) {
            JSONSender.sendTitle(this.client.socket, this.currentPage.text, "@s", "actionbar");
            this.currentPage.update();
        }
    }
}

module.exports = GUI;