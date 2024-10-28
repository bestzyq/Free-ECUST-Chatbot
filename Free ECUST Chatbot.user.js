// ==UserScript==
// @name         Free ECUST Chatbot
// @namespace    https://ecust.edu.cn/
// @version      0.1.3
// @description  Free and unrestricted ECUST chatbot
// @author       Oborozuki
// @match        *://ai.s.ecust.edu.cn/chatbot/*
// @run-at       document-start
// @grant        unsafeWindow
// ==/UserScript==

const modelTemperature = 0.8;
const useGPT4oMini = true;
const deleteSystemPrompt = true;

(function () {
    const originFetch = fetch;

    window.unsafeWindow.fetch = async (url, options) => {
        if (url.includes("/chatbot/api/tokenizer") || url.includes("/chatbot/api/paycenter/token/consume")) {
            return null;
        }

        if (url.includes("/chatbot/api/chat/") && options?.body) {
            const body = JSON.parse(options.body);
            body.chatSettings.temperature = modelTemperature;

            if (url.includes("/chatbot/api/chat/azure") && useGPT4oMini) {
                body.chatSettings.model = "gpt-4o-mini";
            }

            if (body.messages?.length) {
                const firstMessage = body.messages[0];
                if (deleteSystemPrompt && firstMessage.role === "system" && firstMessage.content.startsWith("你是华东理工大学智能学术问答助手")) {
                    body.messages.shift();
                }
            }
            options.body = JSON.stringify(body);
        }

        return originFetch(url, options).then(async (response) => {
            if (url.includes("/chatbot/api/text/check")) {
                const res = await response.clone().json();
                res.data.forEach(d => { d.code = 1; });
                return new Response(JSON.stringify(res), response);
            } else if (url.includes("/chatbot/api/paycenter/token/check")) {
                const res = await response.clone().json();
                res.unUsedToken = 9999999999;
                return new Response(JSON.stringify(res), response);
            }
            return response;
        });
    };
})();
