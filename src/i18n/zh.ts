/**
 * 中文语言包
 * 
 * Why: 集中管理所有中文翻译文本，便于维护和复用
 */

import type { Translations } from './types'

export const zh: Translations = {
  common: {
    brand_name: '即刻接码',
    loading: '加载中...',
    error: '发生错误',
    confirm: '确认',
    cancel: '取消',
    copy: '复制',
    copied: '已复制到剪贴板',
    search: '搜索',
    theme: {
      dark: '切换到暗色模式',
      light: '切换到亮色模式'
    }
  },
  
  nav: {
    purchase: '购买服务',
    receive: '接码终端',
    home: '首页'
  },
  
  purchase: {
    title: '部署虚拟终端',
    subtitle: '系统协议 / 节点',
    search_placeholder: '搜索平台 (例如: Telegram)...',
    sort_default: '默认推荐排序',
    sort_price_low: '价格从低到高',
    sort_price_high: '价格从高到低',
    out_of_stock: '暂无库存',
    starting_price: '起步价',
    stock: '库存',
    no_stock: '无',
    step_region: '选择区域',
    step_duration: '选择有效期',
    step_quantity: '选择数量',
    step_payment: '支付方式',
    confirm_purchase: '确认购买',
    processing: '处理中...',
    cancel: '取消',
    total_cost: '总计',
    unit: '单位',
    current_region_only: '当前仅支持美国区域',
    no_duration_options: '该产品暂无有效期选项',
    configure_node: '配置节点部署',
    product: '产品',
    region: '区域',
    duration: '有效期',
    quantity: '数量',
    not_found: '未找到匹配的服务',
    alipay: '支付宝',
    alipay_scan: '支付宝扫码支付',
    test_mode_notice: '本页面目前处于测试阶段，暂不支持真实下单购买，请勿进行实际支付操作。',
    test_mode_warning: '测试模式'
  },
  
  receive: {
    terminal_receiver: '终端 / 信息接收器',
    info_receiver_terminal_html: '<span class="text-blue-600 italic">信息</span>接收终端',
    access_token: '访问令牌',
    token_placeholder: '请输入访问令牌...',
    token_hint: '购买服务后，系统会提供 Token 令牌，将其粘贴到此处即可接收验证码',
    show_token: '显示令牌',
    hide_token: '隐藏令牌',
    btn_start: '启动雷达',
    btn_stop: '停止雷达',
    incoming_stream: '实时数据流',
    notification_on: '通知已开启',
    notification_off: '通知已关闭',
    clear_history: '清空历史',
    export: '导出',
    system_time: '系统时间',
    verification_code: '验证码',
    copy_code: '复制',
    copy: '复制全文',
    awaiting_input: '等待终端输入...',
    token_required: '请输入访问令牌',
    token_invalid_char: '令牌只能包含字母和数字',
    radar_active: '雷达已启动',
    radar_offline: '雷达已关闭',
    radar_scanning: '雷达扫描中，等待信号...',
    new_signal: '收到新信号！',
    copied: '已复制到剪贴板',
    copy_failed: '复制失败',
    confirm_clear: '确定要清空所有历史记录吗？',
    history_cleared: '历史记录已清空',
    no_messages_export: '暂无消息可导出',
    export_success: '导出成功',
    notification_enabled: '通知已启用',
    notification_disabled: '通知已禁用',
    connection_failed: '连接失败，请稍后重试',
    shield_denied: '访问被拒绝'
  },
  
  checkout: {
    waiting_payment: '等待支付',
    initializing: '正在初始化',
    please_confirm: '请确认支付',
    preparing_order: '正在准备订单',
    time_left: '剩余时间',
    product: '产品',
    region: '区域',
    days: '天',
    quantity: '数量',
    amount_due: '应付金额',
    proceed_payment: '立即跳转支付',
    waiting_confirmation: '正在等待支付确认...',
    paid_check: '我已支付，查询结果',
    cancel_order: '取消订单',
    payment_timeout: '支付超时，请重新下单',
    creating_order: '支付成功，正在创建订单...',
    order_created: '订单创建成功',
    payment_success: '支付成功',
    important_notice: '重要提示',
    exact_amount: '请务必支付准确金额',
    timeout_notice: '请在 5 分钟内完成支付，超时订单将被自动删除',
    scan_alipay: '请使用支付宝扫码支付',
    method: '方式',
    trade: '交易',
    go_back: '返回重试',
    return_retry: '返回重试',
    order_failed: '创建订单失败',
    contact_support: '支付成功但创建订单失败，请联系客服'
  },
  
  success: {
    payment_successful: '支付成功',
    order_id: '订单编号',
    phone_number: '手机号码',
    access_token: '访问令牌',
    expires_at: '到期时间',
    tips: '温馨提示',
    tips_content: '请妥善保管您的访问令牌，用于在接码终端接收验证码。手机号码将用于接收短信验证码。',
    continue_shopping: '继续购买',
    go_to_terminal: '前往接码终端',
    thank_you: '感谢您的信任，祝您使用愉快 🎉',
    copy: '复制',
    copy_failed: '复制失败，请手动复制'
  },
  
  footer: {
    brand: {
      slogan: '专业的接码平台',
      features: '安全 · 快速 · 稳定'
    },
    products: {
      title: '产品服务',
      smsCode: '短信接码',
      virtualNumber: '虚拟号码',
      bulkPurchase: '批量购买',
      pricing: '价格方案'
    },
    support: {
      title: '帮助支持',
      guide: '使用指南',
      apiDocs: 'API文档',
      faq: '常见问题',
      status: '服务状态'
    },
    contact: {
      title: '联系我们',
      telegram: 'Telegram',
      facebook: 'Facebook',
      twitter: 'Twitter',
      youtube: 'YouTube'
    },
    copyright: '© 2026 SIMPLEFAKA',
    privacy: '隐私政策',
    terms: '服务条款',
    status: '服务状态'
  },

  auth: {
    register: '注册',
    login: '登录',
    logout: '退出登录',
    email: '邮箱地址',
    password: '密码',
    confirm_password: '确认密码',
    password_min_length: '密码至少6位',
    email_invalid: '请输入有效的邮箱地址',
    password_mismatch: '两次输入的密码不一致',
    register_success: '注册成功',
    register_failed: '注册失败',
    login_success: '登录成功',
    login_failed: '登录失败',
    email_required: '请输入邮箱地址',
    password_required: '请输入密码',
    email_placeholder: '请输入邮箱地址',
    password_placeholder: '请输入密码',
    confirm_password_placeholder: '请再次输入密码',
    have_account: '已有账号？',
    no_account: '没有账号？',
    login_now: '立即登录',
    register_now: '立即注册'
  },

  dashboard: {
    title: '用户中心',
    account_info: '账户信息',
    balance: '账户余额',
    current_balance: '当前余额',
    order_stats: '订单统计',
    total_orders: '总订单数',
    recent_orders: '最近订单',
    no_orders: '暂无订单记录',
    order_id: '订单号',
    unknown_product: '未知产品',
    paid: '已支付',
    pending: '待支付',
    cancelled: '已取消',
    role: '角色',
    email_label: '邮箱'
  }
}
