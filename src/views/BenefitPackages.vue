<template>
  <div class="benefit-packages">
    <!-- 搜索和操作栏 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchForm.packageName"
            placeholder="请输入权益包名称"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.status" placeholder="权益包状态" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="searchForm.type" placeholder="权益包类型" clearable>
            <el-option label="新手礼包" :value="1" />
            <el-option label="会员礼包" :value="2" />
            <el-option label="节日礼包" :value="3" />
            <el-option label="活动礼包" :value="4" />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
          <el-button type="success" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增权益包
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 权益包列表 -->
    <el-card class="table-card">
      <el-table :data="packageList" stripe v-loading="loading" border>
        <el-table-column prop="id" label="权益包ID" width="100" />
        <el-table-column prop="packageName" label="权益包名称" width="200" />
        <el-table-column prop="type" label="权益包类型" width="120">
          <template #default="scope">
            <el-tag :type="getTypeTag(scope.row.type)">
              {{ getTypeLabel(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="所需积分" width="120">
          <template #default="scope">
            <span class="points-amount">{{ scope.row.points || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="validDays" label="有效期(天)" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="scope">
            {{ formatTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === 1 ? 'warning' : 'success'"
              @click="handleToggleStatus(scope.row)"
            >
              {{ scope.row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
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

    <!-- 新增/编辑权益包对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
    >
      <el-form
        ref="packageFormRef"
        :model="packageForm"
        :rules="packageFormRules"
        label-width="100px"
      >
        <el-form-item label="权益包名称" prop="packageName">
          <el-input v-model="packageForm.packageName" placeholder="请输入权益包名称" />
        </el-form-item>
        <el-form-item label="权益包类型" prop="type">
          <el-select v-model="packageForm.type" placeholder="请选择权益包类型" style="width: 100%">
            <el-option label="新手礼包" :value="1" />
            <el-option label="会员礼包" :value="2" />
            <el-option label="节日礼包" :value="3" />
            <el-option label="活动礼包" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="所需积分" prop="points">
          <el-input-number
            v-model="packageForm.points"
            :min="0"
            :precision="0"
            style="width: 100%"
            placeholder="请输入所需积分"
          />
        </el-form-item>
        <el-form-item label="有效期(天)" prop="validDays">
          <el-input-number
            v-model="packageForm.validDays"
            :min="1"
            :precision="0"
            style="width: 100%"
            placeholder="请输入有效期天数"
          />
        </el-form-item>
        <el-form-item label="权益包描述" prop="description">
          <el-input
            v-model="packageForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入权益包描述"
          />
        </el-form-item>
        <el-form-item label="包含权益" prop="benefits">
          <el-input
            v-model="packageForm.benefits"
            type="textarea"
            :rows="3"
            placeholder="请输入包含的权益内容"
          />
        </el-form-item>
        <el-form-item label="权益包状态" prop="status">
          <el-radio-group v-model="packageForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
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
  packageName: '',  // 权益包名称
  status: null,     // 权益包状态
  type: null        // 权益包类型
})

// 权益包列表数据
const packageList = ref([])
const loading = ref(false)

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const packageFormRef = ref(null)
const packageForm = reactive({
  id: null,
  packageName: '',
  type: null,
  points: 0,
  validDays: 30,
  description: '',
  benefits: '',
  status: 1
})

// 表单验证规则
const packageFormRules = {
  packageName: [
    { required: true, message: '请输入权益包名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择权益包类型', trigger: 'change' }
  ],
  points: [
    { required: true, message: '请输入所需积分', trigger: 'blur' },
    { type: 'number', min: 0, message: '积分不能小于0', trigger: 'blur' }
  ],
  validDays: [
    { required: true, message: '请输入有效期天数', trigger: 'blur' },
    { type: 'number', min: 1, message: '有效期不能小于1天', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择权益包状态', trigger: 'change' }
  ]
}

// 获取类型标签类型
const getTypeTag = (type) => {
  const tagMap = {
    1: 'primary',   // 新手礼包
    2: 'success',   // 会员礼包
    3: 'warning',   // 节日礼包
    4: 'info'       // 活动礼包
  }
  return tagMap[type] || ''
}

// 获取类型标签文本
const getTypeLabel = (type) => {
  const labelMap = {
    1: '新手礼包',
    2: '会员礼包',
    3: '节日礼包',
    4: '活动礼包'
  }
  return labelMap[type] || '未知'
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return '-'
  
  try {
    const date = new Date(time)
    if (isNaN(date.getTime())) return time
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  } catch (error) {
    console.error('时间格式化失败:', error)
    return time
  }
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadPackageList()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    packageName: '',
    status: null,
    type: null
  })
  handleSearch()
}

// 新增权益包
const handleAdd = () => {
  dialogTitle.value = '新增权益包'
  Object.assign(packageForm, {
    id: null,
    packageName: '',
    type: null,
    points: 0,
    validDays: 30,
    description: '',
    benefits: '',
    status: 1
  })
  dialogVisible.value = true
}

// 编辑权益包
const handleEdit = (row) => {
  dialogTitle.value = '编辑权益包'
  Object.assign(packageForm, row)
  dialogVisible.value = true
}

// 切换状态
const handleToggleStatus = async (row) => {
  try {
    const newStatus = row.status === 1 ? 0 : 1
    const action = newStatus === 1 ? '启用' : '禁用'
    
    await ElMessageBox.confirm(
      `确定要${action}权益包"${row.packageName}"吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // TODO: 调用后端API更新状态
    row.status = newStatus
    ElMessage.success(`${action}成功`)
  } catch (error) {
    // 用户取消操作
  }
}

// 删除权益包
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除权益包"${row.packageName}"吗？此操作不可恢复！`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // TODO: 调用后端API删除权益包
    ElMessage.success('删除成功')
    loadPackageList()
  } catch (error) {
    // 用户取消操作
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await packageFormRef.value.validate()
    
    // TODO: 调用后端API保存权益包
    ElMessage.success(packageForm.id ? '更新成功' : '新增成功')
    dialogVisible.value = false
    loadPackageList()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadPackageList()
}

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.currentPage = page
  loadPackageList()
}

// 加载权益包列表
const loadPackageList = async () => {
  loading.value = true
  try {
    // TODO: 调用后端API获取权益包列表
    // 模拟数据
    setTimeout(() => {
      packageList.value = [
        {
          id: 1,
          packageName: '新手大礼包',
          type: 1,
          points: 1000,
          validDays: 30,
          status: 1,
          description: '新用户专享权益包',
          benefits: '包含积分、优惠券、会员体验等',
          createTime: new Date()
        },
        {
          id: 2,
          packageName: 'VIP会员礼包',
          type: 2,
          points: 5000,
          validDays: 90,
          status: 1,
          description: 'VIP会员专享权益包',
          benefits: '包含高级服务、专属优惠、优先体验等',
          createTime: new Date()
        }
      ]
      pagination.total = 2
      loading.value = false
    }, 500)
  } catch (error) {
    console.error('获取权益包列表失败:', error)
    ElMessage.error('获取权益包列表失败，请稍后重试')
    loading.value = false
  }
}

onMounted(() => {
  loadPackageList()
})
</script>

<style scoped>
.benefit-packages {
  padding: 20px;
  width: 100%;
  min-height: 100%;
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

.points-amount {
  font-weight: bold;
  color: #67C23A;
}
</style>
