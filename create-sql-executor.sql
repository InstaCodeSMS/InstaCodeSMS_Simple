-- 创建一个简单的 SQL 执行函数
CREATE OR REPLACE FUNCTION execute_migration_sql(sql_text TEXT)
RETURNS TEXT AS $$
BEGIN
    EXECUTE sql_text;
    RETURN 'Migration executed successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;