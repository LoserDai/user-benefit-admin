import axios from 'axios'
import { config } from '@/config'

// 创建axios实例
const api = axios.create({
  baseURL: config.apiBaseURL,
  timeout: config.timeout,
  withCredentials: true, // 支持跨域Cookie
  headers: {
    'Content-Type': 'application/json'
  },
  // 确保FormData正确处理
  transformRequest: [function (data, headers) {
    // 如果是FormData，不进行任何转换
    if (data instanceof FormData) {
      return data
    }
    // 其他数据转换为JSON
    return JSON.stringify(data)
  }]
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 对于FormData请求，移除Content-Type让浏览器自动设置
    if (config.data instanceof FormData) {
      // 完全移除Content-Type，让浏览器自动设置multipart/form-data和boundary
      delete config.headers['Content-Type']
      delete config.headers['content-type']
      // 确保FormData请求不会被错误地设置Content-Type
      config.headers = config.headers || {}
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

// 取消订单
// CancelOrderRequest: 取消订单请求参数
// BaseResponse<Integer>: 取消结果
export const cancelOrderMain = (request) => {
  return api.post('/orderMain/cancelOrderMain', request)
}

// 订单发货
// ShippingOrderMainRequest: 订单发货请求参数
// BaseResponse<Integer>: 发货结果
export const shippingOrderMain = (request) => {
  return api.post('/orderMain/shippingOrderMain', request)
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
  return api.post('/product/insertProduct', formData, {
    // 让浏览器自动设置multipart/form-data及boundary
  })
}

// 更新产品
// FormData: 包含文件和产品信息的表单数据
// BaseResponse: 更新结果
export const updateProduct = (formData) => {
  return api.post('/product/updateProduct', formData, {
    // 让浏览器自动设置multipart/form-data及boundary
  })
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

// 查询权益包
// BenefitPackageRequest: 权益包查询参数
// PageResult<BenefitPackageVo>: 分页结果
export const queryPackage = (request) => {
  return api.post('/package/queryPackage', request)
}

// 保存权益包
// FormData: 包含文件和权益包信息的表单数据
// BaseResponse<Integer>: 保存结果
export const savePackage = (formData) => {
  return api.post('/package/savePackage', formData, {
    // 让浏览器自动设置multipart/form-data及boundary
  })
}

// 更新权益包
// FormData: 包含文件和权益包信息的表单数据
// BaseResponse<Integer>: 更新结果
export const updatePackage = (formData) => {
  return api.post('/package/updatePackage', formData, {
    // 让浏览器自动设置multipart/form-data及boundary
  })
}

// 分页查询权益活动
// BenefitActivityRequest: 权益活动查询参数
// PageResult<BenefitActivityVo>: 分页结果
export const queryActivityList = (request) => {
  return api.post('/activity/queryActivityList', request)
}

// 保存权益活动
// FormData: 包含文件和活动信息的表单数据
// BaseResponse<Integer>: 保存结果
export const saveActivity = (formData) => {
  return api.post('/activity/saveActivity', formData, {
    // 让浏览器自动设置multipart/form-data及boundary
  })
}

// 更新权益活动
export const updateActivity = (request) => {
  return api.post('/activity/updateActivity', request)
}

export default api
