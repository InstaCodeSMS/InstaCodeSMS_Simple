const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function executeMigration() {
  const supabase = createClient(
    'https://nyiozcmzdehybowlnyvh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aW96Y216ZGVoeWJvd2xueXZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzU3NTU5NiwiZXhwIjoyMDQ5MTUxNTk2fQ.UnKnUP5UW9-8SLN4xcqYUw_2icLtL55'
  );

  const sql = fs.readFileSync('supabase/migrations/20260319_fix_better_auth_id_type.sql', 'utf8');
  
  console.log('🔄 执行迁移...\n');
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });
  
  if (error) {
    console.error('❌ 迁移失败:', error);
  } else {
    console.log('✅ 迁移成功！');
  }
}

executeMigration();
