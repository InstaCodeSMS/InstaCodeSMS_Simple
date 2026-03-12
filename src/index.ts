/**
 * 应用入口文件
 * 直接导出 app.ts 中配置好的应用实例
 */

import { app } from './app'

// 导出为 Cloudflare Workers 格式
export default app