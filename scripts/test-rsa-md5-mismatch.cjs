// 测试：易支付回调发送 RSA 签名，但我们使用 MD5 验证
// 验证是否可行

const crypto = require('crypto')

// 配置
const EPAY_KEY = '4r3sSEFKTERqGvERfEqSQK9erQKqzAst'

// 模拟易支付回调数据（来自之前日志的真实数据）
const callbackData = {
  pid: '1000',
  trade_no: '2026030423134769274',
  out_trade_no: 'ORD_1741101227172_8A7X',
  type: 'alipay',
  name: '测试商品',
  money: '0.5',
  trade_status: 'TRADE_SUCCESS',
  buyer: '',
  timestamp: '1741101227',
  // 这是易支付返回的 RSA 签名
  sign: 'Oj6zWYdXKEZVWUFL6D7s4SW0/+A9uieGqmPMPdQfTQi+FwLxLNDLaQMYNW6e+YfiPUufthvG2Er0e2YSC0L4cJD9pSMK0VON1ahL2uVGBm0xDpBJW+3qZ5gNPkOqP5wqLQCJJPGhL2oHLH7aFgqnw2hBqNmJBPdlD5jS6mVnAdWz+4/HRV6V99WjVBYC7QRMKRHWnGVGUD1RC5FF8kNf0F0RDzSqVfFZ2R6G9L6ELZJQG3yh4PPvx/j5OvcZvL2rAGmTCXaJFL2E0YjPZg+BtgvmCEmfCS9fnFecvBui8JMmaK3QYhB4zVq0iGoxQZPvEg7NdxDQJcZS8yYUMNBPghw==',
  sign_type: 'RSA'
}

console.log('=== 测试：RSA 签名回调用 MD5 验证 ===')
console.log('')

// 提取参数（排除 sign 和 sign_type）
const params = {}
for (const key in callbackData) {
  if (key !== 'sign' && key !== 'sign_type' && callbackData[key]) {
    params[key] = callbackData[key]
  }
}

console.log('1. 回调数据:')
console.log('   sign_type:', callbackData.sign_type)
console.log('   sign:', callbackData.sign.substring(0, 50) + '...')
console.log('')

// 使用 MD5 方式计算期望签名
console.log('2. 使用 MD5 计算期望签名:')
const sortedKeys = Object.keys(params).sort()
let signStr = ''
sortedKeys.forEach(key => {
  if (params[key]) {
    if (signStr) signStr += '&'
    signStr += `${key}=${params[key]}`
  }
})
signStr += EPAY_KEY
console.log('   签名字符串:', signStr)

const expectedMD5Sign = crypto.createHash('md5').update(signStr).digest('hex')
console.log('   MD5 期望签名:', expectedMD5Sign)
console.log('')

// 比较
console.log('3. 比较签名:')
console.log('   RSA 签名 (回调):', callbackData.sign.substring(0, 50) + '...')
console.log('   MD5 签名 (期望):', expectedMD5Sign)
console.log('')

const match = expectedMD5Sign === callbackData.sign
console.log('4. 结果:')
console.log('   签名匹配:', match)
console.log('')

if (!match) {
  console.log('❌ 结论: MD5 验证无法通过 RSA 签名！')
  console.log('   原因: RSA 签名是 Base64 编码的加密数据，不是 MD5 哈希值')
  console.log('   解决方案: 必须使用 RSA 公钥验证 RSA 签名')
} else {
  console.log('✅ 结论: 意外匹配！但这是不可能的...')
}