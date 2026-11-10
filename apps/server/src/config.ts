import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });
export const config = {
  host: process.env.HOST || '0.0.0.0',
  port: Number(process.env.PORT || 3001),
  origins: (process.env.CORS_ORIGINS || 'http://localhost:8081,http://127.0.0.1:8081')
    .split(',')
    .map((origin) => origin.trim()),
  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || 'tap_o',
    user: process.env.DB_USER || 'tap_o',
    password: process.env.DB_PASSWORD || '',
    connectionLimit: 6,
    timezone: 'Z',
    decimalNumbers: true,
  },
};
