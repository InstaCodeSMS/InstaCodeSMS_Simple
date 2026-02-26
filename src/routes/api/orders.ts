import { Hono } from 'hono'
import { createUpstreamClient, UpstreamError } from '../../adapters/upstream'
import { calculatePrice, calculateTotalPrice, parseMarkup } from '../../services/price'
import type { Env } from '../../types/env'
import type { ApiResponse, OrderCreateData } from '../../types/api'

/**
 * Base64URL 编码（兼容 Cloudflare Workers）
 */
function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Base64URL 解码（兼容 Cloudflare Workers）
 */
function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return atob(str)
}

const app = new Hono<{ Bindings: Env }>()

/**
 * POST /api/orders/create
 * 创建订单
 */
app.post('/create', async (c) => {
  try {
    const body = await c.req.json()

    // 参数验证
    const appId = body.app_id
    const num = body.num

    if (!appId || typeof appId !== 'number') {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '请选择服务项目',
        },
        400
      )
    }

    if (!num || typeof num !== 'number' || num < 1) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '请输入有效的购买数量',
        },
        400
      )
    }

    const client = createUpstreamClient({
      UPSTREAM_API_URL: c.env.UPSTREAM_API_URL,
      UPSTREAM_API_TOKEN: c.env.UPSTREAM_API_TOKEN,
    })

    // 创建订单
    const data: OrderCreateData = await client.createOrder({
      app_id: appId,
      type: body.type ?? 1,
      num: num,
      expiry: body.expiry ?? 0,
      prefix: body.prefix,
      exclude_prefix: body.exclude_prefix,
    })

    // 计算加价后的价格
    const markup = parseMarkup(c.env.PRICE_MARKUP)
    const unitPrice = calculatePrice(data.list[0]?.api ? 0 : 0, markup, body.expiry)

    // 返回订单信息，但隐藏上游敏感信息
    // 不暴露上游 API token，只返回本地使用的订单号
    return c.json<ApiResponse>({
      success: true,
      message: '订单创建成功',
      data: {
        ordernum: data.ordernum,
        api_count: data.api_count,
        // 不暴露 url_list 和 list 中的敏感 token
        // 用户需要通过订单详情 API 获取验证码
        items: data.list.map((item) => ({
          tel: item.tel,
          end_time: item.end_time,
          // 返回上游提供的 token，不暴露上游 API URL
          token: item.token,
        })),
      },
    })
  } catch (error) {
    if (error instanceof UpstreamError) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: error.message,
        },
        error.code === 401 ? 401 : 400
      )
    }
    return c.json<ApiResponse>(
      {
        success: false,
        message: '创建订单失败，请稍后重试',
      },
      500
    )
  }
})

/**
 * GET /api/orders
 * 获取订单列表
 * 将 GET 请求转换为上游的 POST 请求
 */
app.get('/', async (c) => {
  try {
    const client = createUpstreamClient({
      UPSTREAM_API_URL: c.env.UPSTREAM_API_URL,
      UPSTREAM_API_TOKEN: c.env.UPSTREAM_API_TOKEN,
    })

    // 获取查询参数
    const page = c.req.query('page')
    const limit = c.req.query('limit')
    const ordernum = c.req.query('ordernum')
    const cateId = c.req.query('cate_id')
    const appId = c.req.query('app_id')
    const type = c.req.query('type')

    const data = await client.getOrderList({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      ordernum: ordernum || undefined,
      cate_id: cateId ? parseInt(cateId) : undefined,
      app_id: appId ? parseInt(appId) : undefined,
      type: type ? parseInt(type) : undefined,
    })

    // 订单列表返回的数据结构（注意：列表中不包含 tel/token/api 字段）
    return c.json<ApiResponse>({
      success: true,
      message: '获取订单列表成功',
      data: {
        list: data.list.map((item) => ({
          id: item.id,
          ordernum: item.ordernum,
          app_id: item.app_id,
          cate_id: item.cate_id,
          type: item.type,
          num: item.num,
          remark: item.remark,
          status: item.status,
          create_time: item.create_time,
          app_name: item.smsApp?.name || '',
        })),
        total: data.total,
      },
    })
  } catch (error) {
    if (error instanceof UpstreamError) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: error.message,
        },
        error.code === 401 ? 401 : 400
      )
    }
    return c.json<ApiResponse>(
      {
        success: false,
        message: '获取订单列表失败，请稍后重试',
      },
      500
    )
  }
})

/**
 * GET /api/orders/:ordernum
 * 获取订单详情
 */
app.get('/:ordernum', async (c) => {
  try {
    const ordernum = c.req.param('ordernum')

    if (!ordernum) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: '订单号不能为空',
        },
        400
      )
    }

    const client = createUpstreamClient({
      UPSTREAM_API_URL: c.env.UPSTREAM_API_URL,
      UPSTREAM_API_TOKEN: c.env.UPSTREAM_API_TOKEN,
    })

    const data = await client.getOrderDetail({ ordernum })

    // 返回订单详情（包含 tel/token/api 字段）
    return c.json<ApiResponse>({
      success: true,
      message: '获取订单详情成功',
      data: {
        url_list: data.url_list,
        list: data.list.map((item) => ({
          id: item.id,
          app_id: item.app_id,
          cate_id: item.cate_id,
          type: item.type,
          tel: item.tel,
          token: item.token,
          end_time: item.end_time,
          sms_count: item.sms_count,
          voice_count: item.voice_count,
          remark: item.remark,
          status: item.status,
          // 注意：api 字段仅在订单详情中返回
          api: item.api,
        })),
        total: data.total,
      },
    })
  } catch (error) {
    if (error instanceof UpstreamError) {
      return c.json<ApiResponse>(
        {
          success: false,
          message: error.message,
        },
        error.code === 401 ? 401 : 400
      )
    }
    return c.json<ApiResponse>(
      {
        success: false,
        message: '获取订单详情失败，请稍后重试',
      },
      500
    )
  }
})

export default app