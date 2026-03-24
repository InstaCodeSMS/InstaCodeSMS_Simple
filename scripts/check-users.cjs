const postgres = require('postgres');

async function checkUsers() {
  const sql = postgres('postgresql://postgres:Qwer235678jkl@db.nyiozcmzdehybowlnyvh.supabase.co:5432/postgres', {
    ssl: 'require',
  });

  console.log('🔍 检查数据库中的用户...\n');
  
  try {
    const users = await sql`SELECT id, email, name, email_verified, created_at FROM users ORDER BY created_at DESC LIMIT 5`;
    
    console.log(`找到 ${users.length} 个用户：\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name || '(未设置)'}`);
      console.log(`   Email Verified: ${user.email_verified}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await sql.end();
  }
}

checkUsers();
