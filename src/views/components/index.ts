/**
 * 视图组件统一导出入口
 * 
 * Why: 统一导出独立的组件文件，方便其他模块导入
 * 所有组件实现都在独立文件中，避免代码重复
 */

export { default as Header } from './Header'
export { default as Footer } from './Footer'
export { default as Layout } from './Layout'