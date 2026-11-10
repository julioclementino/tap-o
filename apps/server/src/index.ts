import { createApp } from './app';
import { config } from './config';
import { createPool } from './db';
const db = createPool();
const server = createApp(db).listen(config.port, config.host, () =>
  console.log(`Tap-o API: http://localhost:${config.port}`),
);
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => {
    server.close(() => {
      void db.end().then(() => process.exit(0));
    });
  });
