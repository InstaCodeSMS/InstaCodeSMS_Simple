/**
 * 创建测试用户脚本
 * 
 * 运行方式: node scripts/create-test-user.cjs
 * 
 * 输出可直接在 Supabase SQL 编辑器中执行的 INSERT 语句
 */

const bcrypt = require('bcryptjs')

async function createTestUser() {
  const email = 'test@example.com'
  const password = '123456'
  const role = 'user'
  
  // 生成密码哈希
  const passwordHash = await bcrypt.hash(password, 10)
  
  // 生成 UUID (简单版本)
  const uuid = crypto.randomUUID()
  
  console.log('========================================')
  console.log('测试账号信息:')
  console.log('========================================')
  console.log(`邮箱: ${email}`)
  console.log(`密码: ${password}`)
  console.log(`角色: ${role}`)
  console.log('========================================')
  console.log('\n请在 Supabase SQL 编辑器中执行以下语句:\n')
  console.log('-- 删除已存在的测试账号（如果有）')
  console.log(`DELETE FROM users WHERE email = '${email}';`)
  console.log('\n-- 插入测试账号')
  console.log(`INSERT INTO users (id, email, password_hash, role) VALUES ('${uuid}', '${email}', '${passwordHash}', '${role}');`)
  console.log('\n========================================')
  console.log('密码哈希值:')
  console.log(passwordHash)
  console.log('========================================')
}

createTestUser().catch(console.error)