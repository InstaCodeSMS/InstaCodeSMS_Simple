/**
 * 测试数据库连接
 */
const { Client } = require('pg');

async function testConnection() {
  // 使用 Supabase Pooler 连接（事务模式）
  const connectionString = 'postgresql://postgres.nyiozcmzdehybowlnyvh:Qwer235678jkl@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';
  
  console.log('🔗 测试数据库连接（Pooler 模式）...\n');
  console.log('连接字符串:', connectionString.replace(/:[^:@]+@/, ':****@'));
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('\n⏳ 正在连接...');
    await client.connect();
    console.log('✅ 连接成功！\n');
    
    // 测试查询
    console.log('📊 测试查询...');
    const result = await client.query('SELECT NOW() as current_time, version()');
    console.log('当前时间:', result.rows[0].current_time);
    console.log('数据库版本:', result.rows[0].version.split(' ')[0], result.rows[0].version.split(' ')[1]);
    
    // 检查 users 表
    console.log('\n📋 检查 users 表结构...');
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    console.log('users 表字段:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\n✅ 数据库连接测试完成！');
    
  } catch (error) {
    console.error('\n❌ 连接失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    await client.end();
  }
}

testConnection();
