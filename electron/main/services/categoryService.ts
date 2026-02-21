import { eq, asc } from 'drizzle-orm'
import { getDb } from '../db/connection'
import * as schema from '../db/schema'

export async function listCategories() {
  const db = getDb()
  return db.select().from(schema.categories).orderBy(asc(schema.categories.name))
}

export async function createCategory(data: {
  name: string
  color?: string
  icon?: string
}) {
  const db = getDb()
  const result = db
    .insert(schema.categories)
    .values({
      name: data.name,
      color: data.color ?? null,
      icon: data.icon ?? null
    })
    .returning()
    .get()
  return result
}

export async function updateCategory(data: {
  id: number
  name: string
  color?: string
  icon?: string
}) {
  const db = getDb()
  const result = db
    .update(schema.categories)
    .set({
      name: data.name,
      color: data.color ?? null,
      icon: data.icon ?? null
    })
    .where(eq(schema.categories.id, data.id))
    .returning()
    .get()
  return result
}

export async function removeCategory(id: number) {
  const db = getDb()
  db.delete(schema.categories).where(eq(schema.categories.id, id)).run()
}
