const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 读取 .dev.vars 文件
function loadEnvVars() {
  const envPath = path.join(__dirname, '..', '.dev.vars');
  console.log('尝试读取配置文件:', envPath);
  
  if (fs.existsSync(envPath)) {
    console.log('✅ 配置文件存在');
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split(/\r?\n/);
    const vars = {};
    lines.forEach((line, index) => {
      line = line.trim();
      // 跳过空行和注释
      if (!line || line.startsWith('#')) return;
      
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // 移除可能的引号
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        vars[key] = value;
        console.log(`  ${key} = ${value}`);
      }
    });
    console.log('读取到的配置:', Object.keys(vars));
    return vars;
  }
  console.log('❌ 配置文件不存在');
  return {};
}

const envVars = loadEnvVars();
const EPAY_URL = envVars.EPAY_API_URL || process.env.EPAY_API_URL || 'https://your-epay-url.com';
const EPAY_PID = envVars.EPAY_PID || process.env.EPAY_PID || 'your-pid';
const EPAY_KEY = envVars.EPAY_KEY || process.env.EPAY_KEY || 'your-key';

// 生成签名
function generateSign(params, key) {
  const sortedKeys = Object.keys(params).sort();
  const signStr = sortedKeys
    .map(k => `${k}=${params[k]}`)
    .join('&') + key;
  return crypto.createHash('md5').update(signStr).digest('hex');
}

// 测试函数
async function testEpayConfig(configName, params) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`测试配置: ${configName}`);
  console.log(`${'='.repeat(50)}`);
  
  // 添加签名
  const sign = generateSign(params, EPAY_KEY);
  const fullParams = { ...params, sign };
  
  console.log('\n请求参数:');
  console.log(JSON.stringify(fullParams, null, 2));
  
  try {
    const url = `${EPAY_URL}/api/pay/create`;
    
    console.log('\n请求URL:');
    console.log(url);
    
    // 使用 URLSearchParams 构建表单数据
    const formData = new URLSearchParams(fullParams);
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      }
    });
    const contentType = response.headers.get('content-type');
    console.log('\nContent-Type:', contentType);
    
    const text = await response.text();
    
    // 尝试解析为JSON
    try {
      const data = JSON.parse(text);
      console.log('\n返回数据 (JSON):');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.pay_type) {
        console.log(`\n✅ pay_type: ${data.pay_type}`);
      }
      return data;
    } catch (e) {
      console.log('\n返回数据 (HTML/Text):');
      console.log(text.substring(0, 500) + '...');
      return null;
    }
  } catch (error) {
    console.error('\n❌ 请求失败:', error.message);
    return null;
  }
}

// 主函数
async function main() {
  console.log('易支付配置测试');
  console.log(`EPAY_URL: ${EPAY_URL}`);
  console.log(`EPAY_PID: ${EPAY_PID}`);
  
  const baseParams = {
    pid: EPAY_PID,
    type: 'alipay',
    out_trade_no: 'TEST_' + Date.now(),
    notify_url: 'https://example.com/notify',
    return_url: 'https://example.com/return',
    name: '测试商品',
    money: '0.01',
    timestamp: Math.floor(Date.now() / 1000).toString(),
    clientip: '127.0.0.1',
  };
  
  // 配置A: method=web + device=pc
  await testEpayConfig('配置A (method=web + device=pc)', {
    ...baseParams,
    method: 'web',
    device: 'pc',
  });
  
  // 配置B: method=web + device=mobile
  await testEpayConfig('配置B (method=web + device=mobile)', {
    ...baseParams,
    method: 'web',
    device: 'mobile',
  });
  
  // 配置C: method=web (不传device)
  await testEpayConfig('配置C (method=web, 不传device)', {
    ...baseParams,
    method: 'web',
  });
  
  console.log('\n' + '='.repeat(50));
  console.log('测试完成');
  console.log('='.repeat(50));
}

main().catch(console.error);
