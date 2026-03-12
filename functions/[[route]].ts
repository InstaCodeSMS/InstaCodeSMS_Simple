/**
 * Cloudflare Pages Functions 入口
 * 使用 app.ts 中配置好的应用实例
 */

import { handle } from 'hono/cloudflare-pages'
import { app } from '../src/app'

// 导出为 Cloudflare Pages Functions 格式
export const onRequest = handle(app)