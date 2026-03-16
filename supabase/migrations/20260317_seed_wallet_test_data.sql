-- ========================================
-- 钱包测试数据
-- 为测试账号 test@gmail.com 创建钱包和交易记录
-- ========================================

-- ========================================
-- 1. 查找用户 ID 并创建钱包
-- ========================================

-- 为 test@gmail.com 用户创建钱包（如果不存在）
-- 注意：余额单位为毫，100000 毫 = 100 元
INSERT INTO wallets (user_id, balance, frozen_balance, version, created_at, updated_at)
SELECT 
    id,
    100000,  -- 100 元 = 100000 毫
    0,
    1,
    NOW(),
    NOW()
FROM users 
WHERE email = 'test@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
    balance = 100000,
    updated_at = NOW();

-- ========================================
-- 2. 插入测试交易流水
-- ========================================

-- 获取用户 ID 变量（需要在 SQL 中使用 DO 块）
DO $$
DECLARE
    v_user_id UUID;
    v_balance_before BIGINT;
    v_balance_after BIGINT;
BEGIN
    -- 获取用户 ID
    SELECT id INTO v_user_id FROM users WHERE email = 'test@gmail.com' LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User test@gmail.com not found';
        RETURN;
    END IF;
    
    -- 初始化余额快照
    v_balance_before := 0;
    
    -- 交易 1: 初始充值 50 元
    v_balance_after := v_balance_before + 50000;  -- 50 元
    INSERT INTO wallet_transactions (
        id, user_id, amount, type, balance_before, balance_after,
        related_id, related_type, description, metadata, created_at
    ) VALUES (
        gen_random_uuid(),
        v_user_id,
        50000,  -- +50 元
        'recharge',
        v_balance_before,
        v_balance_after,
        'RECHARGE001',
        'recharge',
        '账户充值 - 支付宝',
        '{"payment_method": "alipay", "trade_no": "2026031700001"}',
        NOW() - INTERVAL '7 days'
    );
    v_balance_before := v_balance_after;
    
    -- 交易 2: 消费 15 元
    v_balance_after := v_balance_before - 15000;  -- -15 元
    INSERT INTO wallet_transactions (
        id, user_id, amount, type, balance_before, balance_after,
        related_id, related_type, description, metadata, created_at
    ) VALUES (
        gen_random_uuid(),
        v_user_id,
        -15000,  -- -15 元
        'consume',
        v_balance_before,
        v_balance_after,
        'ORD202603170001',
        'order',
        '购买服务 - US 虚拟号码',
        '{"product_id": "xxx", "quantity": 1}',
        NOW() - INTERVAL '6 days'
    );
    v_balance_before := v_balance_after;
    
    -- 交易 3: 再次充值 80 元
    v_balance_after := v_balance_before + 80000;  -- +80 元
    INSERT INTO wallet_transactions (
        id, user_id, amount, type, balance_before, balance_after,
        related_id, related_type, description, metadata, created_at
    ) VALUES (
        gen_random_uuid(),
        v_user_id,
        80000,  -- +80 元
        'recharge',
        v_balance_before,
        v_balance_after,
        'RECHARGE002',
        'recharge',
        '账户充值 - USDT',
        '{"payment_method": "usdt", "trade_no": "2026031700002"}',
        NOW() - INTERVAL '4 days'
    );
    v_balance_before := v_balance_after;
    
    -- 交易 4: 消费 10 元
    v_balance_after := v_balance_before - 10000;  -- -10 元
    INSERT INTO wallet_transactions (
        id, user_id, amount, type, balance_before, balance_after,
        related_id, related_type, description, metadata, created_at
    ) VALUES (
        gen_random_uuid(),
        v_user_id,
        -10000,  -- -10 元
        'consume',
        v_balance_before,
        v_balance_after,
        'ORD202603170002',
        'order',
        '购买服务 - UK 虚拟号码',
        '{"product_id": "xxx", "quantity": 2}',
        NOW() - INTERVAL '3 days'
    );
    v_balance_before := v_balance_after;
    
    -- 交易 5: 退款 5 元（订单取消）
    v_balance_after := v_balance_before + 5000;  -- +5 元
    INSERT INTO wallet_transactions (
        id, user_id, amount, type, balance_before, balance_after,
        related_id, related_type, description, metadata, created_at
    ) VALUES (
        gen_random_uuid(),
        v_user_id,
        5000,  -- +5 元
        'refund',
        v_balance_before,
        v_balance_after,
        'REFUND202603170001',
        'order',
        '订单退款 - 超时未使用',
        '{"original_order": "ORD202603170002"}',
        NOW() - INTERVAL '2 days'
    );
    
    -- 最终余额应该是: 50000 - 15000 + 80000 - 10000 + 5000 = 110000 毫 = 110 元
    RAISE NOTICE 'Test data created for user %', v_user_id;
END $$;

-- ========================================
-- 3. 验证数据
-- ========================================

-- 查询钱包信息
SELECT 
    u.email,
    w.balance,
    w.balance / 1000.0 as balance_yuan,
    w.frozen_balance,
    w.version,
    w.created_at,
    w.updated_at
FROM wallets w
JOIN users u ON w.user_id = u.id
WHERE u.email = 'test@gmail.com';

-- 查询交易记录
SELECT 
    wt.created_at,
    CASE wt.type 
        WHEN 'recharge' THEN '充值'
        WHEN 'consume' THEN '消费'
        WHEN 'refund' THEN '退款'
        ELSE wt.type
    END as type_cn,
    wt.amount / 1000.0 as amount_yuan,
    wt.balance_before / 1000.0 as balance_before_yuan,
    wt.balance_after / 1000.0 as balance_after_yuan,
    wt.description
FROM wallet_transactions wt
JOIN users u ON wt.user_id = u.id
WHERE u.email = 'test@gmail.com'
ORDER BY wt.created_at DESC;