const postgres = require('postgres');

async function findPolicies() {
  const sql = postgres('postgresql://postgres:Qwer235678jkl@db.nyiozcmzdehybowlnyvh.supabase.co:5432/postgres', {
    ssl: 'require',
  });

  console.log('🔍 查找业务表的 RLS 策略...\n');
  
  const tables = ['payment_orders', 'profiles', 'wallets', 'wallet_transactions'];
  
  try {
    for (const table of tables) {
      console.log(`\n📋 ${table}:`);
      const policies = await sql`
        SELECT policyname, cmd, qual, with_check
        FROM pg_policies 
        WHERE tablename = ${table}
      `;
      
      if (policies.length > 0) {
        policies.forEach(p => {
          console.log(`  - ${p.policyname} (${p.cmd})`);
        });
      } else {
        console.log('  无策略');
      }
    }
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await sql.end();
  }
}

findPolicies();
