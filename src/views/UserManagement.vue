<template>
  <div class="user-management">
    <!-- 搜索和操作栏 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入用户名或手机号"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.status" placeholder="用户状态" clearable>
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="inactive" />
            <el-option label="待激活" value="pending" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.userType" placeholder="用户类型" clearable>
            <el-option label="普通用户" value="normal" />
            <el-option label="VIP用户" value="vip" />
            <el-option label="企业用户" value="enterprise" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-col>
        <el-col :span="4">
          <el-button type="success" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            添加用户
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 用户列表 -->
    <el-card class="table-card">
      <el-table :data="userList" stripe v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="username" label="用户名" width="120" align="center" />
        <el-table-column prop="nickname" label="昵称" width="120" align="center" />
        <el-table-column prop="phone" label="手机号" width="140" align="center" />
        <el-table-column prop="email" label="邮箱" width="200" align="center" />
        <el-table-column prop="userType" label="用户类型" width="120" align="center">
          <template #default="scope">
            <el-tag :type="getUserTypeTag(scope.row.userType)">
              {{ getUserTypeLabel(scope.row.userType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="avatar" label="头像" width="100" align="center">
          <template #default="scope">
            <el-avatar :src="scope.row.avatar" />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="注册时间" width="160" align="center" />
        <el-table-column prop="lastLoginTime" label="最后登录" width="160" align="center" />
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDelete(scope.row)"
            >删除</el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === 'active' ? 'warning' : 'success'"
              @click="handleToggleStatus(scope.row)"
            >
              {{ scope.row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 用户表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userFormRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="userForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="用户类型" prop="userType">
          <el-select v-model="userForm.userType" placeholder="请选择用户类型">
            <el-option label="普通用户" value="normal" />
            <el-option label="VIP用户" value="vip" />
            <el-option label="企业用户" value="enterprise" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="userForm.status" placeholder="请选择状态">
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="inactive" />
            <el-option label="待激活" value="pending" />
          </el-select>
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!userForm.id">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: '',
  userType: ''
})

// 用户列表数据
const userList = ref([])
const loading = ref(false)

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const userFormRef = ref(null)
const userForm = reactive({
  id: '',
  username: '',
  nickname: '',
  phone: '',
  email: '',
  userType: '',
  status: '',
  password: ''
})

// 表单验证规则
const userFormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  userType: [
    { required: true, message: '请选择用户类型', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// 模拟用户数据
const mockUsers = [
  {
    id: 1234567890,
    username: 'zhangsan',
    nickname: '张三',
    phone: '13800138001',
    email: 'zhangsan@example.com',
    userType: 'normal',
    status: 'active',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    createTime: '2024-01-01 10:00:00',
    lastLoginTime: '2024-01-15 15:30:00'
  },
  {
    id: 2134567890,
    username: 'lisi',
    nickname: '李四',
    phone: '13800138002',
    email: 'lisi@example.com',
    userType: 'vip',
    status: 'active',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    createTime: '2024-01-02 11:00:00',
    lastLoginTime: '2024-01-15 16:20:00'
  },
  {
    id: 3124567890,
    username: 'wangwu',
    nickname: '王五',
    phone: '13800138003',
    email: 'wangwu@example.com',
    userType: 'enterprise',
    status: 'inactive',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    createTime: '2024-01-03 12:00:00',
    lastLoginTime: '2024-01-14 09:15:00'
  }
]

// 获取用户类型标签
const getUserTypeTag = (type) => {
  const tagMap = {
    normal: '',
    vip: 'warning',
    enterprise: 'success'
  }
  return tagMap[type] || ''
}

// 获取用户类型标签文本
const getUserTypeLabel = (type) => {
  const labelMap = {
    normal: '普通用户',
    vip: 'VIP用户',
    enterprise: '企业用户'
  }
  return labelMap[type] || type
}

// 获取状态标签
const getStatusTag = (status) => {
  const tagMap = {
    active: 'success',
    inactive: 'danger',
    pending: 'warning'
  }
  return tagMap[status] || ''
}

// 获取状态标签文本
const getStatusLabel = (status) => {
  const labelMap = {
    active: '正常',
    inactive: '禁用',
    pending: '待激活'
  }
  return labelMap[status] || status
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadUserList()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    status: '',
    userType: ''
  })
  handleSearch()
}

// 添加用户
const handleAdd = () => {
  dialogTitle.value = '添加用户'
  Object.assign(userForm, {
    id: '',
    username: '',
    nickname: '',
    phone: '',
    email: '',
    userType: '',
    status: 'active',
    password: ''
  })
  dialogVisible.value = true
}

// 编辑用户
const handleEdit = (row) => {
  dialogTitle.value = '编辑用户'
  Object.assign(userForm, { ...row })
  dialogVisible.value = true
}

// 删除用户
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除用户 "${row.nickname}" 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 这里调用删除API
    ElMessage.success('删除成功')
    loadUserList()
  })
}

// 切换用户状态
const handleToggleStatus = (row) => {
  const action = row.status === 'active' ? '禁用' : '启用'
  ElMessageBox.confirm(
    `确定要${action}用户 "${row.nickname}" 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 这里调用状态切换API
    row.status = row.status === 'active' ? 'inactive' : 'active'
    ElMessage.success(`${action}成功`)
  })
}

// 提交表单
const handleSubmit = async () => {
  try {
    await userFormRef.value.validate()
    // 这里调用保存API
    ElMessage.success(userForm.id ? '更新成功' : '添加成功')
    dialogVisible.value = false
    loadUserList()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 对话框关闭
const handleDialogClose = () => {
  userFormRef.value?.resetFields()
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadUserList()
}

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.currentPage = page
  loadUserList()
}

// 加载用户列表
const loadUserList = () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    userList.value = mockUsers
    pagination.total = mockUsers.length
    loading.value = false
  }, 500)
}

onMounted(() => {
  loadUserList()
})
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
