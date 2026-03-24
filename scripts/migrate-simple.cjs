const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: 'postgresql://postgres.nyiozcmzdehybowlnyvh:Qwer235678jkl@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('✅ 数据库连接成功\n');
    
    const sql = fs.readFileSync('supabase/migrations/MANUAL_MIGRATION.sql', 'utf8');
    
    console.log('📝 执行迁移...\n');
    await client.query(sql);
    
    console.log('✅ 迁移完成！\n');
    
    // 验证
    const result = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('name', 'email_verified', 'image')
    `);
    console.log('验证新字段:', result.rows.map(r => r.column_name).join(', '));
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
