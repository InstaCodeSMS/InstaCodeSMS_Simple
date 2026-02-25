/**
 * 上游 API 测试脚本
 * 用于验证 API 返回数据结构
 */

const API_URL = 'https://api.cc';
const TOKEN = '80B345A1A1195BEC07578460902B';

async function fetchAPI(path, options = {}) {
  const url = `${API_URL}${path}`;
  const headers = {
    'Authorization': TOKEN,
    'Content-Type': 'application/json',
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  return response.json();
}

async function main() {
  console.log('=== 上游 API 测试 ===\n');

  // 1. 测试用户信息
  console.log('1. 测试用户信息 GET /api/v1/profile/info');
  const profile = await fetchAPI('/api/v1/profile/info');
  console.log(JSON.stringify(profile, null, 2));
  console.log();

  // 2. 测试项目分类
  console.log('2. 测试项目分类 GET /api/v1/app/cate');
  const categories = await fetchAPI('/api/v1/app/cate');
  console.log(JSON.stringify(categories, null, 2));
  console.log();

  // 3. 测试项目列表
  console.log('3. 测试项目列表 POST /api/v1/app/list');
  const appList = await fetchAPI('/api/v1/app/list', {
    method: 'POST',
    body: JSON.stringify({ cate_id: 2, type: 1 })
  });
  console.log('项目数量:', appList.data?.list?.length);
  console.log('第一个项目:', JSON.stringify(appList.data?.list?.[0], null, 2));
  console.log();

  // 4. 测试号码前缀
  console.log('4. 测试号码前缀 POST /api/v1/buy/prefix (app_id: 74)');
  const prefixes = await fetchAPI('/api/v1/buy/prefix', {
    method: 'POST',
    body: JSON.stringify({ app_id: 74, type: 1 })
  });
  console.log(JSON.stringify(prefixes, null, 2));
  console.log();

  // 5. 测试订单列表
  console.log('5. 测试订单列表 POST /api/v1/order/list');
  const orders = await fetchAPI('/api/v1/order/list', {
    method: 'POST',
    body: JSON.stringify({ page: 1, limit: 5 })
  });
  console.log('订单总数:', orders.data?.total);
  console.log('第一个订单:', JSON.stringify(orders.data?.list?.[0], null, 2));
  console.log();

  // 6. 测试订单详情
  if (orders.data?.list?.[0]?.ordernum) {
    const orderNum = orders.data.list[0].ordernum;
    console.log('6. 测试订单详情 POST /api/v1/order/api');
    const orderDetail = await fetchAPI('/api/v1/order/api', {
      method: 'POST',
      body: JSON.stringify({ ordernum: orderNum })
    });
    console.log(JSON.stringify(orderDetail, null, 2));
    console.log();
  }

  // 7. 测试错误场景 - 无效 Token
  console.log('7. 测试无效 Token');
  const invalidToken = await fetch('https://api.cc/api/v1/profile/info', {
    headers: { 'Authorization': 'INVALID_TOKEN' }
  }).then(r => r.json());
  console.log(JSON.stringify(invalidToken, null, 2));
  console.log();

  // 8. 测试错误场景 - 非法产品 ID
  console.log('8. 测试非法产品 ID POST /api/v1/buy/prefix (app_id: -1)');
  const invalidApp = await fetchAPI('/api/v1/buy/prefix', {
    method: 'POST',
    body: JSON.stringify({ app_id: -1 })
  });
  console.log(JSON.stringify(invalidApp, null, 2));
  console.log();

  // 9. 测试错误场景 - 创建订单余额不足
  console.log('9. 测试余额不足场景 POST /api/v1/buy/create (大数量)');
  const insufficientBalance = await fetchAPI('/api/v1/buy/create', {
    method: 'POST',
    body: JSON.stringify({ app_id: 74, num: 999999, type: 1 })
  });
  console.log(JSON.stringify(insufficientBalance, null, 2));
  console.log();

  console.log('=== 测试完成 ===');
}

main().catch(console.error);