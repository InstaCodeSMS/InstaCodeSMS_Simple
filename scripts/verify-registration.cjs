const postgres = require('postgres');

async function verifyRegistration() {
  const sql = postgres('postgresql://postgres:Qwer235678jkl@db.nyiozcmzdehybowlnyvh.supabase.co:5432/postgres', {
    ssl: 'require',
  });

  console.log('🔍 验证注册结果...\n');
  
  try {
    const users = await sql`SELECT id, email, name, created_at FROM users ORDER BY created_at DESC LIMIT 1`;
    
    if (users.length > 0) {
      const user = users[0];
      console.log('✅ 用户已成功创建：');
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  ID 类型: ${typeof user.id} (${user.id.length} 字符)`);
      console.log(`  创建时间: ${user.created_at}`);
      
      // 检查 ID 格式
      if (user.id.includes('-')) {
        console.log('\n⚠️  ID 格式: UUID 格式');
      } else {
        console.log('\n✅ ID 格式: Better Auth 字符串格式 (nanoid)');
      }
    }
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  } finally {
    await sql.end();
  }
}

verifyRegistration();
