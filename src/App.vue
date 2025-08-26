<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Layout from './components/Layout.vue'
import Login from './views/Login.vue'

const route = useRoute()
const router = useRouter()
const isLoggedIn = ref(false)

// 检查登录状态
const checkLoginStatus = () => {
  isLoggedIn.value = localStorage.getItem('isLoggedIn') === 'true'
}

// 处理路由逻辑
const handleRouteLogic = () => {
  checkLoginStatus()
  
  // 如果未登录且当前路由需要认证，跳转到登录页
  if (!isLoggedIn.value && route.meta?.requiresAuth) {
    console.log('路由需要认证，跳转到登录页')
    router.push('/login')
    return
  }
  
  // 如果已登录且当前在登录页，跳转到仪表盘
  if (isLoggedIn.value && route.path === '/login') {
    console.log('已登录，跳转到仪表盘')
    router.push('/dashboard')
    return
  }
  
  // 如果未登录且在根路径，跳转到登录页
  if (!isLoggedIn.value && route.path === '/') {
    console.log('未登录且在根路径，跳转到登录页')
    router.push('/login')
    return
  }
}

onMounted(() => {
  checkLoginStatus()
  
  // 如果未登录，跳转到登录页
  if (!isLoggedIn.value) {
    console.log('未登录，跳转到登录页')
    router.push('/login')
  } else {
    console.log('已登录，显示主布局')
  }
  
  // 监听localStorage变化
  window.addEventListener('storage', checkLoginStatus)
})

// 监听路由变化
watch(route, handleRouteLogic, { immediate: true })

// 计算是否应该显示登录页面
const shouldShowLogin = computed(() => {
  return route.path === '/login' || (!isLoggedIn.value && route.meta?.requiresAuth)
})
</script>

<template>
  <div id="app">
    <Login v-if="shouldShowLogin" />
    <Layout v-else />
  </div>
</template>

<style>
#app {
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
}

html {
  margin: 0;
  padding: 0;
}
</style>
