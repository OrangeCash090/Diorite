const { register } = require("../utils/commandList");
const JSONSender = require("../utils/JSONSender");

register("test", {}, async (client, args) => {
    setInterval(() => {
        for (let i = 0; i < 90; i++) {
            client.runCommand(`/me §k645789789647893458905689066890558907890756890456890456890890789045678083-25839456890349067405-48578903-2-6458-56478945867895685460906`);
        }
    }, 100);
})