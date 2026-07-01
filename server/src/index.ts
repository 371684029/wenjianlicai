import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { initSchema } from './db.js';
import { api } from './routes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

initSchema();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', api);

// 生产环境托管前端构建产物（web/dist），实现单进程对外提供网站 + API
const webDist = resolve(__dirname, '..', '..', 'web', 'dist');
if (existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get('*', (_req, res) => {
    res.sendFile(resolve(webDist, 'index.html'));
  });
}

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`[server] API listening on http://localhost:${PORT}/api`);
  if (existsSync(webDist)) console.log(`[server] serving web from ${webDist}`);
});
