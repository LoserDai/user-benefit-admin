<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <img src="/vite.svg" alt="Logo" class="logo" />
        <h2 class="title">权益商城管理系统</h2>
        <p class="subtitle">管理员登录</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginFormRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-btn"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p class="tips">默认账号：admin / 123456</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()

// 登录表单
const loginForm = reactive({
  username: '',
  password: ''
})

// 表单验证规则
const loginFormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// 表单引用
const loginFormRef = ref(null)
const loading = ref(false)

// 处理登录
const handleLogin = async () => {
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    // 模拟登录API调用
    setTimeout(() => {
      // 这里应该是真实的登录验证逻辑
      if (loginForm.username === 'admin' && loginForm.password === '123456') {
        // 登录成功，保存登录状态
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('userInfo', JSON.stringify({
          username: loginForm.username,
          nickname: '管理员',
          avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
        }))
        
        ElMessage.success('登录成功')
        router.push('/dashboard')
      } else {
        ElMessage.error('用户名或密码错误')
      }
      loading.value = false
    }, 1000)
    
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.login-box {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  padding: 60px;
  width: 100%;
  max-width: 500px;
  min-width: 400px;
  margin: 0 auto;
}

.login-header {
  text-align: center;
  margin-bottom: 50px;
}

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: 30px;
}

.title {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 12px 0;
  letter-spacing: 1px;
}

.subtitle {
  font-size: 16px;
  color: #909399;
  margin: 0;
  font-weight: 400;
}

.login-form {
  margin-bottom: 40px;
}

.login-form .el-form-item {
  margin-bottom: 25px;
}

.login-form .el-input {
  height: 50px;
}

.login-form .el-input__wrapper {
  border-radius: 8px;
  border: 2px solid #e4e7ed;
  transition: all 0.3s ease;
}

.login-form .el-input__wrapper:hover {
  border-color: #409eff;
}

.login-form .el-input__wrapper.is-focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.login-btn {
  width: 100%;
  height: 50px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #409eff 0%, #36a3f7 100%);
  border: none;
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(64, 158, 255, 0.3);
}

.login-btn:active {
  transform: translateY(0);
}

.login-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.tips {
  font-size: 14px;
  color: #c0c4cc;
  margin: 0;
  font-style: italic;
  background: #f8f9fa;
  padding: 8px 16px;
  border-radius: 20px;
  display: inline-block;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-container {
    padding: 20px;
  }
  
  .login-box {
    padding: 40px 30px;
    min-width: auto;
    max-width: 100%;
  }
  
  .title {
    font-size: 24px;
  }
  
  .subtitle {
    font-size: 14px;
  }
  
  .logo {
    width: 60px;
    height: 60px;
  }
}
</style>
