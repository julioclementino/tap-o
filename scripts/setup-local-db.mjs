import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import mysql from 'mysql2/promise';
const secretFile = '.local/mysql-secret.json';
let secret = existsSync(secretFile) ? JSON.parse(readFileSync(secretFile, 'utf8')) : null;
const db = await mysql.createConnection({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: secret?.root || '',
});
try {
  if (!secret) {
    secret = { root: randomBytes(24).toString('hex'), app: randomBytes(24).toString('hex') };
    writeFileSync(secretFile, JSON.stringify(secret));
    await db.query("ALTER USER 'root'@'localhost' IDENTIFIED BY ?", [secret.root]);
  }
  for (const name of ['tap_o', 'tap_o_test'])
    await db.query(
      `CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  await db.query("CREATE USER IF NOT EXISTS 'tap_o'@'localhost' IDENTIFIED BY ?", [secret.app]);
  await db.query("GRANT ALL PRIVILEGES ON tap_o.* TO 'tap_o'@'localhost'");
  await db.query("GRANT ALL PRIVILEGES ON tap_o_test.* TO 'tap_o'@'localhost'");
  const env = `HOST=0.0.0.0\nPORT=3001\nDB_HOST=127.0.0.1\nDB_PORT=3307\nDB_NAME=tap_o\nDB_USER=tap_o\nDB_PASSWORD=${secret.app}\nCORS_ORIGINS=http://localhost:8081,http://127.0.0.1:8081\n`;
  if (!existsSync('apps/server/.env')) writeFileSync('apps/server/.env', env);
  else
    console.log('apps/server/.env preservado. Confira se aponta para a base local na porta 3307.');
  console.log(
    'Bases tap_o e tap_o_test preparadas. Credenciais somente em arquivos locais ignorados pelo Git.',
  );
} finally {
  await db.end();
}
