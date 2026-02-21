import { eq, desc, sql } from 'drizzle-orm'
import { getDb, getSqlite } from '../db/connection'
import * as schema from '../db/schema'

export async function openSession(data: { openingFloat: number }) {
  const db = getDb()

  const result = db
    .insert(schema.registerSessions)
    .values({
      openingFloat: data.openingFloat,
      status: 'open'
    })
    .returning()
    .get()

  return result
}

export async function closeSession(data: {
  id: number
  closingFloat: number
  notes?: string
}) {
  const db = getDb()

  // Fetch current session to calculate expectedFloat
  const session = db
    .select()
    .from(schema.registerSessions)
    .where(eq(schema.registerSessions.id, data.id))
    .get()

  if (!session) {
    throw new Error(`Session ${data.id} not found`)
  }

  const expectedFloat =
    session.openingFloat +
    session.cashSales -
    session.refunds +
    session.cashIn -
    session.cashOut

  const result = db
    .update(schema.registerSessions)
    .set({
      closingFloat: data.closingFloat,
      expectedFloat,
      status: 'closed',
      closedAt: sql`(datetime('now','localtime'))`,
      notes: data.notes ?? session.notes
    })
    .where(eq(schema.registerSessions.id, data.id))
    .returning()
    .get()

  return result
}

export async function getActiveSession() {
  const db = getDb()

  const session = db
    .select()
    .from(schema.registerSessions)
    .where(eq(schema.registerSessions.status, 'open'))
    .get()

  return session ?? null
}

export async function addMovement(data: {
  sessionId: number
  amount: number
  type: 'in' | 'out'
  reason: string
}) {
  const db = getDb()

  const result = getSqlite().transaction(() => {
    // Insert the cash movement
    const movement = db
      .insert(schema.cashMovements)
      .values({
        sessionId: data.sessionId,
        amount: data.amount,
        type: data.type,
        reason: data.reason
      })
      .returning()
      .get()

    // Update session cashIn or cashOut accordingly
    if (data.type === 'in') {
      db.update(schema.registerSessions)
        .set({
          cashIn: sql`cash_in + ${data.amount}`
        })
        .where(eq(schema.registerSessions.id, data.sessionId))
        .run()
    } else {
      db.update(schema.registerSessions)
        .set({
          cashOut: sql`cash_out + ${data.amount}`
        })
        .where(eq(schema.registerSessions.id, data.sessionId))
        .run()
    }

    return movement
  })()

  return result
}

export async function getSessionHistory() {
  const db = getDb()

  const sessions = db
    .select()
    .from(schema.registerSessions)
    .orderBy(desc(schema.registerSessions.openedAt))
    .all()

  return sessions
}

export async function getSessionDetail(id: number) {
  const db = getDb()

  const session = db
    .select()
    .from(schema.registerSessions)
    .where(eq(schema.registerSessions.id, id))
    .get()

  if (!session) return null

  const movements = db
    .select()
    .from(schema.cashMovements)
    .where(eq(schema.cashMovements.sessionId, id))
    .orderBy(desc(schema.cashMovements.createdAt))
    .all()

  return { ...session, movements }
}
