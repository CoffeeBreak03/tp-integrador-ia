"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const azure_client_1 = require("./lib/azure-client");
const orchestrator_1 = require("./orchestrator");
const validate_contract_1 = require("./lib/validate-contract");
const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
    try {
        const body = JSON.parse(event.body || '{}');
        if (!body.imageBase64) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify({ error: 'Missing imageBase64' }),
            };
        }
        const azureClient = (0, azure_client_1.getAzureClient)();
        const orchestrator = new orchestrator_1.PipelineOrchestrator(azureClient);
        const result = await orchestrator.processMangaImage(body.imageBase64, body.contexto);
        const validated = (0, validate_contract_1.validateTranslationContract)(result.translations);
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
                contexto: result.contexto,
                translations: validated,
            }),
        };
    }
    catch (error) {
        console.error('Process function error:', error);
        const message = String(error ?? 'Unknown error').toLowerCase();
        const statusCode = message.includes('hugging face') || message.includes('hf_space_api_url') || message.includes('timeout')
            ? 502
            : 500;
        return {
            statusCode,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ error: String(error) }),
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=process.js.map