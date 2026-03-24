/**
 * Telegram Login / Mini App 数据验证
 * 基于 HMAC-SHA256 签名验证
 * 
 * @see https://core.telegram.org/widgets/login#checking-authorization
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
 */

/**
 * Telegram 用户信息
 */
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  user?: TelegramUser;
  authDate?: number;
  error?: string;
}

/**
 * 验证 Telegram initData
 * 
 * 工作原理：
 * 1. 从 initData 中提取 hash
 * 2. 将剩余参数按字母顺序排序并拼接
 * 3. 使用 Bot Token 生成密钥
 * 4. 计算签名并与 hash 比较
 * 
 * @param initData - Telegram WebApp.initData 或 Login Widget 返回的数据
 * @param botToken - Telegram Bot Token
 * @returns 验证结果，包含用户信息
 */
export async function validateTelegramInitData(
  initData: string,
  botToken: string
): Promise<ValidationResult> {
  try {
    if (!initData || !botToken) {
      return { valid: false, error: "Missing initData or botToken" };
    }

    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    const authDate = parseInt(params.get("auth_date") || "0");
    
    if (!hash) {
      return { valid: false, error: "Missing hash in initData" };
    }
    
    if (!authDate) {
      return { valid: false, error: "Missing auth_date in initData" };
    }
    
    // 检查 auth_date 是否过期（24小时）
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      return { valid: false, error: "initData expired (older than 24 hours)" };
    }
    
    // 构建数据检查串
    // 移除 hash，将剩余参数按字母顺序排序
    params.delete("hash");
    const dataCheckArr: string[] = [];
    params.forEach((value, key) => {
      dataCheckArr.push(`${key}=${value}`);
    });
    dataCheckArr.sort((a, b) => a.localeCompare(b));
    const dataCheckString = dataCheckArr.join("\n");
    
    // 计算 secret_key = HMAC-SHA256(bot_token, "WebAppData")
    // 使用 Web Crypto API（Cloudflare Workers 支持）
    const encoder = new TextEncoder();
    
    // 步骤1: 生成密钥
    const keyData = encoder.encode("WebAppData");
    const msgData = encoder.encode(botToken);
    
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const secretKey = await crypto.subtle.sign("HMAC", key, msgData);
    
    // 步骤2: 计算签名
    const signKey = await crypto.subtle.importKey(
      "raw",
      secretKey,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign(
      "HMAC", 
      signKey, 
      encoder.encode(dataCheckString)
    );
    
    // 步骤3: 转换为十六进制字符串
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    
    // 步骤4: 验证签名
    if (signatureHex === hash) {
      // 解析用户信息
      const userJson = params.get("user");
      const user = userJson ? JSON.parse(userJson) : null;
      return { valid: true, user, authDate };
    }
    
    return { valid: false, error: "Signature verification failed" };
  } catch (error) {
    console.error("[Telegram] Validation error:", error);
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * 验证 Telegram Login Widget 数据
 * 与 Mini App initData 验证类似，但使用不同的密钥生成方式
 * 
 * @param authData - Login Widget 返回的用户数据对象
 * @param botToken - Telegram Bot Token
 * @returns 验证结果
 */
export async function validateTelegramLoginWidget(
  authData: Record<string, string>,
  botToken: string
): Promise<ValidationResult> {
  try {
    const { hash, ...data } = authData;
    
    if (!hash) {
      return { valid: false, error: "Missing hash" };
    }
    
    // 构建数据检查串
    const dataCheckArr = Object.entries(data)
      .map(([key, value]) => `${key}=${value}`)
      .sort((a, b) => a.localeCompare(b));
    const dataCheckString = dataCheckArr.join("\n");
    
    // 计算 secret_key = SHA256(bot_token)
    // 注意：Login Widget 使用 SHA256，不是 HMAC
    const encoder = new TextEncoder();
    const secretKey = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(botToken)
    );
    
    // 计算签名
    const signKey = await crypto.subtle.importKey(
      "raw",
      secretKey,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      signKey,
      encoder.encode(dataCheckString)
    );
    
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    
    if (signatureHex === hash) {
      const authDate = parseInt(authData.auth_date || "0");
      
      // 检查是否过期
      const now = Math.floor(Date.now() / 1000);
      if (now - authDate > 86400) {
        return { valid: false, error: "Auth data expired" };
      }
      
      return { 
        valid: true, 
        user: {
          id: parseInt(authData.id || "0"),
          first_name: authData.first_name || "",
          last_name: authData.last_name,
          username: authData.username,
        },
        authDate
      };
    }
    
    return { valid: false, error: "Signature verification failed" };
  } catch (error) {
    console.error("[Telegram] Login widget validation error:", error);
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * 从 initData 中提取用户 ID（不验证）
 * 用于快速获取用户标识，但不应信任其他数据
 */
export function extractTelegramUserId(initData: string): number | null {
  try {
    const params = new URLSearchParams(initData);
    const userJson = params.get("user");
    if (userJson) {
      const user = JSON.parse(userJson);
      return user.id || null;
    }
    return null;
  } catch {
    return null;
  }
}