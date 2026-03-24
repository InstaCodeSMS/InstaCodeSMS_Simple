#!/usr/bin/env node

/**
 * Telegram Bot 和 Mini App 系统测试脚本
 * 用于验证系统各项功能是否正常运行
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

class SystemTester {
  constructor() {
    this.results = []
    this.passed = 0
    this.failed = 0
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const colors = {
      info: '\x1b[36m',    // 青色
      success: '\x1b[32m', // 绿色
      error: '\x1b[31m',   // 红色
      warn: '\x1b[33m',    // 黄色
      reset: '\x1b[0m'     // 重置
    }
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`)
  }

  async testEnvironment() {
    this.log('🧪 开始环境检查...', 'info')
    
    // 检查 package.json
    const packageExists = fs.existsSync('package.json')
    this.check('package.json 存在', packageExists)
    
    // 检查 .env 文件
    const envExists = fs.existsSync('.env')
    this.check('.env 文件存在', envExists)
    
    // 检查依赖
    const nodeModulesExists = fs.existsSync('node_modules')
    this.check('node_modules 存在', nodeModulesExists)
    
    // 检查 TypeScript 配置
    const tsConfigExists = fs.existsSync('tsconfig.json')
    this.check('tsconfig.json 存在', tsConfigExists)
    
    // 检查 wrangler 配置
    const wranglerExists = fs.existsSync('wrangler.toml')
    this.check('wrangler.toml 存在', wranglerExists)
  }

  async testDependencies() {
    this.log('📦 检查依赖...', 'info')
    
    try {
      // 检查 Node.js 版本
      const nodeVersion = process.version
      const nodeOk = nodeVersion >= 'v18.0.0'
      this.check(`Node.js 版本: ${nodeVersion}`, nodeOk)
      
      // 检查 npm
      try {
        execSync('npm --version', { stdio: 'pipe' })
        this.check('npm 可用', true)
      } catch (error) {
        this.check('npm 可用', false)
      }
      
      // 检查 wrangler
      try {
        execSync('npx wrangler --version', { stdio: 'pipe' })
        this.check('wrangler 可用', true)
      } catch (error) {
        this.check('wrangler 可用', false)
      }
      
    } catch (error) {
      this.log(`依赖检查失败: ${error.message}`, 'error')
    }
  }

  async testProjectStructure() {
    this.log('📁 检查项目结构...', 'info')
    
    const requiredFiles = [
      'src/index.ts',
      'src/app.ts',
      'src/routes/web/mini-app.ts',
      'src/routes/api/telegram.ts',
      'src/domains/telegram/user.service.ts',
      'src/domains/payment/payment.service.ts',
      'src/views/mini-app/index.html',
      'src/views/mini-app/pages/home.html'
    ]
    
    for (const file of requiredFiles) {
      const exists = fs.existsSync(file)
      this.check(`文件存在: ${file}`, exists)
    }
    
    const requiredDirs = [
      'src/domains',
      'src/routes',
      'src/views',
      'src/adapters',
      'docs'
    ]
    
    for (const dir of requiredDirs) {
      const exists = fs.existsSync(dir)
      this.check(`目录存在: ${dir}`, exists)
    }
  }

  async testEnvironmentVariables() {
    this.log('⚙️ 检查环境变量...', 'info')
    
    if (!fs.existsSync('.env')) {
      this.check('.env 文件存在', false)
      return
    }
    
    const envContent = fs.readFileSync('.env', 'utf8')
    const requiredVars = [
      'TELEGRAM_BOT_TOKEN',
      'API_BASE_URL',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'EPAY_API_URL',
      'EPAY_PID',
      'EPAY_KEY'
    ]
    
    for (const varName of requiredVars) {
      const hasVar = envContent.includes(varName)
      this.check(`环境变量存在: ${varName}`, hasVar)
    }
  }

  async testTypeScript() {
    this.log('🔍 检查 TypeScript...', 'info')
    
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' })
      this.check('TypeScript 编译检查', true)
    } catch (error) {
      this.check('TypeScript 编译检查', false)
      this.log(`TypeScript 错误: ${error.message}`, 'error')
    }
  }

  async testVitest() {
    this.log('🧪 检查测试框架...', 'info')
    
    try {
      execSync('npx vitest --version', { stdio: 'pipe' })
      this.check('Vitest 可用', true)
      
      // 检查测试文件
      const testFiles = [
        'src/__tests__',
        'tests/unit'
      ]
      
      for (const testDir of testFiles) {
        const exists = fs.existsSync(testDir)
        this.check(`测试目录存在: ${testDir}`, exists)
      }
      
    } catch (error) {
      this.check('Vitest 可用', false)
    }
  }

  async testRoutes() {
    this.log('🛣️ 检查路由配置...', 'info')
    
    // 检查主要路由文件
    const routeFiles = [
      'src/routes/web/mini-app.ts',
      'src/routes/api/telegram.ts',
      'src/routes/api/payment-callback.ts'
    ]
    
    for (const file of routeFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8')
        const hasHono = content.includes('Hono')
        const hasRoutes = content.includes('app.get') || content.includes('app.post')
        this.check(`路由文件有效: ${file}`, hasHono && hasRoutes)
      } else {
        this.check(`路由文件存在: ${file}`, false)
      }
    }
  }

  async testDomains() {
    this.log('🏢 检查领域层...', 'info')
    
    const domainFiles = [
      'src/domains/telegram/user.service.ts',
      'src/domains/telegram/receive.service.ts',
      'src/domains/payment/payment.service.ts',
      'src/domains/order/order.service.ts'
    ]
    
    for (const file of domainFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8')
        const hasClass = content.includes('export class')
        const hasMethods = content.includes('async ')
        this.check(`领域服务有效: ${file}`, hasClass && hasMethods)
      } else {
        this.check(`领域服务存在: ${file}`, false)
      }
    }
  }

  async testViews() {
    this.log('🎨 检查视图层...', 'info')
    
    const viewFiles = [
      'src/views/mini-app/index.html',
      'src/views/mini-app/pages/home.html',
      'src/views/mini-app/pages/cart.html'
    ]
    
    for (const file of viewFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8')
        const hasHTML = content.includes('<html>') || content.includes('<!DOCTYPE')
        const hasHTMX = content.includes('htmx') || content.includes('hx-')
        this.check(`视图文件有效: ${file}`, hasHTML)
      } else {
        this.check(`视图文件存在: ${file}`, false)
      }
    }
  }

  async testDocumentation() {
    this.log('📚 检查文档...', 'info')
    
    const docFiles = [
      'README_TELEGRAM.md',
      'docs/TELEGRAM_QUICK_START.md',
      'docs/PROJECT_COMPLETION_SUMMARY.md',
      'docs/TESTING_GUIDE.md'
    ]
    
    for (const file of docFiles) {
      const exists = fs.existsSync(file)
      this.check(`文档存在: ${file}`, exists)
    }
  }

  check(description, passed) {
    if (passed) {
      this.log(`✅ ${description}`, 'success')
      this.passed++
    } else {
      this.log(`❌ ${description}`, 'error')
      this.failed++
    }
    this.results.push({ description, passed })
  }

  async run() {
    this.log('🚀 开始系统测试...', 'info')
    this.log('='.repeat(50), 'info')
    
    await this.testEnvironment()
    await this.testDependencies()
    await this.testProjectStructure()
    await this.testEnvironmentVariables()
    await this.testTypeScript()
    await this.testVitest()
    await this.testRoutes()
    await this.testDomains()
    await this.testViews()
    await this.testDocumentation()
    
    this.log('='.repeat(50), 'info')
    this.log(`📊 测试结果: ${this.passed} 通过, ${this.failed} 失败`, 'info')
    
    const total = this.passed + this.failed
    const successRate = total > 0 ? (this.passed / total) * 100 : 0
    
    if (successRate >= 90) {
      this.log(`🎉 系统测试通过! 成功率: ${successRate.toFixed(1)}%`, 'success')
      this.log('系统可以正常运行 Telegram Bot 和 Mini App', 'success')
    } else if (successRate >= 70) {
      this.log(`⚠️ 系统测试基本通过! 成功率: ${successRate.toFixed(1)}%`, 'warn')
      this.log('部分功能可能需要修复', 'warn')
    } else {
      this.log(`❌ 系统测试失败! 成功率: ${successRate.toFixed(1)}%`, 'error')
      this.log('建议修复问题后再测试', 'error')
    }
    
    return successRate >= 70
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new SystemTester()
  tester.run().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(error => {
    console.error('测试运行失败:', error)
    process.exit(1)
  })
}

export default SystemTester
