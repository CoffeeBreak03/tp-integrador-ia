"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectPage = void 0;
const azure_client_1 = require("./lib/azure-client");
const orchestrator_1 = require("./orchestrator");
const detectPage = async (req, res) => {
    try {
        const body = req.body;
        if (!body.imageBase64) {
            res.status(400).json({ error: 'Missing imageBase64' });
            return;
        }
        const azureClient = (0, azure_client_1.getAzureClient)();
        const orchestrator = new orchestrator_1.PipelineOrchestrator(azureClient);
        const result = await orchestrator.detectTextBubblesOnly(body.imageBase64);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Detect function error:', error);
        const message = String(error ?? 'Unknown error').toLowerCase();
        const statusCode = message.includes('hugging face') || message.includes('hf_space_api_url') || message.includes('timeout')
            ? 502
            : 500;
        res.status(statusCode).json({ error: String(error) });
    }
};
exports.detectPage = detectPage;
//# sourceMappingURL=detect.js.map