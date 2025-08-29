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
    // 对于FormData请求，移除Content-Type让浏览器自动设置
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    
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

// 获取用户注册统计数据（仪表盘）
// UserDashVo: { registerDate: LocalDateTime, userCount: Integer }
export const getUserRegisterCount = () => {
  return api.get('/user/getUserRegisterCount')
}

// 获取订单统计数据（仪表盘）
// OrderDashVo: { orderStatus: Integer, orderCount: Integer }
export const getOrderCount = () => {
  return api.get('/orderMain/getOrderCount')
}

// 获取仪表盘统计数据
// DashVo: { userCount: Integer, productCount: Integer, orderMainCount: Integer, orderPointsCount: Integer }
export const getCount = () => {
  return api.post('/user/getCount')
}

// 查询订单列表
// OrderMainRequest: 分页查询参数
// PageResult<OrderMainVo>: 分页结果
export const queryOrderMain = (request) => {
  return api.post('/orderMain/queryOrderMain', request)
}

// 分页查询用户列表
// UserRequest: 用户查询参数
// PageResult<UserVo>: 分页结果
export const pageQueryUser = (request) => {
  return api.post('/user/pageQueryUser', request)
}

// 删除用户
// User: 用户信息（只需要id）
// BaseResponse<Integer>: 删除结果
export const deleteUser = (user) => {
  return api.post('/user/delete', user)
}

// 更新用户
// User: 用户信息
// BaseResponse<Integer>: 更新结果
export const updateUser = (user) => {
  return api.post('/user/update', user)
}

// 查询产品列表
// BenefitProductRequest: 产品查询参数
// PageResult<BenefitProduct>: 分页结果
export const queryAllProduct = (request) => {
  return api.post('/product/queryAllProduct', request)
}

// 新增产品
// FormData: 包含文件和产品信息的表单数据
// BaseResponse: 新增结果
export const insertProduct = (formData) => {
  return api.post('/product/insertProduct', formData)
}

// 用户注册
// UserRegisterRequest: 用户注册请求
// BaseResponse<User>: 注册结果
export const userRegister = (userRegisterRequest) => {
  return api.post('/user/register', userRegisterRequest)
}

// 分页查询积分账户信息
// PointsRequest: 积分查询参数
// PageResult<PointsVo>: 分页结果
export const pageQueryPoints = (request) => {
  return api.post('/points/pageQuery', request)
}

// 积分账户调账
// BenefitPointsRequest: 调账请求参数
// BaseResponse<Integer>: 调账结果
export const modifyBalance = (request) => {
  return api.post('/points/modifyBalance', request)
}

// 分页查询交易流水
// PointTransactionRequest: 交易查询参数
// PageResult<PointTransactionVo>: 分页结果
export const queryAllPointTransaction = (request) => {
  return api.post('/pointTransaction/queryAllPointTransaction', request)
}

export default api
