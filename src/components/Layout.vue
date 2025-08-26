<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar">
      <div class="logo-container">
        <img src="/vite.svg" alt="Logo" class="logo" />
        <span v-show="!isCollapse" class="logo-text">权益商城管理</span>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        router
        class="sidebar-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item 
          v-for="route in menuRoutes" 
          :key="route.path"
          :index="route.path"
          @click="handleMenuClick(route)"
        >
          <el-icon><component :is="route.meta.icon" /></el-icon>
          <template #title>{{ route.meta.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <el-button 
            type="text" 
            @click="toggleSidebar"
            class="collapse-btn"
          >
            <el-icon><Fold v-if="!isCollapse" /><Expand v-else /></el-icon>
          </el-button>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-dropdown>
            <span class="user-info">
              <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
              <span class="username">管理员</span>
            </span>
            <template #dropdown>
                             <el-dropdown-menu>
                 <el-dropdown-item>个人信息</el-dropdown-item>
                 <el-dropdown-item>修改密码</el-dropdown-item>
                 <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
               </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区域 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  Odometer, 
  User, 
  Wallet, 
  Present, 
  List,
  Fold,
  Expand
} from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const isCollapse = ref(false)
const activeMenu = computed(() => route.path)

const menuRoutes = [
  { path: '/dashboard', meta: { title: '仪表盘', icon: 'Odometer' } },
  { path: '/user', meta: { title: '用户管理', icon: 'User' } },
  { path: '/account', meta: { title: '账户管理', icon: 'Wallet' } },
  { path: '/benefit', meta: { title: '权益商品管理', icon: 'Present' } },
  { path: '/order', meta: { title: '订单管理', icon: 'List' } }
]

const currentPageTitle = computed(() => {
  const currentRoute = menuRoutes.find(r => r.path === route.path)
  return currentRoute ? currentRoute.meta.title : ''
})

const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

const handleMenuClick = (route) => {
  router.push(route.path)
}

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm(
    '确定要退出登录吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 清除登录状态
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userInfo')
    
    ElMessage.success('退出成功')
    router.push('/login')
  })
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100vw;
  display: flex;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
  flex-shrink: 0;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b2f3a;
  padding: 0 16px;
}

.logo {
  width: 32px;
  height: 32px;
}

.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  margin-left: 12px;
  white-space: nowrap;
}

.sidebar-menu {
  border: none;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-btn {
  margin-right: 20px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin-left: 8px;
  color: #333;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  height: calc(100vh - 60px);
}

/* 确保主容器正确布局 */
.el-container {
  height: 100vh;
  width: 100%;
}

.el-aside {
  height: 100vh;
}

.el-main {
  height: calc(100vh - 60px);
  overflow-y: auto;
}
</style>
