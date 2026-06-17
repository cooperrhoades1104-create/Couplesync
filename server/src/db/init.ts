import { getDb } from './database';

export function initDb() {
  const db = getDb();
  console.log('Database initialized successfully');
  return db;
}