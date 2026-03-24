/**
 * Better Auth CLI 配置文件
 * 用于生成 Drizzle Schema
 * 
 * 运行: npx @better-auth/cli@latest generate --config src/adapters/auth/cli-config.ts --output src/adapters/auth/schema.ts -y
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

// 默认导出 auth 实例供 CLI 使用
export const auth = betterAuth({
  baseURL: "http://localhost:3000",
  basePath: "/api/better-auth",
  database: drizzleAdapter({} as any, {
    provider: "pg", // PostgreSQL
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
});

export default auth;