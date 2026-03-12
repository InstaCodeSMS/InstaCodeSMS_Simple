/**
 * i18n 类型定义
 * 
 * Why: 提供类型安全的语言支持，确保翻译 key 的正确性
 */

export type Language = 'zh' | 'en'

export interface TranslationMessages {
  [key: string]: string | TranslationMessages
}

export interface Translations {
  common: {
    brand_name: string
    loading: string
    error: string
    confirm: string
    cancel: string
    copy: string
    copied: string
    search: string
    theme: {
      dark: string
      light: string
    }
  }
  nav: {
    purchase: string
    receive: string
    home: string
  }
  purchase: {
    title: string
    subtitle: string
    search_placeholder: string
    sort_default: string
    sort_price_low: string
    sort_price_high: string
    out_of_stock: string
    starting_price: string
    stock: string
    no_stock: string
    step_region: string
    step_duration: string
    step_quantity: string
    step_payment: string
    confirm_purchase: string
    processing: string
    cancel: string
    total_cost: string
    unit: string
    current_region_only: string
    no_duration_options: string
    configure_node: string
    product: string
    region: string
    duration: string
    quantity: string
    not_found: string
    alipay: string
    alipay_scan: string
    test_mode_notice: string
    test_mode_warning: string
  }
  receive: {
    terminal_receiver: string
    info_receiver_terminal_html: string
    access_token: string
    token_placeholder: string
    token_hint: string
    show_token: string
    hide_token: string
    btn_start: string
    btn_stop: string
    incoming_stream: string
    notification_on: string
    notification_off: string
    clear_history: string
    export: string
    system_time: string
    verification_code: string
    copy_code: string
    copy: string
    awaiting_input: string
    token_required: string
    token_invalid_char: string
    radar_active: string
    radar_offline: string
    radar_scanning: string
    new_signal: string
    copied: string
    copy_failed: string
    confirm_clear: string
    history_cleared: string
    no_messages_export: string
    export_success: string
    notification_enabled: string
    notification_disabled: string
    connection_failed: string
    shield_denied: string
  }
  checkout: {
    waiting_payment: string
    initializing: string
    please_confirm: string
    preparing_order: string
    time_left: string
    product: string
    region: string
    days: string
    quantity: string
    amount_due: string
    proceed_payment: string
    waiting_confirmation: string
    paid_check: string
    cancel_order: string
    payment_timeout: string
    creating_order: string
    order_created: string
    payment_success: string
    important_notice: string
    exact_amount: string
    timeout_notice: string
    scan_alipay: string
    method: string
    trade: string
    go_back: string
    return_retry: string
    order_failed: string
    contact_support: string
  }
  success: {
    payment_successful: string
    order_id: string
    phone_number: string
    access_token: string
    expires_at: string
    tips: string
    tips_content: string
    continue_shopping: string
    go_to_terminal: string
    thank_you: string
    copy: string
    copy_failed: string
  }
  footer: {
    brand: {
      slogan: string
      features: string
    }
    products: {
      title: string
      smsCode: string
      virtualNumber: string
      bulkPurchase: string
      pricing: string
    }
    support: {
      title: string
      guide: string
      apiDocs: string
      faq: string
      status: string
    }
    contact: {
      title: string
      telegram: string
      facebook: string
      twitter: string
      youtube: string
    }
    copyright: string
    privacy: string
    terms: string
    status: string
  }
  auth: {
    register: string
    login: string
    logout: string
    email: string
    password: string
    confirm_password: string
    password_min_length: string
    email_invalid: string
    password_mismatch: string
    register_success: string
    register_failed: string
    login_success: string
    login_failed: string
    email_required: string
    password_required: string
    email_placeholder: string
    password_placeholder: string
    confirm_password_placeholder: string
    have_account: string
    no_account: string
    login_now: string
    register_now: string
  }
  dashboard: {
    title: string
    account_info: string
    balance: string
    current_balance: string
    order_stats: string
    total_orders: string
    recent_orders: string
    no_orders: string
    order_id: string
    unknown_product: string
    paid: string
    pending: string
    cancelled: string
    role: string
    email_label: string
  }
}
