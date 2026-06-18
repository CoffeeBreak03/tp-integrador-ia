"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const process_1 = require("./process");
const warm_up_1 = require("./warm-up");
const translate_1 = require("./translate");
const vision_1 = require("./vision");
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Routes
app.post('/api/process', process_1.processPage);
app.post('/api/warm-up', warm_up_1.warmUp);
app.post('/api/translate', translate_1.translateText);
app.post('/api/vision', vision_1.detectVision);
// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Express server is running' });
});
// Serve frontend static files in production
const frontendDistPath = path_1.default.join(__dirname, '../../frontend/dist');
app.use(express_1.default.static(frontendDistPath));
// Catch-all route for SPA client-side routing
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(frontendDistPath, 'index.html'));
});
app.listen(port, () => {
    console.log(`[SERVER] Express backend running at http://localhost:${port}`);
});
//# sourceMappingURL=server.js.map