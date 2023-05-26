import { Configuration, OpenAIApi } from "openai";
import dotenv from "dotenv";

dotenv.config();

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openAiApi = new OpenAIApi(configuration);

export const openAi = {
    generate: async (messages) => {
        if (!messages) throw new Error("Necessário criar um template de mensagem: openAi.createTemplate(role, content)");

        const response = await openAiApi.createChatCompletion({
            model: "gpt-3.5-turbo",
            temperature: 0.6,
            messages: [ messages ]
        });

        return response;
    },
    createTemplate: (role, content) => {
        if (!role || !content) throw new Error("Parâmetros necessários: role e content");
        return { role, content: content };
    }
}