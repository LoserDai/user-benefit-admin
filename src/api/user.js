import axios from 'axios'
import { config } from '@/config'

// 创建axios实例
const api = axios.create({
  baseURL: config.apiBaseURL,
  timeout: config.timeout,
  withCredentials: true, // 支持跨域Cookie
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // withCredentials: true 会自动处理Cookie，这里可以添加其他认证信息
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    // 对于登录接口，返回完整响应以获取headers
    if (response.config.url.includes('/adminLogin')) {
      return response
    }
    // 其他接口返回data
    return response.data
  },
  error => {
    console.error('API请求错误:', error)
    return Promise.reject(error)
  }
)

// 管理员登录
export const adminLogin = (data) => {
  return api.post('/user/adminLogin', data)
}

// 获取当前登录用户信息
export const getCurrentUser = () => {
  return api.get('/user/current')
}

// 用户登出
export const userLogout = () => {
  return api.post('/user/logout')
}

export default api
