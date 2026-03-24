const postgres = require('postgres');

async function checkDatabaseStatus() {
  const sql = postgres('postgresql://postgres:Qwer235678jkl@db.nyiozcmzdehybowlnyvh.supabase.co:5432/postgres', {
    ssl: 'require',
  });

  console.log('🔍 检查数据库状态...\n');
  
  try {
    // 1. 检查 users 表的数据量
    console.log('📊 1. 用户数据统计');
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`   用户总数: ${userCount[0].count}`);
    
    // 2. 检查 users.id 的类型
    console.log('\n🔧 2. users.id 列类型');
    const columnType = await sql`
      SELECT data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'id'
    `;
    console.log(`   当前类型: ${columnType[0].data_type} (${columnType[0].udt_name})`);
    
    // 3. 检查所有引用 users.id 的外键
    console.log('\n🔗 3. 引用 users.id 的外键');
    const foreignKeys = await sql`
      SELECT 
        tc.table_name,
        kcu.column_name,
        tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'users'
        AND ccu.column_name = 'id'
    `;
    foreignKeys.forEach(fk => {
      console.log(`   - ${fk.table_name}.${fk.column_name} (${fk.constraint_name})`);
    });
    
    // 4. 检查 RLS 策略
    console.log('\n🛡️  4. RLS 策略');
    const policies = await sql`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd
      FROM pg_policies 
      WHERE tablename = 'users'
    `;
    if (policies.length > 0) {
      policies.forEach(p => {
        console.log(`   - ${p.policyname} (${p.cmd})`);
      });
    } else {
      console.log('   无 RLS 策略');
    }
    
    // 5. 检查相关表的数据量
    console.log('\n📈 5. 相关表数据统计');
    const tables = ['sessions', 'accounts', 'wallets', 'wallet_transactions', 'payment_orders', 'profiles'];
    for (const table of tables) {
      try {
        const count = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`;
        console.log(`   ${table}: ${count[0].count} 条记录`);
      } catch (e) {
        console.log(`   ${table}: 表不存在或无权限`);
      }
    }
    
    console.log('\n✅ 检查完成！');
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await sql.end();
  }
}

checkDatabaseStatus();
