const fetch = require('node-fetch');

async function testLogin() {
  console.log('🔐 测试登录功能...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test_browser@example.com',
        password: 'Test123456!',
      }),
    });

    console.log('状态码:', response.status);
    console.log('状态文本:', response.statusText);
    
    const data = await response.json();
    console.log('\n响应数据:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ 登录成功！');
      console.log('用户信息:', data.user);
      console.log('Session:', data.session ? '已创建' : '未创建');
    } else {
      console.log('\n❌ 登录失败');
      console.log('错误:', data.error || data.message);
    }
    
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

testLogin();
