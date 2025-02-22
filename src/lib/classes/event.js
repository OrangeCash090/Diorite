// @ts-nocheck
/**
* @typedef {import("./client")} Client
*/

/**
 * A class for listening for events.
*/
class EventHandler {
    /**
    * @param {Client} client - The Client instance.
    */
    constructor(client) {
        /** @type {Client} */
        this.client = client;
        this.lastInteract = Date.now();
        this.isHoldingRight = false;

        this.client.subscribeTo("PlayerMessage");
        this.client.subscribeTo("ItemInteracted");

        this.client.socket.on("message", (/** @type {string} */ msg) => {
            if (msg == "keepalive") return;

            try {
                var parsedMsg = JSON.parse(msg);
                
                var reqID = parsedMsg.header.requestId;
                var resolver = this.client.responseResolvers.get(reqID);

                if (resolver) {
                    resolver.resolve(parsedMsg);
                    this.client.responseResolvers.delete(reqID);
                }

                if (parsedMsg.header.eventName == "PlayerMessage" && parsedMsg.body.sender != "External") {
                    this.client.emit("chatMessage", parsedMsg.body.sender, parsedMsg.body.message);
                } else if (parsedMsg.header.eventName == "ItemInteracted") {
                    this.client.emit("itemInteracted", parsedMsg.body.item.id, parsedMsg.body.item.enchantments);

                    this.lastInteract = Date.now();
                    if (!this.isHoldingRight) {
                        this.isHoldingRight = true;
                        this.client.emit("mouseDown", parsedMsg.body.item.id, parsedMsg.body.item.enchantments);
                    }
                }
            } catch {

            }
        })

        setInterval(() => {
            const now = Date.now();
            const timeSinceLastEvent = now - this.lastInteract;
        
            if (this.isHoldingRight && timeSinceLastEvent > 100) {
                this.isHoldingRight = false;
                this.client.emit("mouseUp");
            }
        }, 10);
    }
}

module.exports = EventHandler;