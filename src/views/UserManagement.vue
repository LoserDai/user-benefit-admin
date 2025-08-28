<template>
  <div class="user-management">
    <!-- 搜索和操作栏 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="4">
          <el-input
            v-model="searchForm.account"
            placeholder="请输入账号"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="3">
          <el-select v-model="searchForm.gender" placeholder="性别" clearable>
            <el-option label="男" :value="1" />
            <el-option label="女" :value="0" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-input
            v-model="searchForm.phone"
            placeholder="请输入手机号"
            clearable
          />
        </el-col>
        <el-col :span="4">
          <el-input
            v-model="searchForm.email"
            placeholder="请输入邮箱"
            clearable
          />
        </el-col>
        <el-col :span="3">
          <el-select v-model="searchForm.status" placeholder="状态" clearable>
            <el-option label="正常" value="ACTIVE" />
            <el-option label="禁用" value="INACTIVE" />
            <el-option label="过期" value="EXPIRED" />
            <el-option label="已删除" value="DELETED" />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-select v-model="searchForm.userRole" placeholder="角色" clearable>
            <el-option label="普通用户" :value="0" />
            <el-option label="管理员" :value="1" />
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
         <el-table-column prop="account" label="账号" width="120" align="center" />
         <el-table-column prop="phone" label="手机号" width="140" align="center" />
         <el-table-column prop="email" label="邮箱" width="200" align="center" />
         <el-table-column prop="gender" label="性别" width="80" align="center">
           <template #default="scope">
             <el-tag :type="getGenderTag(scope.row.gender)">
               {{ getGenderLabel(scope.row.gender) }}
             </el-tag>
           </template>
         </el-table-column>
         <el-table-column prop="userRole" label="角色" width="100" align="center">
           <template #default="scope">
             <el-tag :type="scope.row.userRole === 1 || scope.row.userRole === '1' ? 'danger' : 'info'">
               {{ scope.row.userRole === 1 || scope.row.userRole === '1' ? '管理员' : '普通用户' }}
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
         <el-table-column prop="createTime" label="创建时间" width="160" align="center">
           <template #default="scope">
             {{ formatDateTime(scope.row.createTime) }}
           </template>
         </el-table-column>
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
               :type="scope.row.status === 'ACTIVE' ? 'warning' : 'success'"
               @click="handleToggleStatus(scope.row)"
             >
               {{ scope.row.status === 'ACTIVE' ? '禁用' : '启用' }}
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
                 <el-form-item label="账号" prop="account">
           <el-input v-model="userForm.account" placeholder="请输入账号" />
         </el-form-item>
         <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="userForm.gender" placeholder="请选择性别">
            <el-option label="男" :value="1" />
            <el-option label="女" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色" prop="userRole">
          <el-select v-model="userForm.userRole" placeholder="请选择角色">
            <el-option label="普通用户" :value="0" />
            <el-option label="管理员" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="userForm.status" placeholder="请选择状态">
            <el-option label="正常" value="ACTIVE" />
            <el-option label="禁用" value="INACTIVE" />
            <el-option label="过期" value="EXPIRED" />
            <el-option label="已删除" value="DELETED" />
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
import { pageQueryUser, deleteUser } from '@/api/user'

// 搜索表单
const searchForm = reactive({
  account: '', // 账号
  gender: null, // 性别
  email: '', // 邮箱
  phone: '', // 手机号
  status: '', // 状态
  userRole: null // 用户角色
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
  account: '',
  phone: '',
  email: '',
  gender: null,
  userRole: 0,
  status: 'ACTIVE',
  password: ''
})

// 表单验证规则
const userFormRules = {
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  userRole: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}





// 获取状态标签
const getStatusTag = (status) => {
  const tagMap = {
    ACTIVE: 'success',
    INACTIVE: 'danger',
    EXPIRED: 'warning',
    DELETED: 'info'
  }
  return tagMap[status] || ''
}

// 获取状态标签文本
const getStatusLabel = (status) => {
  const labelMap = {
    ACTIVE: '正常',
    INACTIVE: '禁用',
    EXPIRED: '过期',
    DELETED: '已删除'
  }
  return labelMap[status] || status
}

// 获取性别标签
const getGenderTag = (gender) => {
  if (gender === 0 || gender === '0') return 'success'
  if (gender === 1 || gender === '1') return 'primary'
  return 'warning'
}

// 获取性别标签文本
const getGenderLabel = (gender) => {
  if (gender === 0 || gender === '0') return '女'
  if (gender === 1 || gender === '1') return '男'
  return 'Alien'
}

// 格式化日期时间
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '-'
  
  try {
    const date = new Date(dateTimeStr)
    if (isNaN(date.getTime())) return dateTimeStr
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  } catch (error) {
    console.error('时间格式化失败:', error)
    return dateTimeStr
  }
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadUserList()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    account: '',
    gender: null,
    email: '',
    phone: '',
    status: '',
    userRole: null
  })
  handleSearch()
}

// 添加用户
const handleAdd = () => {
  dialogTitle.value = '添加用户'
  Object.assign(userForm, {
    id: '',
    account: '',
    phone: '',
    email: '',
    gender: null,
    userRole: 0,
    status: 'ACTIVE',
    password: ''
  })
  dialogVisible.value = true
}

// 编辑用户
const handleEdit = (row) => {
  dialogTitle.value = '编辑用户'
  // 确保 userRole 和 gender 是数字类型
  const userData = { ...row }
  if (userData.userRole !== null && userData.userRole !== undefined) {
    userData.userRole = parseInt(userData.userRole)
  }
  if (userData.gender !== null && userData.gender !== undefined) {
    userData.gender = parseInt(userData.gender)
  }
  Object.assign(userForm, userData)
  dialogVisible.value = true
}

// 删除用户
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除用户 "${row.account}" 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 传递完整的用户对象，后端会从User对象中提取id
      const response = await deleteUser(row)
      if (response.code === 200) {
        ElMessage.success('删除成功')
        loadUserList()
      } else {
        ElMessage.error(response.message || '删除失败')
      }
    } catch (error) {
      console.error('删除用户失败:', error)
      ElMessage.error('删除用户失败，请稍后重试')
    }
  })
}

// 切换用户状态
const handleToggleStatus = (row) => {
  const action = row.status === 'ACTIVE' ? '禁用' : '启用'
  ElMessageBox.confirm(
    `确定要${action}用户 "${row.account}" 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 这里调用状态切换API
    row.status = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
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
const loadUserList = async () => {
  loading.value = true
  try {
    // 构建查询参数
    const request = {
      pageNum: pagination.currentPage,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    
    // 过滤掉空值
    Object.keys(request).forEach(key => {
      if (request[key] === '' || request[key] === null || request[key] === undefined) {
        delete request[key]
      }
    })
    
    const response = await pageQueryUser(request)
    if (response.code === 200 && response.data) {
      userList.value = response.data.data || []
      pagination.total = response.data.total || 0
    } else {
      ElMessage.error(response.message || '获取用户列表失败')
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
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
