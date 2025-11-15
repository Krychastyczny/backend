import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '..', 'tasks.json');

// Limity bezpieczeństwa
const MAX_TASKS = 1000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

function validateTaskStructure(task, index) {
  if (typeof task !== 'object' || task === null || Array.isArray(task)) {
    throw new Error(`Task at index ${index} must be an object`);
  }

  const requiredFields = ['id', 'title', 'completed', 'createdAt'];
  const missingFields = requiredFields.filter((field) => !(field in task));

  if (missingFields.length > 0) {
    throw new Error(
      `Task at index ${index} is missing required fields: ${missingFields.join(', ')}`,
    );
  }

  // Walidacja typów
  if (typeof task.id !== 'number' && typeof task.id !== 'string') {
    throw new Error(`Task at index ${index} has invalid id type`);
  }

  if (typeof task.title !== 'string') {
    throw new Error(`Task at index ${index} has invalid title type`);
  }

  if (typeof task.completed !== 'boolean') {
    throw new Error(`Task at index ${index} has invalid completed type`);
  }

  if (typeof task.createdAt !== 'string') {
    throw new Error(`Task at index ${index} has invalid createdAt type`);
  }

  // Opcjonalne pola
  if (task.description !== undefined && typeof task.description !== 'string') {
    throw new Error(`Task at index ${index} has invalid description type`);
  }

  if (task.updatedAt !== undefined && typeof task.updatedAt !== 'string') {
    throw new Error(`Task at index ${index} has invalid updatedAt type`);
  }
}

function parseTasks(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Walidacja struktury każdego zadania
    parsed.forEach((task, index) => {
      validateTaskStructure(task, index);
    });

    return parsed;
  } catch (error) {
    if (error.message.includes('Task at index')) {
      const parseError = new Error('Invalid tasks.json format');
      parseError.statusCode = 500;
      parseError.details = error.message;
      throw parseError;
    }
    const parseError = new Error('Invalid tasks.json format');
    parseError.statusCode = 500;
    parseError.details = 'tasks.json contains malformed JSON';
    throw parseError;
  }
}

export async function readTasks() {
  await ensureFileExists();
  const stats = await fs.stat(dataPath);
  
  // Sprawdzenie rozmiaru pliku
  if (stats.size > MAX_FILE_SIZE) {
    const sizeError = new Error('File size exceeds maximum allowed size');
    sizeError.statusCode = 500;
    sizeError.details = `File size: ${stats.size} bytes, max: ${MAX_FILE_SIZE} bytes`;
    throw sizeError;
  }

  const raw = await fs.readFile(dataPath, 'utf-8');
  if (!raw.trim()) {
    return [];
  }
  
  const tasks = parseTasks(raw);
  
  // Sprawdzenie liczby zadań
  if (tasks.length > MAX_TASKS) {
    const countError = new Error('Number of tasks exceeds maximum allowed');
    countError.statusCode = 500;
    countError.details = `Tasks count: ${tasks.length}, max: ${MAX_TASKS}`;
    throw countError;
  }
  
  return tasks;
}

export async function writeTasks(tasks) {
  // Walidacja przed zapisem
  if (!Array.isArray(tasks)) {
    const error = new Error('Tasks must be an array');
    error.statusCode = 500;
    throw error;
  }

  if (tasks.length > MAX_TASKS) {
    const error = new Error('Number of tasks exceeds maximum allowed');
    error.statusCode = 400;
    error.details = `Cannot save ${tasks.length} tasks, maximum is ${MAX_TASKS}`;
    throw error;
  }

  // Walidacja struktury przed zapisem
  tasks.forEach((task, index) => {
    validateTaskStructure(task, index);
  });

  const jsonString = JSON.stringify(tasks, null, 2);
  const sizeInBytes = Buffer.byteLength(jsonString, 'utf-8');

  if (sizeInBytes > MAX_FILE_SIZE) {
    const error = new Error('Data size exceeds maximum file size');
    error.statusCode = 400;
    error.details = `Data size: ${sizeInBytes} bytes, max: ${MAX_FILE_SIZE} bytes`;
    throw error;
  }

  try {
    // Atomic write - zapis do pliku tymczasowego, potem rename
    const tempPath = `${dataPath}.tmp`;
    await fs.writeFile(tempPath, jsonString, 'utf-8');
    await fs.rename(tempPath, dataPath);
  } catch (error) {
    // Jeśli zapis się nie powiódł, usuń plik tymczasowy jeśli istnieje
    try {
      await fs.unlink(`${dataPath}.tmp`);
    } catch {
      // Ignoruj błędy przy usuwaniu pliku tymczasowego
    }
    throw error;
  }
}

export function getTasksFilePath() {
  return dataPath;
}
