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
    console.log("prompt: ", input);
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
      `Como experto en Git, genera un mensaje de commit profesional basado en el siguiente diff en ${language}.` +
      (commitType ? ` Usa el tipo de commit '${commitType}'.` : '') +
      `${customMessageConvention ? ` Aplica las siguientes reglas del objeto JSON, usa la clave como lo que debe cambiarse y el valor como cómo debe cambiarse en tu respuesta: ${customMessageConvention}.` : ''}` +
      'No agregues prefijos al commit, usa tiempo presente, y devuelve la oración completa incluyendo el tipo de commit' +
      `${customMessageConvention ? `. Además, aplica estas reglas con formato JSON a tu respuesta, incluso si contradicen las reglas anteriores ${customMessageConvention}: ` : ': '}` +
      '\n\n'+
      diff
    );
  },

  getPromptForMultipleCommits: (diff, {commitType, customMessageConvention, numOptions, language}) => {
    return (
      `Como experto en Git, genera ${numOptions} mensajes de commit profesionales basados en el siguiente diff en ${language}.` +
      (commitType ? ` Usa el tipo de commit '${commitType}'.` : '') +
      ` Separa cada opción con ";".` +
      'Para cada opción, usa tiempo presente y devuelve la oración completa incluyendo el tipo de commit' +
      `${customMessageConvention ? `. Además, aplica estas reglas con formato JSON a tu respuesta, incluso si contradicen las reglas anteriores ${customMessageConvention}: ` : ': '}` +
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
