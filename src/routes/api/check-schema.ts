/**
 * 临时端点：检查数据库表结构
 */
import { Hono } from "hono";
import type { Env } from "../../types/env";
import postgres from "postgres";

const app = new Hono<{ Bindings: Env }>();

app.get("/", async (c) => {
  try {
    const connectionString = c.env.HYPERDRIVE?.connectionString || c.env.DATABASE_URL;
    
    if (!connectionString) {
      return c.json({ error: "No database connection" }, 500);
    }

    const sql = postgres(connectionString);
    
    // 检查 users 表字段
    const usersColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `;
    
    // 检查表是否存在
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'sessions', 'accounts', 'verifications')
    `;
    
    await sql.end();
    
    return c.json({
      usersColumns,
      existingTables: tables.map(t => t.table_name),
      requiredTables: ['users', 'sessions', 'accounts', 'verifications']
    });
    
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;
