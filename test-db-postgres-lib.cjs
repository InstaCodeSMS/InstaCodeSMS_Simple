/**
 * 使用 postgres 库测试数据库连接（与应用相同）
 */
const postgres = require('postgres');

async function testConnection() {
  const connectionString = 'postgresql://postgres:Qwer235678jkl@db.nyiozcmzdehybowlnyvh.supabase.co:5432/postgres';
  
  console.log('🔗 使用 postgres 库测试连接...\n');
  console.log('连接字符串:', connectionString.replace(/:[^:@]+@/, ':****@'));
  
  const sql = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: 'require',
  });

  try {
    console.log('\n⏳ 正在连接并查询...');
    const result = await sql`SELECT NOW() as current_time, version()`;
    console.log('✅ 连接成功！\n');
    console.log('当前时间:', result[0].current_time);
    console.log('数据库版本:', result[0].version.substring(0, 50) + '...');
    
    // 检查 users 表
    console.log('\n📋 检查 users 表结构...');
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `;
    console.log('users 表字段:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\n✅ 数据库连接测试完成！');
    
  } catch (error) {
    console.error('\n❌ 连接失败:', error.message);
    console.error('错误代码:', error.code);
  } finally {
    await sql.end();
  }
}

testConnection();
