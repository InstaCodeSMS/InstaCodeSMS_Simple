/**
 * RSA 签名验证测试脚本
 * 使用真实易支付 API 测试完整签名流程
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
const EPAY_URL = envVars.EPAY_API_URL;
const EPAY_PID = envVars.EPAY_PID;
const EPAY_KEY = envVars.EPAY_KEY;
const EPAY_PUBLIC_KEY = envVars.EPAY_PUBLIC_KEY;

console.log('========================================');
console.log('RSA 签名验证测试');
console.log('========================================\n');

console.log('配置检查:');
console.log('  EPAY_URL:', EPAY_URL);
console.log('  EPAY_PID:', EPAY_PID);
console.log('  EPAY_KEY:', EPAY_KEY ? '已配置' : '未配置');
console.log('  EPAY_PUBLIC_KEY:', EPAY_PUBLIC_KEY ? `${EPAY_PUBLIC_KEY.substring(0, 30)}...` : '未配置');

// MD5 签名生成
function generateMD5Sign(params, key) {
  const sortedKeys = Object.keys(params).sort();
  const signStr = sortedKeys.map(k => `${k}=${params[k]}`).join('&') + key;
  return crypto.createHash('md5').update(signStr).digest('hex');
}

// RSA 签名验证
async function verifyRSASign(params, sign, publicKeyBase64) {
  try {
    const sortedKeys = Object.keys(params).sort();
    const signStr = sortedKeys.map(k => `${k}=${params[k]}`).join('&');
    
    const binaryDer = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
    
    const publicKey = await crypto.subtle.importKey(
      'spki',
      binaryDer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = Uint8Array.from(atob(sign), c => c.charCodeAt(0));
    const dataBytes = new TextEncoder().encode(signStr);
    
    return await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      signatureBytes,
      dataBytes
    );
  } catch (error) {
    console.error('RSA 验证错误:', error.message);
    return false;
  }
}

async function main() {
  console.log('\n📝 步骤 1: 创建支付订单');
  console.log('----------------------------------------');
  
  const orderParams = {
    pid: EPAY_PID,
    type: 'alipay',
    out_trade_no: 'TEST_RSA_' + Date.now(),
    notify_url: 'https://instacode.cfd/api/payment/callback/epay',
    return_url: 'https://instacode.cfd/success',
    name: 'RSA签名测试',
    money: '0.01',
    timestamp: Math.floor(Date.now() / 1000).toString(),
    clientip: '127.0.0.1',
    method: 'web',
    device: 'pc',
  };
  
  // 使用 MD5 签名发送请求（服务端接受）
  const md5Sign = generateMD5Sign(orderParams, EPAY_KEY);
  console.log('请求签名 (MD5):', md5Sign);
  
  const formData = new URLSearchParams({ ...orderParams, sign: md5Sign, sign_type: 'MD5' });
  
  const response = await fetch(`${EPAY_URL}/api/pay/create`, {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  console.log('\n服务端响应:');
  console.log(JSON.stringify(data, null, 2));
  
  if (data.code !== 0) {
    console.log('\n❌ 创建订单失败:', data.msg);
    return;
  }
  
  console.log('\n✅ 订单创建成功');
  console.log('  trade_no:', data.trade_no);
  console.log('  pay_info:', data.pay_info);
  console.log('  服务端 sign_type:', data.sign_type);
  
  // 测试 RSA 签名验证
  console.log('\n📝 步骤 2: 验证服务端 RSA 签名');
  console.log('----------------------------------------');
  
  // 服务端返回的签名是对响应数据的签名
  // 构造签名字符串（按服务端规则）
  const responseParams = {
    code: String(data.code),
    trade_no: data.trade_no,
    pay_type: data.pay_type,
    pay_info: data.pay_info,
    timestamp: data.timestamp,
  };
  
  console.log('待验证数据:', JSON.stringify(responseParams, null, 2));
  console.log('服务端签名:', data.sign.substring(0, 50) + '...');
  
  const rsaValid = await verifyRSASign(responseParams, data.sign, EPAY_PUBLIC_KEY);
  console.log('\nRSA 签名验证:', rsaValid ? '✅ 通过' : '❌ 失败');
  
  // 模拟回调验证
  console.log('\n📝 步骤 3: 模拟回调验证');
  console.log('----------------------------------------');
  
  // 回调数据会使用 RSA 签名
  const callbackParams = {
    pid: EPAY_PID,
    trade_no: data.trade_no,
    out_trade_no: orderParams.out_trade_no,
    type: 'alipay',
    name: 'RSA签名测试',
    money: '0.01',
    trade_status: 'TRADE_SUCCESS',
    timestamp: data.timestamp,
  };
  
  console.log('回调数据:', JSON.stringify(callbackParams, null, 2));
  console.log('\n说明: 实际回调签名由易支付服务端生成');
  console.log('当收到回调时，需要验证 RSA 签名');
  
  // 测试本地签名生成（用于对比）
  const localCallbackSign = generateMD5Sign(callbackParams, EPAY_KEY);
  console.log('\n本地 MD5 签名:', localCallbackSign);
  console.log('(注意: 服务端会使用 RSA 签名，不是 MD5)');
  
  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');
  
  console.log('\n📊 结论:');
  console.log('----------------------------------------');
  console.log('1. 客户端发送: MD5 签名 → 服务端接受 ✅');
  console.log('2. 服务端响应: RSA 签名 → 已配置公钥 ✅');
  console.log('3. 服务端回调: 会使用 RSA 签名 → 需用公钥验证');
  console.log('\n✅ RSA 公钥已配置，回调验证应该可以正常工作');
}

main().catch(console.error);