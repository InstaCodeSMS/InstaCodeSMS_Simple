import { Hono } from 'hono'
import { createUpstreamClient } from '../../adapters/upstream'
import type { Env } from '../../types/env'
import type { ApiResponse } from '../../types/api'

const app = new Hono<{ Bindings: Env }>()

/**
 * GET /api/sms/:ordernum
 * 获取短信验证码（HTML 格式，用于 HTMX 轮询）
 * 
 * 流程：
 * 1. 用户输入订单号
 * 2. 后端通过订单详情获取对应的 api URL
 * 3. 代理请求上游 API 获取验证码
 */
app.get('/:ordernum', async (c) => {
  try {
    const ordernum = c.req.param('ordernum')

    if (!ordernum) {
      return c.html(getSmsHtml('', '', '等待输入订单号...', 'pending'))
    }

    const client = createUpstreamClient({
      UPSTREAM_API_URL: c.env.UPSTREAM_API_URL,
      UPSTREAM_API_TOKEN: c.env.UPSTREAM_API_TOKEN,
    })

    // 获取订单详情（包含 api URL）
    const orderDetail = await client.getOrderDetail({ ordernum })
    
    if (!orderDetail.list || orderDetail.list.length === 0) {
      return c.html(getSmsHtml('', '', '订单号无效或已过期', 'error'))
    }

    // 获取第一个订单项的 api URL
    const orderItem = orderDetail.list[0]
    
    if (!orderItem.api) {
      return c.html(getSmsHtml('', '', '该订单暂无验证码信息', 'error'))
    }

    // 代理请求上游 API
    const url = orderItem.api.includes('?') 
      ? `${orderItem.api}&format=json3` 
      : `${orderItem.api}?format=json3`

    const response = await fetch(url)

    if (!response.ok) {
      return c.html(getSmsHtml('', '', '网络错误，请稍后重试', 'error'))
    }

    const data = await response.json()

    // format=json3 返回格式
    if (data.code === 1 && data.data && data.data.sms) {
      // 收到验证码
      return c.html(getSmsHtml(
        data.data.tel || orderItem.tel,
        data.data.sms || '',
        data.data.expired_date || orderItem.end_time,
        'success'
      ))
    }

    // 暂未收到验证码，返回带 HTMX 轮询属性的 HTML
    return c.html(getSmsHtml('', '', '等待短信...', 'pending', true, ordernum))
  } catch (error) {
    return c.html(getSmsHtml('', '', '系统错误，请稍后重试', 'error'))
  }
})

/**
 * GET /api/sms/:ordernum/json
 * 获取短信验证码（JSON 格式）
 */
app.get('/:ordernum/json', async (c) => {
  try {
    const ordernum = c.req.param('ordernum')

    if (!ordernum) {
      return c.json<ApiResponse>({
        success: false,
        message: '请输入订单号',
      }, 400)
    }

    const client = createUpstreamClient({
      UPSTREAM_API_URL: c.env.UPSTREAM_API_URL,
      UPSTREAM_API_TOKEN: c.env.UPSTREAM_API_TOKEN,
    })

    // 获取订单详情（包含 api URL）
    const orderDetail = await client.getOrderDetail({ ordernum })
    
    if (!orderDetail.list || orderDetail.list.length === 0) {
      return c.json<ApiResponse>({
        success: false,
        message: '订单号无效或已过期',
      }, 400)
    }

    // 获取第一个订单项的 api URL
    const orderItem = orderDetail.list[0]
    
    if (!orderItem.api) {
      return c.json<ApiResponse>({
        success: false,
        message: '该订单暂无验证码信息',
      }, 400)
    }

    // 代理请求上游 API
    const url = orderItem.api.includes('?') 
      ? `${orderItem.api}&format=json3` 
      : `${orderItem.api}?format=json3`

    const response = await fetch(url)

    if (!response.ok) {
      return c.json<ApiResponse>({
        success: false,
        message: '网络错误',
      }, 500)
    }

    const data = await response.json()

    if (data.code === 1 && data.data && data.data.sms) {
      return c.json<ApiResponse>({
        success: true,
        message: '获取成功',
        data: {
          tel: data.data.tel || orderItem.tel,
          sms: data.data.sms || '',
          sms_time: data.data.sms_time || '',
          expired_date: data.data.expired_date || orderItem.end_time,
        },
      })
    }

    return c.json<ApiResponse>({
      success: false,
      message: '暂无短信',
    })
  } catch (error) {
    return c.json<ApiResponse>({
      success: false,
      message: '系统错误',
    }, 500)
  }
})

/**
 * 生成短信显示 HTML
 * 用于 HTMX 轮询
 */
function getSmsHtml(
  tel: string,
  sms: string,
  expiredDate: string,
  status: 'pending' | 'success' | 'error',
  enablePolling: boolean = false,
  token: string = ''
): string {
  if (status === 'success' && sms) {
    // 成功收到验证码 - 返回不含轮询属性的 HTML
    return `
      <div class="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <i class="fas fa-check-circle text-green-500"></i>
            <span class="text-green-500 text-sm font-medium">已收到验证码</span>
          </div>
          <span class="text-xs text-muted">${tel}</span>
        </div>
        <div class="bg-[var(--bg-primary)] rounded-lg p-4 mt-2">
          <p class="text-lg font-mono text-center break-all">${sms}</p>
        </div>
        <div class="flex items-center justify-between mt-3 text-xs text-muted">
          <span>有效期至: ${expiredDate}</span>
          <button 
            onclick="navigator.clipboard.writeText('${sms}').then(() => this.innerText='已复制!')" 
            class="px-2 py-1 rounded bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 transition-colors"
          >
            复制验证码
          </button>
        </div>
      </div>
    `
  }

  if (status === 'error') {
    return `
      <div class="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
        <div class="flex items-center gap-2 text-red-500">
          <i class="fas fa-exclamation-circle"></i>
          <span class="text-sm">${expiredDate || '发生错误'}</span>
        </div>
      </div>
    `
  }

  // 等待中 - 返回带轮询属性的 HTML
  const pollingAttr = enablePolling && token
    ? `hx-get="/api/sms/${token}" hx-trigger="every 3s" hx-swap="innerHTML"` 
    : ''

  return `
    <div class="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20" ${pollingAttr}>
      <div class="flex items-center gap-2 text-yellow-500">
        <i class="fas fa-spinner fa-spin"></i>
        <span class="text-sm">${expiredDate || '等待短信...'}</span>
      </div>
    </div>
  `
}

export default app