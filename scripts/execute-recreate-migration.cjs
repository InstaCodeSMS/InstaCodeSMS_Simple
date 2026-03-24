const postgres = require('postgres');
const fs = require('fs');

async function executeMigration() {
  const sql = postgres('postgresql://postgres:Qwer235678jkl@db.nyiozcmzdehybowlnyvh.supabase.co:5432/postgres', {
    ssl: 'require',
  });

  const migrationSQL = fs.readFileSync('supabase/migrations/20260319_recreate_better_auth_tables.sql', 'utf8');
  
  console.log('🔄 执行 Better Auth 表重建...\n');
  console.log('⚠️  警告：这将删除所有现有的 users, sessions, accounts, verifications 表！\n');
  
  try {
    await sql.unsafe(migrationSQL);
    console.log('✅ 迁移成功！');
    console.log('\n📋 已完成：');
    console.log('  - 删除旧表（UUID 类型）');
    console.log('  - 创建新表（TEXT 类型）');
    console.log('  - Better Auth 现在可以使用默认的字符串 ID');
    console.log('\n💡 下一步：');
    console.log('  1. 启动服务器：npm run dev');
    console.log('  2. 测试注册：node test-register-api.cjs');
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    await sql.end();
  }
}

executeMigration();
