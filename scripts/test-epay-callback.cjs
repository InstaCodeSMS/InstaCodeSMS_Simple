// 测试易支付 MD5 签名回调
// 模仿 dujiaoka 和 acg-faka 的签名算法

const crypto = require('crypto')

// 配置（从 .dev.vars 获取）
const EPAY_KEY = '4r3sSEFKTERqGvERfEqSQK9erQKqzAst'
const CALLBACK_URL = 'https://instacode.cfd/api/payment/callback/epay/'

// 模拟回调数据
const params = {
  pid: '1000',
  trade_no: 'TEST' + Date.now(),
  out_trade_no: 'ORD_TEST_' + Date.now(),
  type: 'alipay',
  name: 'test',
  money: '0.5',
  trade_status: 'TRADE_SUCCESS',
  buyer: 'test_user',
  timestamp: Math.floor(Date.now() / 1000).toString(),
}

console.log('=== 易支付 MD5 签名测试 ===')
console.log('')

// 按照 dujiaoka 的算法计算签名
console.log('1. 参数排序并拼接:')
const sortedKeys = Object.keys(params).sort()
let signStr = ''
sortedKeys.forEach(key => {
  if (params[key]) {
    if (signStr) signStr += '&'
    signStr += `${key}=${params[key]}`
  }
})
console.log('   拼接结果:', signStr)

console.log('')
console.log('2. 追加密钥:')
signStr += EPAY_KEY
console.log('   追加后:', signStr)

console.log('')
console.log('3. MD5 计算:')
const sign = crypto.createHash('md5').update(signStr).digest('hex')
console.log('   签名结果:', sign)

// 构建完整的回调 URL
const url = new URL(CALLBACK_URL)
Object.entries({ ...params, sign, sign_type: 'MD5' }).forEach(([k, v]) => {
  url.searchParams.set(k, v)
})

console.log('')
console.log('=== 测试回调 URL ===')
console.log(url.toString())

console.log('')
console.log('=== 使用 curl 测试 ===')
console.log(`curl "${url.toString()}"`)

console.log('')
console.log('=== 发送测试请求 ===')
fetch(url.toString())
  .then(res => res.text())
  .then(data => {
    console.log('响应:', data)
  })
  .catch(err => {
    console.error('错误:', err.message)
  })