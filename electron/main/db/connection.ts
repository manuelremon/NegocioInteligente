import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync } from 'fs'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'

let db: ReturnType<typeof drizzle<typeof schema>>
let sqlite: Database.Database

function getDbPath(): string {
  const userDataPath = app.getPath('userData')
  const dbDir = join(userDataPath, 'db')
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }
  return join(dbDir, 'negocio.db')
}

function getMigrationsPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'migrations')
  }
  // In dev, __dirname is out/main/ so we go up 2 levels to project root
  return join(app.getAppPath(), 'resources/migrations')
}

export function initDb(): void {
  const dbPath = getDbPath()

  // Backup before migration
  if (existsSync(dbPath)) {
    copyFileSync(dbPath, dbPath + '.bak')
  }

  sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  db = drizzle(sqlite, { schema })

  const migrationsFolder = getMigrationsPath()
  if (existsSync(migrationsFolder)) {
    migrate(db, { migrationsFolder })
  }
}

export function getDb(): typeof db {
  return db
}

export function getSqlite(): Database.Database {
  return sqlite
}
