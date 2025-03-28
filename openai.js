import { ChatGPTAPI } from "chatgpt";

import { encode } from 'gpt-3-encoder';
import inquirer from "inquirer";
import { AI_PROVIDER } from "./config.js"

const FEE_PER_1K_TOKENS = 0.02;
const MAX_TOKENS = 128000;
//this is the approximate cost of a completion (answer) fee from CHATGPT
const FEE_COMPLETION = 0.001;

const openai = {
  sendMessage: async (input, {apiKey, model}) => {
    console.log("prompting chat gpt...");
    const api = new ChatGPTAPI({
      apiKey,
      completionParams: {
        model: "gpt-4o-mini",
      },
    });
    const { text } = await api.sendMessage(input);

    return text;
  },

  getPromptForSingleCommit: (diff, {commitType, customMessageConvention, language}) => {
    return (
      `TAREA: Genera un mensaje de commit basado en el siguiente diff de git.` +
      `\nREGLAS:` +
      `\n- Sé conciso y directo` +
      `\n- Explica qué cambió y por qué` +
      `\n- No respondas como en una conversación` +
      `\n- Solo devuelve el mensaje del commit` +
      (commitType ? `\n- Usa el tipo de commit: ${commitType}` : '') +
      (customMessageConvention ? `\n- Aplica estas convenciones: ${customMessageConvention}` : '') +
      `\n\nDIFF DEL CAMBIO:\n` +
      diff
    );
  },

  getPromptForMultipleCommits: (diff, {commitType, customMessageConvention, numOptions, language}) => {
    return (
      `TAREA: Genera ${numOptions} mensajes de commit diferentes basados en el siguiente diff de git.` +
      `\nREGLAS:` +
      `\n- Sé conciso y directo en cada mensaje` +
      `\n- Explica qué cambió y por qué` +
      `\n- No respondas como en una conversación` +
      `\n- Separa cada mensaje con ";"` +
      `\n- Solo devuelve los mensajes de commit` +
      (commitType ? `\n- Usa el tipo de commit: ${commitType}` : '') +
      (customMessageConvention ? `\n- Aplica estas convenciones: ${customMessageConvention}` : '') +
      `\n\nDIFF DEL CAMBIO:\n` +
      diff
    );
  },

  filterApi: async ({ prompt, numCompletion = 1, filterFee }) => {
    const numTokens = encode(prompt).length;
    const fee = numTokens / 1000 * FEE_PER_1K_TOKENS + (FEE_COMPLETION * numCompletion);

    if (numTokens > MAX_TOKENS) {
        console.log("The commit diff is too large for the ChatGPT API. Max 4k tokens or ~8k characters. ");
        return false;
    }

    if (filterFee) {
        console.log(`This will cost you ~$${+fee.toFixed(3)} for using the API.`);
        const answer = await inquirer.prompt([
            {
                type: "confirm",
                name: "continue",
                message: "Do you want to continue 💸?",
                default: true,
            },
        ]);
        if (!answer.continue) return false;
    }

    return true;
}


};

export default openai;
