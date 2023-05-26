import { clientIrc } from "../services/irc2.js";
import { openAi } from "../services/openAi.js";
import { Cav, Fight } from "./entities.js";
import dotenv from "dotenv";

dotenv.config();

export const infoFight = {
    status: false,
    receiveData: false,
    receiveAttacks: false,
    enableCommands: false,
    nicks: [],
    cavs: [],
    place: "Santuário"
}

export function startFight(msg) {
    const data = msg.split(" ");

    if (!infoFight.status && data[1] && data[2]) {
        const nickA = data[1];
        const nickB = data[2];
        infoFight.nicks.push(nickA, nickB);

        if (data.length > 2) {
            infoFight.place = data.slice(3, data.length).join(" ");
        }

        clientIrc.say(process.env.IRC_CHANNEL, `Iniciando luta entre: ${nickA} e ${nickB} - Local: ${infoFight.place}.`);
        clientIrc.say(process.env.IRC_CHANNEL, `Enviem seus dados digitando @Enviar ${process.env.IRC_NICK}`);

        infoFight.status = true;
        infoFight.receiveData = true;
    }
}

export function captureInfoCav(msg) {
    if (infoFight.receiveData) {
        const nick = msg.split(" ")[2];

        if (infoFight.cavs[0]?.nick === nick || infoFight.cavs[1]?.nick === nick) return;

        if (infoFight.nicks.includes(nick) && infoFight.cavs.length <= 1) {
            const cosmoSearch = msg.search("Cosmo");
            const armSearch = msg.search(" Armadura");

            const cosmo = msg.substring(cosmoSearch + 10).split(" ")[0];
            const arm = msg.substring(armSearch + 13).split(" ")[0];

            infoFight.cavs.push(new Cav(nick, cosmo, arm, []));

            clientIrc.say(process.env.IRC_CHANNEL, `Dados de ${nick} recebido com sucesso!`);
        }

        if (infoFight.cavs.length === 2) {
            infoFight.receiveData = false;
            infoFight.receiveAttacks = true;
            infoFight.enableCommands = true;
            clientIrc.say(process.env.IRC_CHANNEL, `Lutadores, enviem seus ataques no meu pvt. Adicione a palavra FIM no término da sua última ação.`);
        }
    }
}

export function captureCosmoCommand(msg) {
    if (infoFight.enableCommands) {
        const msgSplit = msg.split(" ");

        const nick = msgSplit[3].substring(2).substring(0, (msgSplit[3].length - 6));
        const cosmo = msgSplit[msgSplit.length - 4].substring(1, (msgSplit[msgSplit.length - 4].length - 5));

        if (infoFight.nicks.includes(nick) && Number(cosmo.replaceAll(".", ""))) {
            infoFight.cavs.forEach((cav) => {
                if (cav.nick === nick) {
                    cav.cosmo = cosmo;
                    clientIrc.say(process.env.IRC_CHANNEL, `Cosmo de ${nick} atualizado com sucesso!`);
                }
            });
        }
    }
}

export function receiveAttacks(nick, msg) {
    if (infoFight.receiveAttacks && infoFight.cavs.length === 2) {
        infoFight.cavs.forEach((cav) => {
            if (cav.acao.join().includes("FIM")) return;
            if (cav.nick === nick) {
                cav.acao.push(msg);
                if (msg.includes("FIM")) clientIrc.say(process.env.IRC_CHANNEL, `Ação de ${nick} computada com sucesso!`);
            }
        });
    }

    if (infoFight.cavs[0].acao.join().includes("FIM") && infoFight.cavs[1].acao.join().includes("FIM")) {
        infoFight.receiveAttacks = false;
        infoFight.enableCommands = false;
        createFightInOpenAi();
    }
}

function showActions() {
    if (infoFight.status) {
        clientIrc.say(process.env.IRC_CHANNEL, `- Ações:`);

        infoFight.cavs[0].acao.forEach((action) => clientIrc.say(process.env.IRC_CHANNEL, `${infoFight.cavs[0].nick} - ${action}`));
        infoFight.cavs[1].acao.forEach((action) => clientIrc.say(process.env.IRC_CHANNEL, `${infoFight.cavs[1].nick} - ${action}`));
    }
}

export async function createFightInOpenAi() {
    if (!infoFight.receiveAttacks && infoFight.cavs[0].acao.length && infoFight.cavs[1].acao.length) {
        const fight = new Fight(infoFight.cavs[0], infoFight.cavs[1], infoFight.place);

        showActions();

        clientIrc.say(process.env.IRC_CHANNEL, `Gerando contexto de narração...`);

        const fightContext = openAi.createTemplate("user", fight.createFightContextMessage());

        try {
            clientIrc.say(process.env.IRC_CHANNEL, `Produzindo o texto da narração...`);
            clientIrc.say(process.env.IRC_CHANNEL, `- Narração:`);
            const narration = await openAi.generate(fightContext);

            narration.data.choices.forEach((item) => {
                const separateMessage = item.message.content.match(/.{1,400}/g);
                separateMessage.forEach(msg => clientIrc.say(process.env.IRC_CHANNEL, msg));
            });

            finishFight();
        } catch (err) {
            console.log(err)
        }
    }
}

function finishFight() {
    if (infoFight.status) {
        infoFight.status = false;
        infoFight.nicks = [];
        infoFight.receiveAttacks = false;
        infoFight.cavs = [];
        clientIrc.say(process.env.IRC_CHANNEL, `Luta finalizada com sucesso!`);
    }
}

