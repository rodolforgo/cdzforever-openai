import { clientIrc } from "../services/irc2.js";
import { openAi } from "../services/openAi.js";
import { Cav, Fight } from "./entities.js";
import dotenv from "dotenv";

dotenv.config();

export const infoFight = {
    status: false,
    receiveAttacks: false,
    nicks: [],
    cavs: []
}

export function startFight(msg) {
    const nicks = msg.split(" ");

    if (!infoFight.status && nicks[1] && nicks[2]) {
        const nickA = nicks[1];
        const nickB = nicks[2];
        infoFight.nicks.push(nickA, nickB);

        clientIrc.say(process.env.IRC_CHANNEL, `Iniciando luta entre: ${nickA} e ${nickB}.`);
        clientIrc.say(process.env.IRC_CHANNEL, `Enviem seus dados digitando @Enviar ${process.env.IRC_NICK}`);

        infoFight.status = true;
    }
}

export function captureInfoCav(msg) {
    const nick = msg.split(" ")[2];

    // if (infoFight.cavs[0]?.nick === nick || infoFight.cavs[1]?.nick === nick) return;

    if (infoFight.nicks.includes(nick) && infoFight.cavs.length <= 1) {
        const cosmoSearch = msg.search("Cosmo");
        const armSearch = msg.search(" Armadura");

        const cosmo = msg.substring(cosmoSearch + 10).split(" ")[0];
        const arm = msg.substring(armSearch + 13).split(" ")[0];

        infoFight.cavs.push(new Cav(nick, cosmo, arm, []));

        clientIrc.say(`Dados de ${nick} recebido com sucesso!`);
    }

    if (infoFight.cavs.length === 2) {
        infoFight.receiveAttacks = true;
        clientIrc.say(process.env.IRC_CHANNEL, `Lutadores enviem seus ataques no meu pvt. Adicione a palavra FIM no término da sua última ação.`);
    }
}

export function receiveAttacks(nick, msg) {
    if (infoFight.cavs.length === 2) {
        infoFight.cavs.forEach((cav) => {
            if (cav.acao.join().includes("FIM")) return;
            if (cav.nick === nick) cav.acao.push(msg);
            if (msg.includes("FIM")) clientIrc.say(process.env.IRC_CHANNEL, `Ação de ${nick} computada com sucesso!`);
        });
    }

    createFightInOpenAi();
}

export async function createFightInOpenAi() {
    if (infoFight.cavs[0].acao.length && infoFight.cavs[1].acao.length) {
        const fight = new Fight(infoFight.cavs[0], infoFight.cavs[1], "Santuário");

        clientIrc.say(process.env.IRC_CHANNEL, `Gerando contexto de narração...`);

        const fightContext = openAi.createTemplate("user", fight.createFightContextMessage());

        try {
            clientIrc.say(process.env.IRC_CHANNEL, `Narração em produção...`);
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

