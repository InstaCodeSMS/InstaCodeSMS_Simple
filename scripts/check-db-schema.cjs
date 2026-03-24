/**
 * 检查数据库表结构
 */
const { Client } = require('pg');

async function checkSchema() {
  const client = new Client({
    connectionString: 'postgresql://postgres:Qwer235678jkl@db.nyiozcmzdehybowlnyvh.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 连接数据库...');
    await client.connect();
    console.log('✅ 连接成功\n');

    // 检查 users 表结构
    const usersColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('👤 users 表字段:');
    usersColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    // 检查其他表是否存在
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('sessions', 'accounts', 'verifications')
    `);
    
    console.log('\n📋 Better Auth 需要的表:');
    const requiredTables = ['sessions', 'accounts', 'verifications'];
    requiredTables.forEach(table => {
      const exists = tables.rows.some(r => r.table_name === table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    });

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
