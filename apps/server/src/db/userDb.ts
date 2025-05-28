import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

sqlite3.verbose();

let db: Database | null = null;

export class UserNotFoundError extends Error { }
export class UserAlreadyExistsError extends Error { }

async function withTransaction<T>(db: Database, fn: () => Promise<T>): Promise<T> {
  await db.exec('BEGIN');
  try {
    const result = await fn();
    await db.exec('COMMIT');
    return result;
  } catch (err) {
    await db.exec('ROLLBACK');
    throw err;
  }
}

export async function initDb(): Promise<Database> {
  if (db) return db;

  db = await open({
    filename: 'app.db',
    driver: sqlite3.Database,
  });

  // Idempotent table creation
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}

export type User = {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
};

export type NewUser = Omit<User, 'id' | 'created_at'>;

// CRUD Accessors

export async function createUser(user: NewUser): Promise<User> {
  const db = await initDb();

  return withTransaction(db, async () => {
    try {
      const result = await db.run(
        `INSERT INTO users (username, email, password_hash)
        VALUES (?, ?, ?)`,
        user.username,
        user.email,
        user.password_hash
      );

      const newUser = await db.get<User>(`SELECT * FROM users WHERE id = ?`, result.lastID);
      if (!newUser)
        throw new UserNotFoundError('User creation failed unexpectedly');
      return newUser;
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        throw new UserAlreadyExistsError(`User with username "${user.username}" or email "${user.email}" already exists`);
      }
      throw err;
    }
  });
}

export async function getUserById(id: number): Promise<User> {
  const db = await initDb();
  const user = await db.get<User>(`SELECT * FROM users WHERE id = ?`, id);
  if (!user)
    throw new UserNotFoundError(`User with ID ${id} not found`);
  return user;
}

export async function getAllUsers(): Promise<User[]> {
  const db = await initDb();
  return await db.all<User[]>(`SELECT * FROM users ORDER BY id`);
}

export async function updateUser(id: number, updates: Partial<NewUser>): Promise<User | null> {
  const db = await initDb();

  return withTransaction(db, async () => {
    const current = await getUserById(id);

    const updated = {
      username: updates.username ?? current.username,
      email: updates.email ?? current.email,
      password_hash: updates.password_hash ?? current.password_hash,
    };

    await db.run(
      `UPDATE users SET username = ?, email = ?, password_hash = ? WHERE id = ?`,
      updated.username,
      updated.email,
      updated.password_hash,
      id
    );

    return await getUserById(id);
  });
}

export async function deleteUser(id: number): Promise<User> {
  const db = await initDb();

  return withTransaction(db, async () => {
    const user = await db.get<User>(`SELECT * FROM users WHERE id = ?`, id);
    if (!user)
      throw new UserNotFoundError(`User with ID ${id} not found`);

    const result = await db.run(`DELETE FROM users WHERE id = ?`, id);
    if (!result.changes)
      throw new UserNotFoundError('User creation failed unexpectedly');

    return user;
  });
}
