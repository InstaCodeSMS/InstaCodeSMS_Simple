const postgres = require('postgres');
const fs = require('fs');

async function executeMigration() {
  const sql = postgres('postgresql://postgres:Qwer235678jkl@db.nyiozcmzdehybowlnyvh.supabase.co:5432/postgres', {
    ssl: 'require',
  });

  const migrationSQL = fs.readFileSync('supabase/migrations/20260319_fix_business_tables_complete.sql', 'utf8');
  
  console.log('🔄 执行完整修复...\n');
  
  try {
    await sql.unsafe(migrationSQL);
    console.log('✅ 修复成功！\n');
    console.log('📋 已完成：');
    console.log('  ✓ 删除 RLS 策略');
    console.log('  ✓ 修改列类型为 TEXT');
    console.log('  ✓ 重新创建外键约束');
    console.log('  ✓ 重新创建 RLS 策略');
    console.log('\n🎉 Better Auth 迁移完成！');
    console.log('\n💡 下一步：');
    console.log('  1. 启动服务器：npm run dev');
    console.log('  2. 测试注册：node test-register-api.cjs');
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    await sql.end();
  }
}

executeMigration();
