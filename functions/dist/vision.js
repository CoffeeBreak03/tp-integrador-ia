"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectVision = void 0;
const azure_client_1 = require("./lib/azure-client");
const detectVision = async (req, res) => {
    try {
        const body = req.body;
        if (!body.imageBase64) {
            res.status(400).json({ error: 'Missing imageBase64' });
            return;
        }
        const azureClient = (0, azure_client_1.getAzureClient)();
        const result = await azureClient.detectTextBubbles(body.imageBase64);
        res.status(200).json({ vision_output: result });
    }
    catch (error) {
        console.error('Vision function error:', error);
        res.status(500).json({ error: String(error) });
    }
};
exports.detectVision = detectVision;
//# sourceMappingURL=vision.js.map