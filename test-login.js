// 测试登录和 bcrypt
import bcrypt from 'bcryptjs';

async function testLogin() {
  // 生成正确的密码哈希
  const password = '123456';
  const hash = await bcrypt.hash(password, 10);
  console.log('生成的密码哈希:', hash);
  
  // 验证生成的哈希
  const isValid = await bcrypt.compare(password, hash);
  console.log('验证生成的哈希:', isValid);
  
  // 测试 API
  try {
    const response = await fetch('http://127.0.0.1:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: '123456' })
    });
    const data = await response.json();
    console.log('API 响应:', data);
  } catch (error) {
    console.error('API 错误:', error.message);
  }
}

testLogin();