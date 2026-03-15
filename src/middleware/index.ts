/**
 * 中间件统一导出
 * 集中管理所有中间件，便于在主应用中使用
 */

export { requestLogger, logUpstreamStatus, logUserId } from './logger'
export { errorHandler, notFoundHandler } from './errorHandler'
export { csrfProtection, getCsrfToken } from './csrf'
export { apiKeyAuth, optionalAuth, getAuth, isAuthenticated } from './auth'
export type { AuthContext } from './auth'
export {
  createRateLimitMiddleware,
  apiRateLimit,
  strictRateLimit,
  relaxedRateLimit,
} from './rate-limit'
export type { RateLimitConfig } from './rate-limit'
export { noCache, PRIVATE_API_PATHS, isPrivateApiPath } from './no-cache'
