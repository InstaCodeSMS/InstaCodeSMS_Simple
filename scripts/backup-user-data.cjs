const postgres = require('postgres');
const fs = require('fs');

async function backupUserData() {
  const sql = postgres('postgresql://postgres:Qwer235678jkl@db.nyiozcmzdehybowlnyvh.supabase.co:5432/postgres', {
    ssl: 'require',
  });

  console.log('💾 备份用户数据...\n');
  
  try {
    const users = await sql`SELECT * FROM users`;
    
    if (users.length > 0) {
      const backup = {
        timestamp: new Date().toISOString(),
        users: users,
      };
      
      fs.writeFileSync('user-backup.json', JSON.stringify(backup, null, 2));
      console.log(`✅ 已备份 ${users.length} 个用户到 user-backup.json`);
      console.log('\n备份内容：');
      users.forEach(u => {
        console.log(`  - ${u.email} (${u.name})`);
      });
    } else {
      console.log('ℹ️  没有用户数据需要备份');
    }
    
  } catch (error) {
    console.error('❌ 备份失败:', error.message);
  } finally {
    await sql.end();
  }
}

backupUserData();
