require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少环境变量: SUPABASE_URL 或 SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditDatabase() {
  console.log('📊 SimpleFaka 数据库审计报告');
  console.log('='.repeat(60));
  console.log('');

  try {
    // 获取所有表的列表
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('❌ 获取表列表失败:', tablesError.message);
      
      // 备用方案：直接查询已知的业务表
      console.log('\n使用备用方案查询已知表...\n');
      await auditKnownTables();
      return;
    }

    console.log(`📋 发现 ${tables.length} 个表\n`);

    // 审计每个表
    for (const table of tables) {
      await auditTable(table.table_name);
    }

  } catch (error) {
    console.error('❌ 审计失败:', error.message);
    console.log('\n使用备用方案...\n');
    await auditKnownTables();
  }
}

async function auditKnownTables() {
  const knownTables = [
    'users',
    'sessions', 
    'accounts',
    'verifications',
    'products',
    'orders',
    'wallets',
    'wallet_transactions'
  ];

  for (const tableName of knownTables) {
    await auditTable(tableName);
  }
}

async function auditTable(tableName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 表: ${tableName}`);
  console.log('='.repeat(60));

  try {
    // 获取记录数
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log(`⚠️  无法访问表 ${tableName}: ${countError.message}`);
      return;
    }

    console.log(`📊 记录数: ${count || 0}`);

    // 获取前3条数据样本
    const { data: samples, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(3);

    if (sampleError) {
      console.log(`⚠️  无法获取样本数据: ${sampleError.message}`);
      return;
    }

    if (!samples || samples.length === 0) {
      console.log('📝 表为空');
      return;
    }

    // 分析字段
    console.log('\n📋 字段分析:');
    const firstRecord = samples[0];
    const fields = Object.keys(firstRecord);

    for (const field of fields) {
      const hasData = samples.some(record => 
        record[field] !== null && 
        record[field] !== undefined && 
        record[field] !== ''
      );

      const value = firstRecord[field];
      const type = typeof value;
      const status = hasData ? '✅' : '⚠️ ';
      
      console.log(`  ${status} ${field} (${type})`);
      
      if (hasData && samples.length > 0) {
        const sampleValue = String(value).substring(0, 50);
        console.log(`      示例: ${sampleValue}${String(value).length > 50 ? '...' : ''}`);
      } else {
        console.log(`      ⚠️  所有记录都为空`);
      }
    }

    // 显示完整的第一条记录
    console.log('\n📄 第一条记录 (JSON):');
    console.log(JSON.stringify(firstRecord, null, 2));

  } catch (error) {
    console.log(`❌ 审计表 ${tableName} 失败:`, error.message);
  }
}

// 执行审计
auditDatabase().then(() => {
  console.log('\n\n✅ 审计完成！');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ 审计过程出错:', error);
  process.exit(1);
});
