/**
 * 易支付签名验证测试脚本
 * 测试 MD5 签名生成和验证流程
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 读取配置
function loadEnvVars() {
  const envPath = path.join(__dirname, '..', '.dev.vars');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split(/\r?\n/);
    const vars = {};
    lines.forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        vars[key] = value;
      }
    });
    return vars;
  }
  return {};
}

const envVars = loadEnvVars();
const EPAY_KEY = envVars.EPAY_KEY;
const EPAY_PID = envVars.EPAY_PID;

console.log('========================================');
console.log('易支付签名验证测试');
console.log('========================================\n');

// MD5 签名生成函数（与服务端一致）
function generateMD5Sign(params, key) {
  const sortedKeys = Object.keys(params).sort();
  const signStr = sortedKeys
    .map(k => `${k}=${params[k]}`)
    .join('&') + key;
  return crypto.createHash('md5').update(signStr).digest('hex');
}

// MD5 签名验证函数（模拟客户端）
function verifyMD5Sign(params, sign, key) {
  const expectedSign = generateMD5Sign(params, key);
  return expectedSign === sign;
}

// 测试 1: 签名生成一致性
console.log('📝 测试 1: MD5 签名生成一致性');
console.log('----------------------------------------');

const testParams = {
  pid: EPAY_PID,
  trade_no: 'TEST_ORDER_123',
  out_trade_no: 'ORD_123',
  type: 'alipay',
  name: '测试商品',
  money: '0.01',
  trade_status: 'TRADE_SUCCESS',
  timestamp: '1234567890',
};

console.log('参数:', JSON.stringify(testParams, null, 2));
console.log('密钥:', EPAY_KEY);

const sign1 = generateMD5Sign(testParams, EPAY_KEY);
const sign2 = generateMD5Sign(testParams, EPAY_KEY);

console.log('\n第一次签名:', sign1);
console.log('第二次签名:', sign2);
console.log('一致性:', sign1 === sign2 ? '✅ 通过' : '❌ 失败');

// 测试 2: 签名验证
console.log('\n📝 测试 2: MD5 签名验证');
console.log('----------------------------------------');

const verifyResult = verifyMD5Sign(testParams, sign1, EPAY_KEY);
console.log('验证结果:', verifyResult ? '✅ 通过' : '❌ 失败');

// 测试 3: 篡改检测
console.log('\n📝 测试 3: 篡改检测');
console.log('----------------------------------------');

const tamperedParams = { ...testParams, money: '100.00' };
const tamperedVerify = verifyMD5Sign(tamperedParams, sign1, EPAY_KEY);
console.log('篡改金额后验证:', tamperedVerify ? '❌ 异常（应该失败）' : '✅ 通过（正确拒绝）');

// 测试 4: 与服务端返回签名对比
console.log('\n📝 测试 4: 真实 API 签名验证');
console.log('----------------------------------------');

async function testRealAPI() {
  try {
    const EPAY_URL = envVars.EPAY_API_URL;
    
    // 创建订单
    const orderParams = {
      pid: EPAY_PID,
      type: 'alipay',
      out_trade_no: 'TEST_' + Date.now(),
      notify_url: 'https://example.com/notify',
      return_url: 'https://example.com/return',
      name: '测试商品',
      money: '0.01',
      timestamp: Math.floor(Date.now() / 1000).toString(),
      clientip: '127.0.0.1',
      method: 'web',
      device: 'pc',
    };
    
    // 生成签名
    const sign = generateMD5Sign(orderParams, EPAY_KEY);
    console.log('请求签名:', sign);
    
    // 发送请求
    const formData = new URLSearchParams({ ...orderParams, sign, sign_type: 'MD5' });
    const response = await fetch(`${EPAY_URL}/api/pay/create`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    console.log('\n服务端响应:', JSON.stringify(data, null, 2));
    
    if (data.code === 0) {
      console.log('\n✅ 服务端接受 MD5 签名');
      console.log('trade_no:', data.trade_no);
      console.log('服务端 sign_type:', data.sign_type);
      
      // 模拟回调验证
      console.log('\n--- 模拟回调验证 ---');
      const callbackParams = {
        pid: EPAY_PID,
        trade_no: data.trade_no,
        out_trade_no: orderParams.out_trade_no,
        type: 'alipay',
        name: '测试商品',
        money: '0.01',
        trade_status: 'TRADE_SUCCESS',
        timestamp: data.timestamp,
      };
      
      // 注意：实际回调签名由易支付服务端生成
      // 这里只能测试我们的验证逻辑是否正确
      const callbackSign = generateMD5Sign(callbackParams, EPAY_KEY);
      console.log('模拟回调签名:', callbackSign);
      
      const callbackVerify = verifyMD5Sign(callbackParams, callbackSign, EPAY_KEY);
      console.log('回调签名验证:', callbackVerify ? '✅ 通过' : '❌ 失败');
    } else {
      console.log('\n❌ 服务端拒绝:', data.msg);
    }
  } catch (error) {
    console.error('请求失败:', error.message);
  }
}

testRealAPI().then(() => {
  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');
});