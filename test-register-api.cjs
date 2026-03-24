/**
 * 测试注册 API
 */

async function testRegister() {
  const testData = {
    email: 'test' + Date.now() + '@example.com',
    password: 'Test123456!',
    confirmPassword: 'Test123456!'
  };

  console.log('📝 测试数据:', testData);
  console.log('\n🚀 发送注册请求...\n');

  try {
    const response = await fetch('http://127.0.0.1:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 响应状态:', response.status, response.statusText);
    console.log('📋 响应头:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('\n📄 响应内容:');
    
    try {
      const json = JSON.parse(text);
      console.log(JSON.stringify(json, null, 2));
      
      if (response.ok) {
        console.log('\n✅ 注册成功！');
      } else {
        console.log('\n❌ 注册失败:', json.error || json.message);
      }
    } catch (e) {
      console.log(text);
    }

  } catch (error) {
    console.error('\n❌ 请求失败:', error.message);
  }
}

testRegister();
