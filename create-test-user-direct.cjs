// 直接在数据库中创建测试用户
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// 从 .dev.vars 读取配置
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

async function createTestUser() {
  console.log('创建测试用户...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  const email = 'test@example.com';
  const password = '123456';
  const passwordHash = await bcrypt.hash(password, 10);
  
  console.log('密码哈希:', passwordHash);
  
  // 删除已存在的用户
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('email', email);
  
  if (deleteError) {
    console.log('删除用户错误（可能不存在）:', deleteError.message);
  }
  
  // 创建新用户
  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      password_hash: passwordHash,
      role: 'user',
      tenant_id: 'default'
    })
    .select()
    .single();
  
  if (error) {
    console.error('创建用户错误:', error);
    return;
  }
  
  console.log('创建用户成功:', data);
  
  // 验证用户可以查询到
  const { data: verifyData, error: verifyError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (verifyError) {
    console.error('验证查询错误:', verifyError);
  } else {
    console.log('验证查询成功，用户:', verifyData);
  }
}

createTestUser().catch(console.error);