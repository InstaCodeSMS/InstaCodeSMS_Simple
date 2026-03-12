/**
 * English Language Pack
 * 
 * Why: Centralized English translations for maintainability and reusability
 */

import type { Translations } from './types'

export const en: Translations = {
  common: {
    brand_name: 'InstaCodeSMS',
    loading: 'Loading...',
    error: 'Error occurred',
    confirm: 'Confirm',
    cancel: 'Cancel',
    copy: 'Copy',
    copied: 'Copied to clipboard',
    search: 'Search',
    theme: {
      dark: 'Switch to dark mode',
      light: 'Switch to light mode'
    }
  },
  
  nav: {
    purchase: 'Purchase',
    receive: 'Terminal',
    home: 'Home'
  },
  
  purchase: {
    title: 'Deploy Virtual Terminal',
    subtitle: 'System Protocol / Node',
    search_placeholder: 'Search platform (e.g., Telegram)...',
    sort_default: 'Default Sorting',
    sort_price_low: 'Price: Low to High',
    sort_price_high: 'Price: High to Low',
    out_of_stock: 'Out of Stock',
    starting_price: 'Starting at',
    stock: 'Stock',
    no_stock: 'None',
    step_region: 'Select Region',
    step_duration: 'Select Duration',
    step_quantity: 'Select Quantity',
    step_payment: 'Payment Method',
    confirm_purchase: 'Confirm Purchase',
    processing: 'Processing...',
    cancel: 'Cancel',
    total_cost: 'Total',
    unit: 'Unit',
    current_region_only: 'Currently only US region is supported',
    no_duration_options: 'No duration options available for this product',
    configure_node: 'Configure Node Deployment',
    product: 'Product',
    region: 'Region',
    duration: 'Duration',
    quantity: 'Quantity',
    not_found: 'No matching services found',
    alipay: 'Alipay',
    alipay_scan: 'Alipay Scan to Pay',
    test_mode_notice: 'This page is currently in testing phase. Real orders are not supported. Please do not make actual payments.',
    test_mode_warning: 'Test Mode'
  },
  
  receive: {
    terminal_receiver: 'Terminal / Inbound Receiver',
    info_receiver_terminal_html: 'Inbound <span class="text-blue-600 italic">Terminal</span>',
    access_token: 'Access Token',
    token_placeholder: 'Enter your access token...',
    token_hint: 'After purchasing, you will receive a token. Paste it here to receive verification codes.',
    show_token: 'Show Token',
    hide_token: 'Hide Token',
    btn_start: 'Start Radar',
    btn_stop: 'Stop Radar',
    incoming_stream: 'Incoming Stream',
    notification_on: 'Notification On',
    notification_off: 'Notification Off',
    clear_history: 'Clear',
    export: 'Export',
    system_time: 'System Time',
    verification_code: 'Code',
    copy_code: 'Copy',
    copy: 'Copy All',
    awaiting_input: 'Awaiting terminal input...',
    token_required: 'Please enter access token',
    token_invalid_char: 'Token can only contain letters and numbers',
    radar_active: 'Radar activated',
    radar_offline: 'Radar offline',
    radar_scanning: 'Radar scanning, awaiting signal...',
    new_signal: 'New signal received!',
    copied: 'Copied to clipboard',
    copy_failed: 'Copy failed',
    confirm_clear: 'Are you sure to clear all history?',
    history_cleared: 'History cleared',
    no_messages_export: 'No messages to export',
    export_success: 'Export successful',
    notification_enabled: 'Notification enabled',
    notification_disabled: 'Notification disabled',
    connection_failed: 'Connection failed, please try again',
    shield_denied: 'Access denied'
  },
  
  checkout: {
    waiting_payment: 'Waiting for Payment',
    initializing: 'Initializing',
    please_confirm: 'Please Confirm Payment',
    preparing_order: 'Preparing Order',
    time_left: 'Time Left',
    product: 'Product',
    region: 'Region',
    days: 'days',
    quantity: 'Quantity',
    amount_due: 'Amount Due',
    proceed_payment: 'Proceed to Payment',
    waiting_confirmation: 'Waiting for payment confirmation...',
    paid_check: 'I\'ve Paid, Check Result',
    cancel_order: 'Cancel Order',
    payment_timeout: 'Payment timeout, please try again',
    creating_order: 'Payment successful, creating order...',
    order_created: 'Order created successfully',
    payment_success: 'Payment Successful',
    important_notice: 'Important Notice',
    exact_amount: 'Please pay the exact amount',
    timeout_notice: 'Please complete payment within 5 minutes, overdue orders will be automatically deleted',
    scan_alipay: 'Please scan with Alipay to pay',
    method: 'Method',
    trade: 'Trade',
    go_back: 'Go Back',
    return_retry: 'Return and Retry',
    order_failed: 'Failed to create order',
    contact_support: 'Payment successful but order creation failed, please contact support'
  },
  
  success: {
    payment_successful: 'Payment Successful',
    order_id: 'Order ID',
    phone_number: 'Phone Number',
    access_token: 'Access Token',
    expires_at: 'Expires At',
    tips: 'Tips',
    tips_content: 'Please keep your access token safe, it is used to receive verification codes in the terminal. The phone number will be used to receive SMS verification codes.',
    continue_shopping: 'Continue Shopping',
    go_to_terminal: 'Go to Terminal',
    thank_you: 'Thank you for your trust, enjoy! 🎉',
    copy: 'Copy',
    copy_failed: 'Copy failed, please copy manually'
  },
  
  footer: {
    brand: {
      slogan: 'Professional SMS Verification Platform',
      features: 'Secure · Fast · Reliable'
    },
    products: {
      title: 'Products',
      smsCode: 'SMS Verification',
      virtualNumber: 'Virtual Numbers',
      bulkPurchase: 'Bulk Purchase',
      pricing: 'Pricing'
    },
    support: {
      title: 'Support',
      guide: 'User Guide',
      apiDocs: 'API Docs',
      faq: 'FAQ',
      status: 'Service Status'
    },
    contact: {
      title: 'Follow Us',
      telegram: 'Telegram',
      facebook: 'Facebook',
      twitter: 'Twitter',
      youtube: 'YouTube'
    },
    copyright: '© 2026 SIMPLEFAKA',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    status: 'Service Status'
  },

  auth: {
    register: 'Register',
    login: 'Login',
    logout: 'Logout',
    email: 'Email Address',
    password: 'Password',
    confirm_password: 'Confirm Password',
    password_min_length: 'Password must be at least 6 characters',
    email_invalid: 'Please enter a valid email address',
    password_mismatch: 'Passwords do not match',
    register_success: 'Registration successful',
    register_failed: 'Registration failed',
    login_success: 'Login successful',
    login_failed: 'Login failed',
    email_required: 'Email address is required',
    password_required: 'Password is required',
    email_placeholder: 'Enter your email address',
    password_placeholder: 'Enter your password',
    confirm_password_placeholder: 'Confirm your password',
    have_account: 'Already have an account?',
    no_account: 'Don\'t have an account?',
    login_now: 'Login now',
    register_now: 'Register now'
  },

  dashboard: {
    title: 'Dashboard',
    account_info: 'Account Information',
    balance: 'Account Balance',
    current_balance: 'Current Balance',
    order_stats: 'Order Statistics',
    total_orders: 'Total Orders',
    recent_orders: 'Recent Orders',
    no_orders: 'No orders yet',
    order_id: 'Order ID',
    unknown_product: 'Unknown Product',
    paid: 'Paid',
    pending: 'Pending',
    cancelled: 'Cancelled',
    role: 'Role',
    email_label: 'Email'
  }
}
