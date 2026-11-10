import express from 'express';
import { resolve } from 'node:path';
const app = express();
const folder = resolve('apps/mobile/dist');
app.use(express.static(folder));
app.get('/{*path}', (_req, res) => res.sendFile(resolve(folder, 'index.html')));
app.listen(8081, '127.0.0.1', () => console.log('Tap-o preview: http://localhost:8081'));
