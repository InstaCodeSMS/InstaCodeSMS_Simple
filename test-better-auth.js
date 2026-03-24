// 测试 Better Auth 注册和登录
async function testBetterAuth() {
  const BASE_URL = 'http://127.0.0.1:3000';
  
  // 测试注册
  console.log('=== 测试注册 ===');
  try {
    const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'test123456',
        name: 'Test User'
      })
    });
    const registerData = await registerRes.json();
    console.log('注册响应:', JSON.stringify(registerData, null, 2));
  } catch (error) {
    console.error('注册错误:', error.message);
  }
  
  // 测试登录
  console.log('\n=== 测试登录 ===');
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'test123456'
      })
    });
    const loginData = await loginRes.json();
    console.log('登录响应:', JSON.stringify(loginData, null, 2));
  } catch (error) {
    console.error('登录错误:', error.message);
  }
}

testBetterAuth();