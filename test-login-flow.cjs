/**
 * 测试登录流程 - 验证 cookie Path 修复
 * 模拟真实用户操作：注册 -> 登录 -> 访问 dashboard
 */

const FETCH_OPTIONS = {
  localhost: {
    baseUrl: 'http://localhost:3000',
    headers: { 'Origin': 'http://localhost:3000' }
  },
  production: {
    baseUrl: 'https://instacode.cfd',
    headers: { 'Origin': 'https://instacode.cfd' }
  }
};

// 选择测试环境
const ENV = process.argv[2] === 'prod' ? 'production' : 'localhost';
const { baseUrl, headers: baseHeaders } = FETCH_OPTIONS[ENV];

console.log(`\n🧪 测试环境: ${ENV.toUpperCase()} (${baseUrl})\n`);

// 生成随机测试用户
const testEmail = `test${Date.now()}@test.com`;
const testPassword = 'Test123456!';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testLoginFlow() {
  let cookies = [];
  
  // ========== 步骤 1: 注册 ==========
  console.log('📝 步骤 1: 注册新用户...');
  console.log(`   Email: ${testEmail}`);
  
  try {
    const registerRes = await fetch(`${baseUrl}/api/better-auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...baseHeaders
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: testEmail.split('@')[0]
      })
    });
    
    const registerData = await registerRes.json();
    
    if (registerRes.ok) {
      console.log('   ✅ 注册成功!');
      console.log(`   User ID: ${registerData.user?.id}`);
      
      // 保存 cookies
      if (registerData.cookies) {
        cookies = registerData.cookies;
        console.log(`   🍪 收到 ${cookies.length} 个 cookies`);
        
        // 检查 cookies 是否有 Path 属性
        cookies.forEach((cookie, i) => {
          const hasPath = cookie.toLowerCase().includes('path=');
          console.log(`   Cookie ${i+1}: ${hasPath ? '✅ 有 Path' : '❌ 缺少 Path'}`);
          console.log(`      ${cookie.substring(0, 80)}...`);
        });
      }
    } else {
      console.log('   ❌ 注册失败:', registerData.message || registerData.error?.message);
      return;
    }
  } catch (e) {
    console.log('   ❌ 注册请求失败:', e.message);
    return;
  }
  
  await delay(500);
  
  // ========== 步骤 2: 访问 Dashboard (使用 cookies) ==========
  console.log('\n📊 步骤 2: 访问 Dashboard...');
  
  // 从 cookies 提取 cookie 值用于请求
  const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
  
  try {
    const dashboardRes = await fetch(`${baseUrl}/zh/dashboard`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        ...baseHeaders
      },
      redirect: 'manual' // 不自动跟随重定向
    });
    
    console.log(`   状态码: ${dashboardRes.status}`);
    
    if (dashboardRes.status === 200) {
      const html = await dashboardRes.text();
      // 检查是否是真正的 dashboard 页面
      const hasDashboardContent = html.includes('Dashboard') || html.includes('dashboard-content') || html.includes('user-dropdown');
      const hasLoginForm = html.includes('type="email"') && html.includes('type="password"') && html.includes('submitLogin');
      
      if (hasLoginForm && !hasDashboardContent) {
        console.log('   ❌ 返回的是登录页面 (session 无效)');
      } else if (hasDashboardContent) {
        console.log('   ✅ 成功访问 Dashboard 页面');
      } else {
        console.log('   ⚠️ 无法确定页面类型');
      }
    } else if (dashboardRes.status === 302 || dashboardRes.status === 301) {
      const location = dashboardRes.headers.get('location');
      console.log(`   ❌ 被重定向到: ${location}`);
    } else {
      const text = await dashboardRes.text();
      console.log(`   ⚠️ 意外的状态码，响应: ${text.substring(0, 200)}`);
    }
  } catch (e) {
    console.log('   ❌ Dashboard 请求失败:', e.message);
  }
  
  await delay(500);
  
  // ========== 步骤 3: 登出后重新登录 ==========
  console.log('\n🔐 步骤 3: 重新登录测试...');
  
  try {
    const loginRes = await fetch(`${baseUrl}/api/better-auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...baseHeaders
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    
    const loginData = await loginRes.json();
    
    if (loginRes.ok) {
      console.log('   ✅ 登录成功!');
      
      if (loginData.cookies) {
        cookies = loginData.cookies;
        console.log(`   🍪 收到 ${cookies.length} 个 cookies`);
        
        // 检查 cookies 是否有 Path 属性
        cookies.forEach((cookie, i) => {
          const hasPath = cookie.toLowerCase().includes('path=');
          console.log(`   Cookie ${i+1}: ${hasPath ? '✅ 有 Path' : '❌ 缺少 Path'}`);
        });
      }
    } else {
      console.log('   ❌ 登录失败:', loginData.message || loginData.error?.message);
    }
  } catch (e) {
    console.log('   ❌ 登录请求失败:', e.message);
  }
  
  await delay(500);
  
  // ========== 步骤 4: 再次访问 Dashboard ==========
  console.log('\n📊 步骤 4: 再次访问 Dashboard...');
  
  const cookieHeader2 = cookies.map(c => c.split(';')[0]).join('; ');
  
  try {
    const dashboardRes2 = await fetch(`${baseUrl}/zh/dashboard`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader2,
        ...baseHeaders
      },
      redirect: 'manual'
    });
    
    console.log(`   状态码: ${dashboardRes2.status}`);
    
    if (dashboardRes2.status === 200) {
      const html = await dashboardRes2.text();
      const isDashboard = html.includes('dashboard') || html.includes('Dashboard') || html.includes('仪表板');
      console.log(`   ${isDashboard ? '✅ 成功访问 Dashboard' : '⚠️ 响应可能不是 Dashboard 页面'}`);
    } else if (dashboardRes2.status === 302 || dashboardRes2.status === 301) {
      const location = dashboardRes2.headers.get('location');
      console.log(`   ❌ 被重定向到: ${location}`);
    }
  } catch (e) {
    console.log('   ❌ Dashboard 请求失败:', e.message);
  }
  
  console.log('\n✅ 测试完成!\n');
}

testLoginFlow();