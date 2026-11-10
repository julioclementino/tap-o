import { readFileSync } from 'node:fs';
import mysql from 'mysql2/promise';
const secret = JSON.parse(readFileSync('.local/mysql-secret.json', 'utf8'));
const db = await mysql.createConnection({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: secret.root,
});
await db.query('SHUTDOWN');
await db.end();
console.log('MySQL isolado encerrado. Dados preservados em .local/mysql-data.');
