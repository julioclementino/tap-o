import mysql from 'mysql2/promise';
import { config } from './config';
export const createPool = () => mysql.createPool(config.database);
export type Database = ReturnType<typeof createPool>;
