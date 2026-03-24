/**
 * 执行 Better Auth 数据库迁移
 * 使用 Supabase REST API
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://nyiozcmzdehybowlnyvh.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aW96Y216ZGVoeWJvd2xueXZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzU3NTU5NiwiZXhwIjoyMDQ5MTUxNTk2fQ.UnKnUP5UW9-8SLN4xcqYUw_2icLtL55';

async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'nyiozcmzdehybowlnyvh.supabase.co',
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runMigration() {
  try {
    console.log('📝 读取迁移文件...');
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260319_better_auth_migration.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🚀 执行迁移...');
    console.log('注意：这可能需要几秒钟...\n');
    
    // 分段执行 SQL
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (!stmt) continue;
      
      console.log(`执行语句 ${i + 1}/${statements.length}...`);
      try {
        await executeSql(stmt);
        console.log('  ✅ 成功');
      } catch (error) {
        // 忽略"已存在"类型的错误
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate')) {
          console.log('  ⚠️ 已存在，跳过');
        } else {
          console.error('  ❌ 失败:', error.message);
        }
      }
    }
    
    console.log('\n✅ 迁移完成！');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  }
}

runMigration();
