-- 更新有效期选项的显示标签
-- 将范围格式（如 "5-30天"）改为简洁格式（如 "5 天"）
-- 此修改仅影响前端展示，不涉及业务逻辑

UPDATE products 
SET expiry_pricing = jsonb_set(
  expiry_pricing, 
  '{options}', 
  (
    SELECT jsonb_agg(
      jsonb_set(option_item, '{label}', 
        CASE 
          WHEN (option_item->>'label') LIKE '5-%' THEN '"5 天"'::jsonb
          WHEN (option_item->>'label') LIKE '10-%' THEN '"10 天"'::jsonb
          WHEN (option_item->>'label') LIKE '15-%' THEN '"15 天"'::jsonb
          WHEN (option_item->>'label') LIKE '30-%' THEN '"30 天"'::jsonb
          WHEN (option_item->>'label') LIKE '60-%' THEN '"60 天"'::jsonb
          WHEN (option_item->>'label') = '80天以上' THEN '"80天以上"'::jsonb
          ELSE option_item->'label'
        END
      )
    )
    FROM jsonb_array_elements(expiry_pricing->'options') AS option_item
  )
)
WHERE expiry_pricing IS NOT NULL;

-- 添加迁移记录注释
COMMENT ON COLUMN products.expiry_pricing IS '有效期定价配置，格式: { "options": [{ "expiry": 1, "label": "5 天", "price": 10.00 }] }';