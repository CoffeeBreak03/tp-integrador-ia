"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables before any other imports
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const process_1 = require("./process");
const warm_up_1 = require("./warm-up");
const translate_1 = require("./translate");
const vision_1 = require("./vision");
const detect_1 = require("./detect");
const translate_page_1 = require("./translate-page");
const cache_1 = require("./cache");
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Routes
app.post('/api/process', process_1.processPage);
app.post('/api/detect', detect_1.detectPage);
app.post('/api/translate-page', translate_page_1.translatePage);
app.post('/api/warm-up', warm_up_1.warmUp);
app.post('/api/translate', translate_1.translateText);
app.post('/api/vision', vision_1.detectVision);
app.post('/api/cache/check', cache_1.checkCacheRoute);
app.post('/api/cache/save', cache_1.saveCacheRoute);
// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Express server is running' });
});
// Serve frontend static files in production
const frontendDistPath = path_1.default.join(__dirname, '../../frontend/dist');
app.use(express_1.default.static(frontendDistPath));
// Catch-all route for SPA client-side routing
app.use((req, res) => {
    res.sendFile(path_1.default.join(frontendDistPath, 'index.html'));
});
app.listen(port, () => {
    console.log(`[SERVER] Express backend running at http://localhost:${port}`);
});
//# sourceMappingURL=server.js.map