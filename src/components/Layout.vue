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
        <!-- 仪表盘 -->
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        
        <!-- 用户管理 -->
        <el-menu-item index="/user">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
        
        <!-- 账户管理子菜单 - 放在用户管理下面 -->
        <el-sub-menu index="/account">
          <template #title>
            <el-icon><Wallet /></el-icon>
            <span>账户管理</span>
          </template>
          <el-menu-item index="/account/query">账户查询</el-menu-item>
          <el-menu-item index="/account/transactions">收支明细</el-menu-item>
        </el-sub-menu>
        
        <!-- 权益商品管理子菜单 -->
        <el-sub-menu index="/benefit">
          <template #title>
            <el-icon><Present /></el-icon>
            <span>权益商品管理</span>
          </template>
          <el-menu-item index="/benefit/products">权益产品管理</el-menu-item>
          <el-menu-item index="/benefit/packages">权益包管理</el-menu-item>
          <el-menu-item index="/benefit/activities">权益活动管理</el-menu-item>
        </el-sub-menu>
        
        <!-- 订单管理 -->
        <el-menu-item index="/order">
          <el-icon><List /></el-icon>
          <template #title>订单管理</template>
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
            <el-breadcrumb-item v-if="route.path.startsWith('/benefit/')">权益商品管理</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.path.startsWith('/account/')">账户管理</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
                 <div class="header-right">
           <el-dropdown>
             <span class="user-info">
               <el-avatar :size="32" :src="userInfo.avatar" />
               <span class="username">{{ userInfo.nickname }}</span>
             </span>
             <template #dropdown>
               <el-dropdown-menu>
                 <el-dropdown-item @click="showUserProfile">个人信息</el-dropdown-item>
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

   <!-- 个人信息对话框 -->
   <el-dialog
     v-model="userProfileVisible"
     title="个人信息"
     width="600px"
     :close-on-click-modal="false"
   >
     <div v-loading="profileLoading">
       <el-descriptions :column="2" border v-if="currentUserProfile">
         <el-descriptions-item label="用户ID">{{ currentUserProfile.id }}</el-descriptions-item>
         <el-descriptions-item label="账号">{{ currentUserProfile.account }}</el-descriptions-item>
                   <el-descriptions-item label="性别">{{ getGenderLabel(currentUserProfile.gender) }}</el-descriptions-item>
         <el-descriptions-item label="邮箱">{{ currentUserProfile.email || '未设置' }}</el-descriptions-item>
         <el-descriptions-item label="手机号">{{ currentUserProfile.phone || '未设置' }}</el-descriptions-item>
         <el-descriptions-item label="角色">{{ currentUserProfile.role || '管理员' }}</el-descriptions-item>
         <el-descriptions-item label="状态">
           <el-tag :type="currentUserProfile.status === 'ACTIVE' ? 'success' : 'danger'">
             {{ currentUserProfile.status === 'ACTIVE' ? '正常' : '禁用' }}
           </el-tag>
         </el-descriptions-item>
         <el-descriptions-item label="创建时间">{{ currentUserProfile.createTime || '未知' }}</el-descriptions-item>
         <el-descriptions-item label="修改时间">{{ currentUserProfile.updateTime || '未知' }}</el-descriptions-item>
         <el-descriptions-item label="头像" :span="2">
           <el-avatar 
             :size="80" 
             :src="currentUserProfile.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'" 
           />
         </el-descriptions-item>
       </el-descriptions>
       
       <div v-else-if="!profileLoading" class="no-data">
         <el-empty description="暂无用户信息" />
       </div>
     </div>
     
     <template #footer>
       <el-button @click="userProfileVisible = false">关闭</el-button>
       <el-button type="primary" @click="refreshUserProfile">刷新</el-button>
     </template>
   </el-dialog>
 </template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
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

// 用户信息
const userInfo = ref({
  username: '管理员',
  nickname: '管理员', // 这个会在fetchCurrentUser中被更新为account
  avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
})

// 个人信息对话框相关
const userProfileVisible = ref(false)
const profileLoading = ref(false)
const currentUserProfile = ref(null)

const menuRoutes = [
  { path: '/dashboard', meta: { title: '仪表盘', icon: 'Odometer' } },
  { path: '/user', meta: { title: '用户管理', icon: 'User' } },
  { path: '/benefit', meta: { title: '权益商品管理', icon: 'Present' } },
  { path: '/order', meta: { title: '订单管理', icon: 'List' } }
]

