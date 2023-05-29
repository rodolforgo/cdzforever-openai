import ircClient from "node-irc";
import dotenv from "dotenv";
import { captureCosmoCommand, captureInfoCav, infoFight, receiveAttacks, startFight } from "../core/controllers.js";

dotenv.config();

export const clientIrc = new ircClient(process.env.IRC_SERVER, process.env.IRC_PORT, process.env.IRC_NICK);

const STAFF = JSON.parse(process.env.IRC_STAFF_CDZFOREVER);

clientIrc.on('ready', function () {
    clientIrc.join(process.env.IRC_CHANNEL);
});

clientIrc.on('CHANMSG', function (data) {
    // O objeto data contém: data.receiver, data.sender, data.message
    
    if (STAFF.includes(data.sender)) {
        console.log("eae")
        if (data.message.includes("!luta") && !infoFight.status) {
            startFight(data.message);
        }
    }

    if (infoFight.enableCommands && data.sender === process.env.IRC_NICK_CDZFOREVER) {
        captureCosmoCommand(data.message);
    }
});

clientIrc.on('PRIVMSG', function (data) {
    const nick = data.sender;
    const message = data.message;

    if (nick === process.env.IRC_NICK_CDZFOREVER && message.includes("Cosmo" && "Armadura")) {
        captureInfoCav(message);
    }

    if (infoFight.receiveAttacks && infoFight.nicks.includes(nick)) {
        receiveAttacks(nick, message);
    }
});