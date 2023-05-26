import ircClient from "node-irc";
import dotenv from "dotenv";
import { captureCosmoCommand, captureInfoCav, infoFight, receiveAttacks, startFight } from "../core/controllers.js";

dotenv.config();

export const clientIrc = new ircClient(process.env.IRC_SERVER, process.env.IRC_PORT, process.env.IRC_NICK);

clientIrc.on('ready', function () {
    clientIrc.join(process.env.IRC_CHANNEL);
});

clientIrc.on('CHANMSG', function (data) {
    /** 
        The data object contains
        data.receiver : The channel the message was written in prefixed with hash (#) 
        data.sender   : The nick of the person who sent the message
        data.message  : The message the person sent
    **/
    if (data.sender === "forgo") {
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