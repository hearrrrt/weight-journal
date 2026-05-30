-- supabase/migrations/001_initial_schema.sql
-- Initial database schema for Weight Journal app

-- ============================================================
-- 用户资料表 (User Profiles)
-- ============================================================
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  nickname text,
  avatar_url text,
  partner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 体重记录表 (Weight Logs)
-- ============================================================
CREATE TABLE weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight decimal(4,1) NOT NULL CHECK (weight > 0),
  mood text,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, log_date)
);

-- ============================================================
-- 阶梯目标表 (Goals)
-- ============================================================
CREATE TYPE goal_status AS ENUM ('active', 'completed', 'abandoned');

CREATE TABLE goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  target_weight decimal(4,1) NOT NULL CHECK (target_weight > 0),
  reward text,
  status goal_status DEFAULT 'active',
  sort_order int DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 徽章表 (User Badges)
-- ============================================================
CREATE TABLE user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_key text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

-- ============================================================
-- 互动留言表 (Cheers)
-- ============================================================
CREATE TABLE cheers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight_log_id uuid NOT NULL REFERENCES weight_logs(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 索引 (Indexes)
-- ============================================================
CREATE INDEX idx_goals_user ON goals(user_id, sort_order);
CREATE INDEX idx_cheers_to_user ON cheers(to_user, created_at DESC);

-- ============================================================
-- RLS 启用 (Enable Row Level Security)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- profiles 策略: 自己可读写
-- ============================================================
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- profiles 策略: 伴侣可读（通过 partner_id 关联）
CREATE POLICY "Partner can read profile" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.partner_id = profiles.id
    )
  );

-- ============================================================
-- weight_logs 策略: 自己可读写
-- ============================================================
CREATE POLICY "Users can CRUD own logs" ON weight_logs
  FOR ALL USING (auth.uid() = user_id);

-- weight_logs 策略: 伴侣可读
CREATE POLICY "Partner can read logs" ON weight_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.partner_id = weight_logs.user_id
    )
  );

-- ============================================================
-- goals 策略: 自己可读写
-- ============================================================
CREATE POLICY "Users can CRUD own goals" ON goals
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- user_badges 策略: 自己可读写
-- ============================================================
CREATE POLICY "Users can read own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own badges" ON user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_badges 策略: 伴侣可读
CREATE POLICY "Partner can read badges" ON user_badges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.partner_id = user_badges.user_id
    )
  );

-- ============================================================
-- cheers 策略: 发送者可读自己发的
-- ============================================================
CREATE POLICY "Users can read sent cheers" ON cheers
  FOR SELECT USING (auth.uid() = from_user);

-- cheers 策略: 接收者可读给自己的
CREATE POLICY "Users can read received cheers" ON cheers
  FOR SELECT USING (auth.uid() = to_user);

-- cheers 策略: 可插入
CREATE POLICY "Users can insert cheers" ON cheers
  FOR INSERT WITH CHECK (auth.uid() = from_user);

-- cheers 策略: 发送者可删除
CREATE POLICY "Users can delete own cheers" ON cheers
  FOR DELETE USING (auth.uid() = from_user);

-- ============================================================
-- 自动创建 profile 的触发器 (Auto-profile trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, nickname)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nickname', '新朋友'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
