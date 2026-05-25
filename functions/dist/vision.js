"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const azure_client_1 = require("./lib/azure-client");
const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
    try {
        const body = JSON.parse(event.body || '{}');
        if (!body.imageBase64) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing imageBase64' }),
            };
        }
        const azureClient = (0, azure_client_1.getAzureClient)();
        const result = await azureClient.callVisionModel(body.imageBase64);
        return {
            statusCode: 200,
            body: JSON.stringify({ vision_output: result }),
        };
    }
    catch (error) {
        console.error('Vision function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: String(error) }),
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=vision.js.map