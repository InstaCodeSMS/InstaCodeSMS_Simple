-- ===========================================
-- 订单测试数据 - payment_orders 表
-- 关联测试用户: 84072084-dbe0-468e-9353-af4333ef56ff
-- Why: 为 Orders 页面提供各种状态的测试数据
-- ===========================================

-- 插入测试订单数据
INSERT INTO payment_orders (
    trade_id,
    order_id,
    payment_method,
    amount,
    actual_amount,
    status,
    product_info,
    token,
    trade_type,
    expiration_time,
    created_at,
    updated_at,
    paid_at,
    user_id,
    tel,
    sms_token,
    upstream_order_id,
    upstream_result
) VALUES
-- 状态 1: Pending (待支付)
('TEST001', 'ORD_TEST_PENDING_1', 'alipay', 0.50, 0.50, 1,
 '{"title": "Telegram", "expiry": 5, "quantity": 1, "service_id": "test-001", "unit_price": 0.5}',
 'http://epay.example.com/pay/TEST001', 'alipay', 300,
 NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes', NULL,
 '84072084-dbe0-468e-9353-af4333ef56ff', NULL, NULL, NULL, NULL),

-- 状态 2: Paid (已支付 - 活跃订单)
('TEST002', 'ORD_TEST_ACTIVE_1', 'alipay', 0.50, 0.50, 2,
 '{"title": "WhatsApp", "expiry": 20, "quantity": 1, "service_id": "test-002", "unit_price": 0.5}',
 'http://epay.example.com/pay/TEST002', 'alipay', 300,
 NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '9 minutes', NOW() - INTERVAL '9 minutes',
 '84072084-dbe0-468e-9353-af4333ef56ff', 
 '+12025551234', 'test_token_active_123',
 'UPSTREAM_ACTIVE_001',
 '{"api": "https://api.example.com/sms?token=test_token_active_123", "tel": "+12025551234", "token": "test_token_active_123", "end_time": "2026-03-17T20:30:00Z"}'),

-- 状态 2: Paid (已支付 - 已完成订单，有验证码)
('TEST003', 'ORD_TEST_COMPLETED_1', 'alipay', 0.50, 0.50, 2,
 '{"title": "Google Voice", "expiry": 5, "quantity": 1, "service_id": "test-003", "unit_price": 0.5}',
 'http://epay.example.com/pay/TEST003', 'alipay', 300,
 NOW() - INTERVAL '1 hour', NOW() - INTERVAL '59 minutes', NOW() - INTERVAL '59 minutes',
 '84072084-dbe0-468e-9353-af4333ef56ff',
 '+12025555678', 'test_token_completed_456',
 'UPSTREAM_COMPLETED_001',
 '{"api": "https://api.example.com/sms?token=test_token_completed_456", "tel": "+12025555678", "token": "test_token_completed_456", "code": "847291", "end_time": "2026-03-17T19:30:00Z"}'),

-- 状态 3: Timeout (超时)
('TEST004', 'ORD_TEST_TIMEOUT_1', 'alipay', 0.50, 0.50, 3,
 '{"title": "Discord", "expiry": 5, "quantity": 1, "service_id": "test-004", "unit_price": 0.5}',
 'http://epay.example.com/pay/TEST004', 'alipay', 300,
 NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', NULL,
 '84072084-dbe0-468e-9353-af4333ef56ff', NULL, NULL, NULL, NULL),

-- 状态 4: Cancelled (已取消)
('TEST005', 'ORD_TEST_CANCELLED_1', 'alipay', 0.50, 0.50, 4,
 '{"title": "Instagram", "expiry": 5, "quantity": 1, "service_id": "test-005", "unit_price": 0.5}',
 'http://epay.example.com/pay/TEST005', 'alipay', 300,
 NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours', NULL,
 '84072084-dbe0-468e-9353-af4333ef56ff', NULL, NULL, NULL, NULL),

-- 更多待支付订单
('TEST006', 'ORD_TEST_PENDING_2', 'alipay', 1.00, 1.00, 1,
 '{"title": "Twitter", "expiry": 10, "quantity": 1, "service_id": "test-006", "unit_price": 1.0}',
 'http://epay.example.com/pay/TEST006', 'alipay', 300,
 NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NULL,
 '84072084-dbe0-468e-9353-af4333ef56ff', NULL, NULL, NULL, NULL),

-- 更多已支付订单
('TEST007', 'ORD_TEST_PAID_2', 'alipay', 2.00, 2.00, 2,
 '{"title": "Facebook", "expiry": 20, "quantity": 1, "service_id": "test-007", "unit_price": 2.0}',
 'http://epay.example.com/pay/TEST007', 'alipay', 300,
 NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days',
 '84072084-dbe0-468e-9353-af4333ef56ff',
 '+12025559999', 'test_token_facebook_789',
 'UPSTREAM_FB_001',
 '{"api": "https://api.example.com/sms?token=test_token_facebook_789", "tel": "+12025559999", "token": "test_token_facebook_789"}')

ON CONFLICT (trade_id) DO NOTHING;

-- 验证插入结果
SELECT 
    trade_id,
    order_id,
    status,
    (product_info->>'title') as product_title,
    amount,
    created_at,
    user_id
FROM payment_orders
WHERE trade_id LIKE 'TEST%'
ORDER BY created_at DESC;