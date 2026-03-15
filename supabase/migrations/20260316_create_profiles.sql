-- profiles 表：用户资料扩展
-- Why: 分离认证数据和用户资料，遵循单一职责原则
-- 与 users 表一对一关联，存储非认证相关的用户信息

CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE,              -- 唯一用户名（可选设置）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引：加速用户名查询
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 触发器：自动为每个新用户创建 profile 记录
-- Why: 确保用户注册后立即有对应的 profile，无需手动创建
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为已存在的用户创建 profile 记录（迁移用）
INSERT INTO profiles (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM profiles)
ON CONFLICT DO NOTHING;