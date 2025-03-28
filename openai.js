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
      `Escribe un mensaje de commit como si fueras un editor de código con personalidad. El mensaje debe ser claro y directo, pero con un toque de carácter, como si estuvieras contándole a un colega lo que hiciste y por qué lo hiciste.` +
      (commitType ? ` Tipo de commit: ${commitType}. ` : '') +
      `${customMessageConvention ? `Aplica el siguiente estilo con convenciones específicas de commit: ${customMessageConvention}. ` : ''}` +
      "No olvides que debe ser conciso, pero también reflejar la esencia de los cambios." +
      '\n\n' +
      diff
    );
  },

  getPromptForMultipleCommits: (diff, {commitType, customMessageConvention, numOptions, language}) => {
    return (
      `Escribe ${numOptions} mensajes de commit como si fueras un editor de código con personalidad. Los mensajes deben ser claros y directos, pero con un toque de carácter, como si estuvieras contándole a un colega lo que hiciste y por qué lo hiciste. Separa cada opción con ";".` +
      (commitType ? ` Tipo de commit: ${commitType}. ` : '') +
      `${customMessageConvention ? `Aplica el siguiente estilo con convenciones específicas de commit: ${customMessageConvention}. ` : ''}` +
      "No olvides que deben ser concisos, pero también reflejar la esencia de los cambios." +
      '\n\n' +
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
