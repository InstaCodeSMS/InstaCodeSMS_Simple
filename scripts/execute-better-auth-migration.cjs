const postgres = require('postgres');
const fs = require('fs');

async function executeMigration() {
  const sql = postgres('postgresql://postgres:Qwer235678jkl@db.nyiozcmzdehybowlnyvh.supabase.co:5432/postgres', {
    ssl: 'require',
  });

  const migrationSQL = fs.readFileSync('supabase/migrations/20260319_better_auth_text_ids.sql', 'utf8');
  
  console.log('🔄 执行 Better Auth ID 类型迁移...\n');
  
  try {
    await sql.unsafe(migrationSQL);
    console.log('✅ 迁移成功！所有 ID 已从 UUID 改为 TEXT');
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    await sql.end();
  }
}

executeMigration();
