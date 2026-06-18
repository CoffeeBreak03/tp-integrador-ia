"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateText = void 0;
const azure_client_1 = require("./lib/azure-client");
const translateText = async (req, res) => {
    try {
        const body = req.body;
        if (!body.text) {
            res.status(400).json({ error: 'Missing text' });
            return;
        }
        const azureClient = (0, azure_client_1.getAzureClient)();
        const result = await azureClient.callTranslateModel(body.text);
        res.status(200).json({ translated: result });
    }
    catch (error) {
        console.error('Translate function error:', error);
        res.status(500).json({ error: String(error) });
    }
};
exports.translateText = translateText;
//# sourceMappingURL=translate.js.map