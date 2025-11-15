import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '..', 'tasks.json');

async function ensureFileExists() {
  try {
    await fs.access(dataPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(dataPath, '[]', 'utf-8');
      return;
    }
    throw error;
  }
}

function parseTasks(raw) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const parseError = new Error('Invalid tasks.json format');
    parseError.statusCode = 500;
    parseError.details = 'tasks.json contains malformed JSON';
    throw parseError;
  }
}

export async function readTasks() {
  await ensureFileExists();
  const raw = await fs.readFile(dataPath, 'utf-8');
  if (!raw.trim()) {
    return [];
  }
  return parseTasks(raw);
}

export async function writeTasks(tasks) {
  await fs.writeFile(dataPath, JSON.stringify(tasks, null, 2));
}

export function getTasksFilePath() {
  return dataPath;
}
