// ========== 上游 API 类型定义 ==========

// 基础响应结构
export interface UpstreamResponse<T = unknown> {
  code: number
  msg: string
  data?: T
}

// 用户信息
export interface ProfileData {
  username: string
  nickname: string
  avatar: string
  money: string // 注意：上游返回的是字符串类型
}

// 分类
export interface Category {
  id: number
  name: string
}

export interface CategoryListData {
  list: Category[]
  total: number
}

// 项目/服务
export interface App {
  id: number
  cate_id: number
  name: string
  price: string // 注意：上游返回的是字符串类型
  num: number
}

export interface AppListData {
  list: App[]
  total: number
}

// 号码前缀
export interface Prefix {
  prefix: number // 注意：上游返回的是数字类型
  num: number
}

export interface PrefixListData {
  list: Prefix[]
  count: number
  num: number
}

// 订单列表项（简略信息）
export interface OrderListItem {
  id: number
  ordernum: string
  app_id: string // 注意：上游返回的是字符串类型
  cate_id: number
  type: number
  num: number
  remark: string
  status: number
  create_time: string
  smsApp: {
    name: string
  }
}

// 订单详情项（完整信息）
export interface OrderItem {
  id: number
  app_id: string // 注意：上游返回的是字符串类型
  cate_id: number
  type: number
  tel: string
  token: string
  end_time: string
  sms_count: number
  voice_count: number
  remark: string
  status: number
  api: string
}

export interface OrderCreateData {
  ordernum: string
  api_count: number
  url_list: string[]
  list: OrderItem[]
}

// 订单列表响应
export interface OrderListData {
  list: OrderListItem[]
  total: number
}

// 订单详情响应
export interface OrderDetailData {
  url_list: string[]
  list: OrderItem[]
  total: number
}

// 短信验证码
export interface SmsData {
  code: string
  code_time: string
  expired_date: string
}

export interface SmsDataJson3 {
  tel: string
  sms: string
  sms_time: string
  expired_date: string
}

// ========== 请求参数类型 ==========

export interface AppListParams {
  cate_id?: number
  type?: number
  name?: string
}

export interface PrefixParams {
  app_id: number
  type?: number
  expiry?: number
}

export interface OrderCreateParams {
  app_id: number
  type?: number
  num: number
  expiry?: number
  prefix?: string
  exclude_prefix?: string
}

export interface OrderListParams {
  page?: number
  limit?: number
  ordernum?: string
  cate_id?: number
  app_id?: number
  type?: number
}

export interface OrderDetailParams {
  ordernum: string
}

// ========== 本地 API 响应类型 ==========

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}

// 有效期定价选项
export interface ExpiryOption {
  expiry: number        // 有效期类型 ID (对应 ExpiryType 枚举)
  label: string         // 显示标签 (如 "5-30天")
  price: number         // 该有效期的独立价格
}

// 服务列表响应
export interface ServiceItem {
  id: string            // products.id (UUID)，唯一标识
  upstream_id: number   // 上游产品 ID，用于 API 调用
  cate_id: number
  title: string
  description?: string | null
  sales_price: number   // 起步价（展示用）
  num: number           // 库存
  expiry_options?: ExpiryOption[]  // 有效期定价选项
}

export interface ServiceListResponse {
  list: ServiceItem[]
  total: number
}

// 项目类型枚举
export enum ProjectType {
  FirstTime = 1, // 首登卡
  Restart = 2, // 重启卡
  Renewal = 3, // 续费卡
}

// 有效期类型枚举
export enum ExpiryType {
  Random = 0, // 随机
  Days5to30 = 1, // 5-30天 (9折)
  Days10to30 = 2, // 10-30天
  Days15to30 = 3, // 15-30天
  Days30to60 = 4, // 30-60天
  Days60to80 = 5, // 60-80天
  Days80Plus = 6, // 80天以上 (加收10%)
}