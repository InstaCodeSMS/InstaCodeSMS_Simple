const postgres = require('postgres');
const fs = require('fs');

async function executeMigration() {
  const sql = postgres('postgresql://postgres:Qwer235678jkl@db.nyiozcmzdehybowlnyvh.supabase.co:5432/postgres', {
    ssl: 'require',
  });

  const migrationSQL = fs.readFileSync('supabase/migrations/20260319_fix_business_tables_user_id.sql', 'utf8');
  
  console.log('🔄 修复业务表的 user_id 类型...\n');
  
  try {
    await sql.unsafe(migrationSQL);
    console.log('✅ 修复成功！');
    console.log('\n📋 已完成：');
    console.log('  - payment_orders.user_id: UUID → TEXT');
    console.log('  - profiles.user_id: UUID → TEXT');
    console.log('  - wallets.user_id: UUID → TEXT');
    console.log('  - wallet_transactions.user_id: UUID → TEXT');
    console.log('  - 重新创建所有外键约束');
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    await sql.end();
  }
}

executeMigration();
