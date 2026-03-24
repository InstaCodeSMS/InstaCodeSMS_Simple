const fetch = require('node-fetch');

async function testFullFlow() {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Test123456!';
  
  console.log('🧪 测试完整的注册和登录流程\n');
  console.log(`测试账号: ${testEmail}\n`);
  
  // 1. 测试注册
  console.log('📝 步骤 1: 注册新用户...');
  try {
    const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Test User',
      }),
    });

    const registerData = await registerResponse.json();
    console.log(`状态码: ${registerResponse.status}`);
    
    if (registerData.success) {
      console.log('✅ 注册成功！');
      console.log(`消息: ${registerData.message}`);
      console.log(`用户 ID: ${registerData.user?.id}`);
      console.log(`邮箱: ${registerData.user?.email}\n`);
    } else {
      console.log('❌ 注册失败:', registerData.message);
      return;
    }
  } catch (error) {
    console.error('❌ 注册请求失败:', error.message);
    return;
  }

  // 2. 测试登录
  console.log('🔐 步骤 2: 登录用户...');
  try {
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const loginData = await loginResponse.json();
    console.log(`状态码: ${loginResponse.status}`);
    
    if (loginData.success) {
      console.log('✅ 登录成功！');
      console.log(`消息: ${loginData.message}`);
      console.log(`用户 ID: ${loginData.user?.id}`);
      console.log(`邮箱: ${loginData.user?.email}\n`);
      
      console.log('🎉 完整流程测试通过！');
    } else {
      console.log('❌ 登录失败:', loginData.message);
    }
  } catch (error) {
    console.error('❌ 登录请求失败:', error.message);
  }
}

testFullFlow();
