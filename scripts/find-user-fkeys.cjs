const postgres = require('postgres');

async function findForeignKeys() {
  const sql = postgres('postgresql://postgres:Qwer235678jkl@db.nyiozcmzdehybowlnyvh.supabase.co:5432/postgres', {
    ssl: 'require',
  });

  console.log('🔍 查找所有引用 users.id 的外键约束...\n');
  
  try {
    const result = await sql`
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
    
    console.log('找到的外键约束：\n');
    result.forEach(row => {
      console.log(`表: ${row.table_name}`);
      console.log(`列: ${row.column_name}`);
      console.log(`约束名: ${row.constraint_name}\n`);
    });
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await sql.end();
  }
}

findForeignKeys();
