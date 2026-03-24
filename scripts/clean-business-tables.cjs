const postgres = require('postgres');

async function cleanTables() {
  const sql = postgres('postgresql://postgres:Qwer235678jkl@db.nyiozcmzdehybowlnyvh.supabase.co:5432/postgres', {
    ssl: 'require',
  });

  console.log('🧹 清空业务表数据...\n');
  
  try {
    // 清空所有引用 users 的业务表
    await sql`TRUNCATE TABLE wallet_transactions CASCADE`;
    console.log('✓ wallet_transactions 已清空');
    
    await sql`TRUNCATE TABLE wallets CASCADE`;
    console.log('✓ wallets 已清空');
    
    await sql`TRUNCATE TABLE payment_orders CASCADE`;
    console.log('✓ payment_orders 已清空');
    
    await sql`TRUNCATE TABLE profiles CASCADE`;
    console.log('✓ profiles 已清空');
    
    console.log('\n✅ 所有业务表已清空');
    console.log('\n💡 现在可以重新执行迁移了');
    
  } catch (error) {
    console.error('❌ 清空失败:', error.message);
  } finally {
    await sql.end();
  }
}

cleanTables();
