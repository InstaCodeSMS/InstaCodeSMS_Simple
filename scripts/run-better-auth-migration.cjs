/**
 * 执行 Better Auth 数据库迁移
 */
const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    connectionString: 'postgresql://postgres:Qwer235678jkl@db.nyiozcmzdehybowlnyvh.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    console.log('🔗 连接数据库...');
    await client.connect();
    console.log('✅ 数据库连接成功');

    // 分步执行迁移
    const migrations = [
      {
        name: '添加 users 表字段',
        sql: `
          ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
        `
      },
      {
        name: '迁移 password_hash 到 password',
        sql: `UPDATE users SET password = password_hash WHERE password IS NULL AND password_hash IS NOT NULL;`
      },
      {
        name: '删除旧 user_sessions 表',
        sql: `DROP TABLE IF EXISTS user_sessions;`
      },
      {
        name: '创建 sessions 表',
        sql: `
          CREATE TABLE IF NOT EXISTS sessions (
            id VARCHAR(255) PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            ip_address VARCHAR(255),
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: '创建 accounts 表',
        sql: `
          CREATE TABLE IF NOT EXISTS accounts (
            id VARCHAR(255) PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            account_id VARCHAR(255) NOT NULL,
            provider_id VARCHAR(255) NOT NULL,
            access_token TEXT,
            refresh_token TEXT,
            access_token_expires_at TIMESTAMP WITH TIME ZONE,
            refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
            scope TEXT,
            id_token TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: '创建 verifications 表',
        sql: `
          CREATE TABLE IF NOT EXISTS verifications (
            id VARCHAR(255) PRIMARY KEY,
            identifier VARCHAR(255) NOT NULL,
            value VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: '创建索引',
        sql: `
          CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
          CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
          CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
          CREATE INDEX IF NOT EXISTS idx_accounts_provider_id ON accounts(provider_id);
          CREATE INDEX IF NOT EXISTS idx_verifications_identifier ON verifications(identifier);
        `
      },
      {
        name: '添加唯一约束',
        sql: `ALTER TABLE accounts ADD CONSTRAINT IF NOT EXISTS idx_accounts_provider_account UNIQUE (provider_id, account_id);`
      }
    ];

    for (const migration of migrations) {
      console.log(`📝 ${migration.name}...`);
      try {
        await client.query(migration.sql);
        console.log(`  ✅ 成功`);
      } catch (error) {
        // 忽略"已存在"类型的错误
        if (error.code === '42P16' || error.code === '42P07' || error.code === '42701') {
          console.log(`  ⚠️ 已存在，跳过`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ 迁移完成');

    // 验证表结构
    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'sessions', 'accounts', 'verifications')
      ORDER BY table_name
    `);
    console.log('📋 当前表:', tablesResult.rows.map(r => r.table_name).join(', '));

    // 检查 users 表结构
    const columnsResult = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    console.log('👤 users 表字段:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);