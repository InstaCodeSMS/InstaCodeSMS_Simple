/**
 * 测试 SMS API 返回数据
 * 使用订单号：26030515220115901
 */

const ordernum = '26030515220115901';
const apiUrl = `http://127.0.0.1:3000/api/sms/${ordernum}/json`;

console.log('测试 SMS API...');
console.log('订单号:', ordernum);
console.log('API URL:', apiUrl);
console.log('---');

fetch(apiUrl)
  .then(res => {
    console.log('HTTP 状态码:', res.status);
    console.log('HTTP 状态文本:', res.statusText);
    console.log('---');
    return res.json();
  })
  .then(data => {
    console.log('返回数据:');
    console.log(JSON.stringify(data, null, 2));
    console.log('---');
    
    // 分析数据
    console.log('数据分析:');
    console.log('success:', data.success);
    console.log('message:', data.message);
    
    if (data.data) {
      console.log('data.tel:', data.data.tel);
      console.log('data.sms:', data.data.sms);
      console.log('data.sms 类型:', typeof data.data.sms);
      console.log('data.sms 长度:', data.data.sms ? data.data.sms.length : 0);
      console.log('data.sms.trim():', data.data.sms ? data.data.sms.trim() : '');
      console.log('data.sms.trim() !== "":', data.data.sms ? data.data.sms.trim() !== '' : false);
    }
    
    // 测试前端条件判断
    console.log('---');
    console.log('前端条件判断测试:');
    console.log('旧条件 (data.success && data.data && data.data.sms):', 
      data.success && data.data && data.data.sms);
    console.log('新条件 (data.success && data.data && data.data.sms && data.data.sms.trim() !== ""):', 
      data.success && data.data && data.data.sms && data.data.sms.trim() !== '');
  })
  .catch(err => {
    console.error('错误:', err.message);
  });