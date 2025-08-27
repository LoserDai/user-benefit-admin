// 环境配置
export const config = {
  // API基础地址
  apiBaseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  
  // 请求超时时间
  timeout: 10000,
  
  // 其他配置
  appName: '权益商城管理系统'
}

export default config
