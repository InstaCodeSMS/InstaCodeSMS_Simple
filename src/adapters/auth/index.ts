/**
 * Better Auth 配置 - 修复版
 * 使用 text 类型 ID，兼容 Better Auth 默认行为
 * 修复 Cloudflare Workers 环境下的 Cookie 设置问题
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { Env } from "../../types/env";
import * as schema from "./schema";

/**
 * 创建 Better Auth 实例
 */
export function createAuth(env: Env) {
  const connectionString = env.HYPERDRIVE?.connectionString || env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error("[Better Auth] No database connection string available");
  }

  const sql = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  
  const db = drizzle(sql, { schema });

  // 判断是否为生产环境（通过 BASE_URL 是否为 https 判断）
  const isProduction = env.BASE_URL?.startsWith('https') || false;
  
  // 构建信任的 origins 列表
  const trustedOrigins = [
    "http://localhost:3000", // 本地开发
    "http://127.0.0.1:3000", // 本地开发（IP 形式）
    "https://instacode.cfd", // 生产域名
  ];
  
  // 如果 BASE_URL 存在且不在列表中，添加进去
  if (env.BASE_URL && !trustedOrigins.includes(env.BASE_URL)) {
    trustedOrigins.push(env.BASE_URL);
  }
  
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
      usePlural: true, // 使用复数表名（users, sessions, accounts）
    }),
    
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    
    baseURL: env.BASE_URL || env.SITE_URL || "http://localhost:3000",
    basePath: "/api/better-auth",
    trustedOrigins,
    
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60 * 24 * 7 // 7天
      },
      // 添加 session 配置
      expiresIn: 60 * 60 * 24 * 7, // 7天
      updateAge: 60 * 60 * 24, // 每天更新一次
    },
    
    advanced: {
      cookiePrefix: "better-auth",
      useSecureCookies: isProduction, // 生产环境使用 secure cookies
      // 关键：添加 cookie 配置
      cookieOptions: {
        sameSite: isProduction ? 'lax' : 'lax', // 开发和生产都使用 lax
        httpOnly: true,
        path: '/', // 确保 cookie 在所有路径可用
        maxAge: 60 * 60 * 24 * 7, // 7天
        ...(isProduction ? { secure: true } : {})
      }
    }
  });
}
