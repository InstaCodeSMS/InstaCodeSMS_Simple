const postgres = require('postgres');
const fs = require('fs');

async function executeMigration() {
  const sql = postgres('postgresql://postgres:Qwer235678jkl@db.nyiozcmzdehybowlnyvh.supabase.co:5432/postgres', {
    ssl: 'require',
  });

  const migrationSQL = fs.readFileSync('supabase/migrations/20260319_fix_better_auth_id_type.sql', 'utf8');
  
  console.log('🔄 执行迁移...\n');
  
  try {
    await sql.unsafe(migrationSQL);
    console.log('✅ 迁移成功！');
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
  } finally {
    await sql.end();
  }
}

executeMigration();
