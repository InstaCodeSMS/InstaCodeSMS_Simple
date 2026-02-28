/**
 * Hono RPC 客户端
 * 提供类型安全的 API 调用
 */

import { hc } from 'hono/client'
import type rpcApp from '../routes/rpc'

export const rpcClient = hc<typeof rpcApp>('/rpc')

export type RpcClient = typeof rpcClient
