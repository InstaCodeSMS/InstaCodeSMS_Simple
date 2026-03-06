/**
 * 使用真实回调数据测试 RSA 签名验证
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
const EPAY_PUBLIC_KEY = envVars.EPAY_PUBLIC_KEY;

console.log('========================================');
console.log('真实回调签名验证测试');
console.log('========================================\n');

// 真实回调数据（从日志中提取）
const realCallback = {
  pid: '1000',
  trade_no: '2026030608565080135',
  out_trade_no: 'ORD1772758610073R47FPI',
  type: 'alipay',
  name: 'product',
  money: '0.5',
  trade_status: 'TRADE_SUCCESS',
  api_trade_no: '20260306200040011100680068487310',
  buyer: '**杰(199******16)',
  timestamp: '1772758699',
  sign_type: 'RSA',
  sign: 'qAUJcd+ENs0yIqZE1LWiaDYhTY+dLlI9MFR6Q/cCvCUG+yfReB5TZ0f0PTJuomxUPhWypSt95CvBQKUrnOKqQmuI+DP6iNSbDrIJxOdX1dLcfq+e0vS/ZNuw9OEyVMloZn1lr9dpCUbs77RYGuAvHjTVDvgGGRxBcAgE3U4n3rw+C5RIGLbLkOOTm7NXwf4kzHwuG+vZbIOmaZ9zVYSZOcJ4zIE1ncPajPoWvERegl3hhZWNnGm+jiktgCZI1v15Dih/N+SsxbyJZISvHdxmcnpyGIVhwB0N53F/Riw2/WBdQGf3NshodUkf+mfiHmiiLYDiMOFINsieSD0HMDs8kA=='
};

console.log('回调数据:');
console.log(JSON.stringify(realCallback, null, 2));

// 构造签名参数（排除 sign 和 sign_type）
const params = {};
for (const key in realCallback) {
  if (key !== 'sign' && key !== 'sign_type' && realCallback[key]) {
    params[key] = realCallback[key];
  }
}

console.log('\n参与签名的参数:');
console.log(JSON.stringify(params, null, 2));

// 排序并拼接
const sortedKeys = Object.keys(params).sort();
const signStr = sortedKeys.map(key => `${key}=${params[key]}`).join('&');

console.log('\n签名字符串:');
console.log(signStr);

console.log('\n签名字符串长度:', signStr.length);

// RSA 验证
async function verifyRSASign(signStr, sign, publicKeyBase64) {
  try {
    console.log('\n公钥长度:', publicKeyBase64.length);
    
    const binaryDer = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
    console.log('二进制长度:', binaryDer.length);
    
    const publicKey = await crypto.subtle.importKey(
      'spki',
      binaryDer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = Uint8Array.from(atob(sign), c => c.charCodeAt(0));
    console.log('签名二进制长度:', signatureBytes.length);
    
    const dataBytes = new TextEncoder().encode(signStr);
    console.log('数据字节长度:', dataBytes.length);
    
    const result = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      signatureBytes,
      dataBytes
    );
    
    return result;
  } catch (error) {
    console.error('RSA 验证错误:', error.message);
    console.error(error.stack);
    return false;
  }
}

async function main() {
  console.log('\n========================================');
  console.log('开始 RSA 验证');
  console.log('========================================');
  
  const isValid = await verifyRSASign(signStr, realCallback.sign, EPAY_PUBLIC_KEY);
  
  console.log('\n验证结果:', isValid ? '✅ 通过' : '❌ 失败');
  
  // 测试不同的参数组合
  console.log('\n========================================');
  console.log('测试不同参数组合');
  console.log('========================================');
  
  // 测试1: 不包含 api_trade_no 和 buyer
  const paramsWithoutExtra = { ...params };
  delete paramsWithoutExtra.api_trade_no;
  delete paramsWithoutExtra.buyer;
  
  const signStr1 = Object.keys(paramsWithoutExtra).sort()
    .map(key => `${key}=${paramsWithoutExtra[key]}`).join('&');
  
  console.log('\n测试1: 排除 api_trade_no 和 buyer');
  console.log('签名字符串:', signStr1);
  
  const isValid1 = await verifyRSASign(signStr1, realCallback.sign, EPAY_PUBLIC_KEY);
  console.log('结果:', isValid1 ? '✅ 通过' : '❌ 失败');
  
  // 测试2: URL 解码 buyer
  const paramsDecoded = { ...params };
  // buyer 可能需要 URL 解码
  
  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');
}

main().catch(console.error);