const currentPageTitle = computed(() => {
  // 处理二级菜单的标题显示
  if (route.path.startsWith('/account/')) {
    if (route.path === '/account/query') return '账户查询'
    if (route.path === '/account/transactions') return '收支明细'
  }
  
  // 处理权益商品管理的子菜单标题显示
  if (route.path.startsWith('/benefit/')) {
    if (route.path === '/benefit/products') return '权益产品管理'
    if (route.path === '/benefit/packages') return '权益包管理'
    if (route.path === '/benefit/activities') return '权益活动管理'
  }
  
  // 根据当前路由路径返回标题
  const titleMap = {
    '/dashboard': '仪表盘',
    '/user': '用户管理',
    '/benefit': '权益商品管理',
    '/order': '订单管理'
  }
  
  return titleMap[route.path] || ''
})

const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

const handleMenuClick = (route) => {
  router.push(route.path)
}

// 性别映射函数
const getGenderLabel = (gender) => {
  if (gender === 1) return '男性'
  if (gender === 0) return '女性'
  if (gender !== null && gender !== undefined) return 'Alien'
  return '未设置'
}

// 获取当前用户信息
const fetchCurrentUser = async () => {
  try {
    const { getCurrentUser } = await import('@/api/user')
    const response = await getCurrentUser()
    
    if (response.code === 200 && response.data) {
      userInfo.value = {
        username: response.data.account || '管理员',
        nickname: response.data.account || '管理员', // 使用account作为显示名称
        avatar: response.data.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
      }
      
      // 更新localStorage中的用户信息
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    // 如果获取失败，尝试从localStorage读取
    const storedUserInfo = localStorage.getItem('userInfo')
    if (storedUserInfo) {
      try {
        const parsedInfo = JSON.parse(storedUserInfo)
        userInfo.value = {
          ...parsedInfo,
          nickname: parsedInfo.username || parsedInfo.account || '管理员' // 优先使用username或account
        }
      } catch (e) {
        console.error('解析用户信息失败:', e)
      }
    }
  }
}

// 显示个人信息对话框
const showUserProfile = async () => {
  userProfileVisible.value = true
  await refreshUserProfile()
}

// 刷新用户个人信息
const refreshUserProfile = async () => {
  profileLoading.value = true
  try {
    const { getCurrentUser } = await import('@/api/user')
    const response = await getCurrentUser()
    
    if (response.code === 200 && response.data) {
      currentUserProfile.value = response.data
    } else {
      ElMessage.error(response.message || '获取用户信息失败')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败，请稍后重试')
  } finally {
    profileLoading.value = false
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用后端登出接口
    try {
      const { userLogout } = await import('@/api/user')
      const response = await userLogout()
      
      if (response.code === 200) {
        // 登出成功，清除本地状态
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('userInfo')
        
        ElMessage.success('退出成功')
        router.push('/login')
      } else {
        ElMessage.error(response.message || '退出失败')
      }
    } catch (apiError) {
      console.error('调用登出接口失败:', apiError)
      // 即使接口调用失败，也要清除本地状态
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('userInfo')
      
      ElMessage.warning('退出成功（本地状态已清除）')
      router.push('/login')
    }
  } catch (cancelError) {
    // 用户取消退出
    console.log('用户取消退出登录')
  }
}

// 组件挂载时获取用户信息
onMounted(() => {
  fetchCurrentUser()
})
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

/* 子菜单样式 */
.sidebar-menu .el-sub-menu .el-menu-item {
  background-color: #263445 !important;
  color: #bfcbd9 !important;
}

.sidebar-menu .el-sub-menu .el-menu-item:hover {
  background-color: #1890ff !important;
  color: #fff !important;
}

.sidebar-menu .el-sub-menu .el-menu-item.is-active {
  background-color: #409EFF !important;
  color: #fff !important;
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

/* 个人信息对话框样式 */
.no-data {
  text-align: center;
  padding: 40px 0;
}

.el-descriptions {
  margin-bottom: 20px;
}

.el-descriptions__label {
  font-weight: 600;
  color: #606266;
}

.el-descriptions__content {
  color: #303133;
}
</style>
