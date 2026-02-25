import type { UpstreamResponse, ProfileData, CategoryListData, AppListData, PrefixListData, OrderCreateData, OrderListData, OrderDetailData, AppListParams, PrefixParams, OrderCreateParams, OrderListParams, OrderDetailParams } from '../types/api'

/**
 * 上游 API 业务错误
 */
export class UpstreamError extends Error {
  constructor(
    message: string,
    public code: number = 0,
    public isBusinessError: boolean = true
  ) {
    super(message)
    this.name = 'UpstreamError'
  }
}

/**
 * 友好错误消息映射
 */
const FRIENDLY_ERRORS: Record<string, string> = {
  'Invalid login token': 'API Token 无效或已过期，请联系管理员',
  'Project ID cannot be empty': '项目 ID 不能为空',
  'Insufficient inventory': '库存不足，请选择其他项目',
  'Too many buyers, please try again later': '系统繁忙，请稍后重试',
  'Do not submit duplicate orders': '请勿重复提交订单，请等待1分钟后重试',
  'Insufficient balance': '余额不足，请充值后重试',
  '授权令牌无效': 'API Token 无效或已过期',
  'Under the currently selected conditions, the inventory is insufficient': '当前条件下库存不足，请减少购买数量或选择其他项目',
}

/**
 * 获取友好错误消息
 */
function getFriendlyMessage(msg: string): string {
  for (const [key, value] of Object.entries(FRIENDLY_ERRORS)) {
    if (msg.includes(key)) {
      return value
    }
  }
  return msg || '上游服务异常，请稍后重试'
}

/**
 * 上游 API 客户端
 * 作为"盾牌"层，统一处理认证、错误拦截和业务逻辑
 */
export class UpstreamClient {
  private token: string
  private baseUrl: string

  constructor(token: string, baseUrl: string = 'https://api.cc') {
    this.token = token
    this.baseUrl = baseUrl
  }

  /**
   * 统一请求方法
   * 处理认证、错误拦截、业务逻辑检查
   */
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`

    const headers = new Headers(options.headers)
    headers.set('Authorization', this.token)
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    let response: Response
    try {
      response = await fetch(url, { ...options, headers })
    } catch (error) {
      throw new UpstreamError('网络连接失败，请检查网络或稍后重试', 0, false)
    }

    // HTTP 级别错误
    if (!response.ok) {
      if (response.status === 401) {
        throw new UpstreamError('API Token 无效或已过期', 401, true)
      }
      throw new UpstreamError(`上游服务异常: ${response.statusText}`, response.status, false)
    }

    const data: UpstreamResponse<T> = await response.json()

    // 业务级别错误（上游返回 200 但 code 不为 1）
    if (data.code !== 1) {
      const friendlyMsg = getFriendlyMessage(data.msg)
      throw new UpstreamError(friendlyMsg, data.code, true)
    }

    return data.data as T
  }

  // ========== 用户信息 ==========

  /**
   * 获取用户信息
   * GET /api/v1/profile/info
   */
  async getProfile(): Promise<ProfileData> {
    return this.request<ProfileData>('/api/v1/profile/info', {
      method: 'GET',
    })
  }

  // ========== 项目管理 ==========

  /**
   * 获取项目分类
   * GET /api/v1/app/cate
   */
  async getCategories(): Promise<CategoryListData> {
    return this.request<CategoryListData>('/api/v1/app/cate', {
      method: 'GET',
    })
  }

  /**
   * 获取项目列表
   * POST /api/v1/app/list
   */
  async getAppList(params: AppListParams = {}): Promise<AppListData> {
    const body = {
      cate_id: params.cate_id ?? 2,
      type: params.type ?? 1,
      name: params.name,
    }

    return this.request<AppListData>('/api/v1/app/list', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  // ========== 购买 API ==========

  /**
   * 获取号码前缀
   * POST /api/v1/buy/prefix
   */
  async getPrefixes(params: PrefixParams): Promise<PrefixListData> {
    const body = {
      app_id: params.app_id,
      type: params.type ?? 1,
      expiry: params.expiry ?? 0,
    }

    return this.request<PrefixListData>('/api/v1/buy/prefix', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /**
   * 购买服务
   * POST /api/v1/buy/create
   */
  async createOrder(params: OrderCreateParams): Promise<OrderCreateData> {
    const body: Record<string, unknown> = {
      app_id: params.app_id,
      type: params.type ?? 1,
      num: params.num,
      expiry: params.expiry ?? 0,
    }

    if (params.prefix) {
      body.prefix = params.prefix
    }
    if (params.exclude_prefix) {
      body.exclude_prefix = params.exclude_prefix
    }

    return this.request<OrderCreateData>('/api/v1/buy/create', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  // ========== 订单管理 ==========

  /**
   * 获取订单列表
   * POST /api/v1/order/list
   */
  async getOrderList(params: OrderListParams = {}): Promise<OrderListData> {
    const body = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      ordernum: params.ordernum,
      cate_id: params.cate_id,
      app_id: params.app_id,
      type: params.type,
    }

    return this.request<OrderListData>('/api/v1/order/list', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /**
   * 获取订单详情
   * POST /api/v1/order/api
   */
  async getOrderDetail(params: OrderDetailParams): Promise<OrderDetailData> {
    return this.request<OrderDetailData>('/api/v1/order/api', {
      method: 'POST',
      body: JSON.stringify({ ordernum: params.ordernum }),
    })
  }

  // ========== 验证码 ==========

  /**
   * 获取短信验证码
   * 代理上游 API，保护 Token 不泄露
   * @param apiUrl 上游返回的完整 API 链接
   */
  async getSmsCode(apiUrl: string): Promise<{ success: boolean; sms: string; tel: string; expired_date: string }> {
    // 强制使用 format=json3 获取最完整的数据
    const url = apiUrl.includes('?') ? `${apiUrl}&format=json3` : `${apiUrl}?format=json3`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        return { success: false, sms: '', tel: '', expired_date: '' }
      }

      const data = await response.json()

      // format=json3 返回格式
      if (data.code === 1 && data.data) {
        return {
          success: true,
          sms: data.data.sms || '',
          tel: data.data.tel || '',
          expired_date: data.data.expired_date || '',
        }
      }

      return { success: false, sms: '', tel: '', expired_date: '' }
    } catch {
      return { success: false, sms: '', tel: '', expired_date: '' }
    }
  }
}

/**
 * 从环境变量创建客户端实例
 */
export function createUpstreamClient(env: { UPSTREAM_API_URL: string; UPSTREAM_API_TOKEN: string }): UpstreamClient {
  return new UpstreamClient(env.UPSTREAM_API_TOKEN, env.UPSTREAM_API_URL)
}