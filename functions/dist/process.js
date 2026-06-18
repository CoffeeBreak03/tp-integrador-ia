"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPage = void 0;
const azure_client_1 = require("./lib/azure-client");
const orchestrator_1 = require("./orchestrator");
const validate_contract_1 = require("./lib/validate-contract");
const processPage = async (req, res) => {
    try {
        const body = req.body;
        if (!body.imageBase64) {
            res.status(400).json({ error: 'Missing imageBase64' });
            return;
        }
        const azureClient = (0, azure_client_1.getAzureClient)();
        const orchestrator = new orchestrator_1.PipelineOrchestrator(azureClient);
        const result = await orchestrator.processMangaImage(body.imageBase64, body.contexto);
        const validated = (0, validate_contract_1.validateTranslationContract)(result.translations);
        res.status(200).json({
            contexto: result.contexto,
            translations: validated,
        });
    }
    catch (error) {
        console.error('Process function error:', error);
        const message = String(error ?? 'Unknown error').toLowerCase();
        const statusCode = message.includes('hugging face') || message.includes('hf_space_api_url') || message.includes('timeout')
            ? 502
            : 500;
        res.status(statusCode).json({ error: String(error) });
    }
};
exports.processPage = processPage;
//# sourceMappingURL=process.js.map