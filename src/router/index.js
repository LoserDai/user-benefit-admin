import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '仪表盘', icon: 'Odometer', requiresAuth: true }
  },
  {
    path: '/user',
    name: 'UserManagement',
    component: () => import('../views/UserManagement.vue'),
    meta: { title: '用户管理', icon: 'User', requiresAuth: true }
  },
  {
    path: '/account',
    name: 'AccountManagement',
    redirect: '/account/query',
    meta: { title: '账户管理', icon: 'Wallet', requiresAuth: true },
    children: [
      {
        path: 'query',
        name: 'AccountQuery',
        component: () => import('../views/AccountQuery.vue'),
        meta: { title: '账户查询', requiresAuth: true }
      },
      {
        path: 'transactions',
        name: 'AccountTransactions',
        component: () => import('../views/AccountTransactions.vue'),
        meta: { title: '收支明细', requiresAuth: true }
      }
    ]
  },
  {
    path: '/benefit',
    name: 'BenefitManagement',
    component: () => import('../views/BenefitManagement.vue'),
    meta: { title: '权益商品管理', icon: 'Present', requiresAuth: true }
  },
  {
    path: '/order',
    name: 'OrderManagement',
    component: () => import('../views/OrderManagement.vue'),
    meta: { title: '订单管理', icon: 'List', requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
