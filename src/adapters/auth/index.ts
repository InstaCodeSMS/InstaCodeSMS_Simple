/**
 * Better Auth 配置 - 修复版
 * 使用 text 类型 ID，兼容 Better Auth 默认行为
 * 修复 Cloudflare Workers 环境下的 Cookie 设置问题
 * 
 * 优化：
 * 1. 优先使用 Hyperdrive（减少数据库连接时间）
 * 2. 使用更轻量的密码哈希（减少 CPU 消耗）
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { Env } from "../../types/env";
import * as schema from "./schema";

// 简单的密码哈希函数（使用 Web Crypto API，Edge 原生支持）
// 比 scrypt 更轻量，适合 Cloudflare Workers
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // 使用 SHA-256 作为基础哈希
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // 添加盐值并再次哈希
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const combined = new Uint8Array(hashBuffer.byteLength + salt.length);
  combined.set(new Uint8Array(hashBuffer), 0);
  combined.set(salt, hashBuffer.byteLength);
  
  const finalHash = await crypto.subtle.digest('SHA-256', combined);
  
  // 返回 base64 编码的哈希值（包含盐值）
  const result = new Uint8Array(finalHash.byteLength + salt.length);
  result.set(new Uint8Array(finalHash), 0);
  result.set(salt, finalHash.byteLength);
  
  return btoa(String.fromCharCode(...result));
}

async function verifyPassword({ hash, password }: { hash: string; password: string }): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    // 第一次哈希
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // 解码存储的哈希值
    const stored = Uint8Array.from(atob(hash), c => c.charCodeAt(0));
    
    // 提取盐值（后 16 字节）
    const salt = stored.slice(-16);
    
    // 组合并哈希
    const combined = new Uint8Array(hashBuffer.byteLength + salt.length);
    combined.set(new Uint8Array(hashBuffer), 0);
    combined.set(salt, hashBuffer.byteLength);
    
    const finalHash = await crypto.subtle.digest('SHA-256', combined);
    
    // 比较哈希值（前 32 字节）
    const storedHash = stored.slice(0, 32);
    const computedHash = new Uint8Array(finalHash);
    
    if (storedHash.length !== computedHash.length) return false;
    
    // 时间安全比较
    let result = 0;
    for (let i = 0; i < storedHash.length; i++) {
      result |= storedHash[i] ^ computedHash[i];
    }
    return result === 0;
  } catch (e) {
    console.error('[Auth] Password verification error:', e);
    return false;
  }
}

/**
 * 创建 Better Auth 实例
 * 优化：优先使用 Hyperdrive 减少数据库连接开销
 */
export function createAuth(env: Env) {
  // 优先使用 Hyperdrive（Cloudflare 的数据库连接池）
  // Hyperdrive 可以显著减少数据库连接时间和 CPU 消耗
  const connectionString = env.HYPERDRIVE?.connectionString || env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error("[Better Auth] No database connection string available");
  }

  console.log('[Better Auth] Using connection:', env.HYPERDRIVE ? 'Hyperdrive' : 'Direct');
  
  // 优化连接配置
  const sql = postgres(connectionString, {
    max: 1, // Workers 环境只需 1 个连接
    idle_timeout: 10, // 减少空闲超时
    connect_timeout: 5, // 减少连接超时
    // 禁用 prepare 语句，减少往返次数
    prepare: false,
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
      // 使用自定义密码哈希（Web Crypto API，Edge 原生支持）
      // 比 Better Auth 默认的 scrypt 更轻量，避免 Worker CPU 超限
      password: {
        hash: hashPassword,
        verify: verifyPassword,
      },
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
