# 权益商城管理系统

## 项目简介
这是一个基于Vue 3 + Element Plus的权益商城管理系统前端项目。

## 最近更新

### 仪表盘优化 (2024-01-15)
- 将用户增长趋势模块改为从后端接口获取数据
- 新增API接口：`/user/getUserRegisterCount`
- 支持实时刷新用户注册统计数据
- 优化图表显示效果，支持响应式布局
- 添加加载状态和错误处理

#### 接口说明
- **接口地址**: `GET /user/getUserRegisterCount`
- **请求参数**: 无
- **响应数据**: 
  ```json
  {
    "code": 200,
    "data": [
      {
        "registerDate": "2024-01-15T10:00:00",
        "userCount": 25
      }
    ]
  }
  ```

#### 技术特性
- 使用ECharts绘制用户增长趋势图
- 支持窗口大小变化自动调整
- 集成Element Plus的加载状态和消息提示
- 响应式设计，支持移动端显示

## 技术栈
- Vue 3 (Composition API)
- Element Plus
- ECharts
- Axios
- Vue Router

## 开发环境
- Node.js >= 16
- npm >= 8

## 安装和运行
```bash
# 安装依赖
npm install

# 开发环境运行
npm run dev

# 构建生产版本
npm run build
```

## 项目结构
```
src/
├── api/          # API接口
├── components/   # 公共组件
├── views/        # 页面组件
├── router/       # 路由配置
└── config/       # 配置文件
```
