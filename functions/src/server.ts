import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before any other imports
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

import express from 'express';
import cors from 'cors';
import { processPage } from './process';
import { warmUp } from './warm-up';
import { translateText } from './translate';
import { detectVision } from './vision';

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.post('/api/process', processPage);
app.post('/api/warm-up', warmUp);
app.post('/api/translate', translateText);
app.post('/api/vision', detectVision);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Express server is running' });
});

// Serve frontend static files in production
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// Catch-all route for SPA client-side routing
app.use((req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`[SERVER] Express backend running at http://localhost:${port}`);
});
