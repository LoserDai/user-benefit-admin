<template>
  <div class="benefit-activities">
    <!-- 搜索和操作栏 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchForm.activityName"
            placeholder="请输入活动名称"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.status" placeholder="活动状态" clearable>
            <el-option label="进行中" :value="1" />
            <el-option label="已结束" :value="2" />
            <el-option label="未开始" :value="0" />
            <el-option label="已暂停" :value="3" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="searchForm.type" placeholder="活动类型" clearable>
            <el-option label="积分翻倍" :value="1" />
            <el-option label="限时折扣" :value="2" />
            <el-option label="新用户专享" :value="3" />
            <el-option label="节日特惠" :value="4" />
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
            新增活动
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 活动列表 -->
    <el-card class="table-card">
      <el-table :data="activityList" stripe v-loading="loading" border>
        <el-table-column prop="id" label="活动ID" width="100" />
        <el-table-column prop="activityName" label="活动名称" width="200" />
        <el-table-column prop="type" label="活动类型" width="120">
          <template #default="scope">
            <el-tag :type="getTypeTag(scope.row.type)">
              {{ getTypeLabel(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="160">
          <template #default="scope">
            {{ formatTime(scope.row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="endTime" label="结束时间" width="160">
          <template #default="scope">
            {{ formatTime(scope.row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
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
              v-if="scope.row.status !== 2"
            >
              {{ scope.row.status === 1 ? '暂停' : '启动' }}
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

    <!-- 新增/编辑活动对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
    >
      <el-form
        ref="activityFormRef"
        :model="activityForm"
        :rules="activityFormRules"
        label-width="100px"
      >
        <el-form-item label="活动名称" prop="activityName">
          <el-input v-model="activityForm.activityName" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="活动类型" prop="type">
          <el-select v-model="activityForm.type" placeholder="请选择活动类型" style="width: 100%">
            <el-option label="积分翻倍" :value="1" />
            <el-option label="限时折扣" :value="2" />
            <el-option label="新用户专享" :value="3" />
            <el-option label="节日特惠" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动时间" prop="timeRange">
          <el-date-picker
            v-model="activityForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="活动规则" prop="rules">
          <el-input
            v-model="activityForm.rules"
            type="textarea"
            :rows="3"
            placeholder="请输入活动规则"
          />
        </el-form-item>
        <el-form-item label="活动描述" prop="description">
          <el-input
            v-model="activityForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入活动描述"
          />
        </el-form-item>
        <el-form-item label="活动状态" prop="status">
          <el-radio-group v-model="activityForm.status">
            <el-radio :label="0">未开始</el-radio>
            <el-radio :label="1">进行中</el-radio>
            <el-radio :label="3">已暂停</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="活动配置" prop="config">
          <el-input
            v-model="activityForm.config"
            type="textarea"
            :rows="3"
            placeholder="请输入活动配置(JSON格式)"
          />
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
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'

// 搜索表单
const searchForm = reactive({
  activityName: '',  // 活动名称
  status: null,      // 活动状态
  type: null         // 活动类型
})

// 活动列表数据
const activityList = ref([])
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
const activityFormRef = ref(null)
const activityForm = reactive({
  id: null,
  activityName: '',
  type: null,
  timeRange: [],
  rules: '',
  description: '',
  status: 0,
  config: ''
})

// 表单验证规则
const activityFormRules = {
  activityName: [
    { required: true, message: '请输入活动名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择活动类型', trigger: 'change' }
  ],
  timeRange: [
    { required: true, message: '请选择活动时间', trigger: 'change' }
  ],
  rules: [
    { required: true, message: '请输入活动规则', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择活动状态', trigger: 'change' }
  ]
}

// 获取类型标签类型
const getTypeTag = (type) => {
  const tagMap = {
    1: 'primary',   // 积分翻倍
    2: 'success',   // 限时折扣
    3: 'warning',   // 新用户专享
    4: 'info'       // 节日特惠
  }
  return tagMap[type] || ''
}

// 获取类型标签文本
const getTypeLabel = (type) => {
  const labelMap = {
    1: '积分翻倍',
    2: '限时折扣',
    3: '新用户专享',
    4: '节日特惠'
  }
  return labelMap[type] || '未知'
}

// 获取状态标签类型
const getStatusTag = (status) => {
  const tagMap = {
    0: 'info',      // 未开始
    1: 'success',   // 进行中
    2: 'danger',    // 已结束
    3: 'warning'    // 已暂停
  }
  return tagMap[status] || ''
}

// 获取状态标签文本
const getStatusLabel = (status) => {
  const labelMap = {
    0: '未开始',
    1: '进行中',
    2: '已结束',
    3: '已暂停'
  }
  return labelMap[status] || '未知'
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

// 监听时间范围变化，自动更新开始和结束时间
watch(() => activityForm.timeRange, (newVal) => {
  if (newVal && newVal.length === 2) {
    activityForm.startTime = newVal[0]
    activityForm.endTime = newVal[1]
  }
}, { deep: true })

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadActivityList()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    activityName: '',
    status: null,
    type: null
  })
  handleSearch()
}

// 新增活动
const handleAdd = () => {
  dialogTitle.value = '新增活动'
  Object.assign(activityForm, {
    id: null,
    activityName: '',
    type: null,
    timeRange: [],
    startTime: '',
    endTime: '',
    rules: '',
    description: '',
    status: 0,
    config: ''
  })
  dialogVisible.value = true
}

// 编辑活动
const handleEdit = (row) => {
  dialogTitle.value = '编辑活动'
  Object.assign(activityForm, {
    ...row,
    timeRange: row.startTime && row.endTime ? [row.startTime, row.endTime] : []
  })
  dialogVisible.value = true
}

// 切换状态
const handleToggleStatus = async (row) => {
  try {
    const newStatus = row.status === 1 ? 3 : 1
    const action = newStatus === 1 ? '启动' : '暂停'
    
    await ElMessageBox.confirm(
      `确定要${action}活动"${row.activityName}"吗？`,
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

// 删除活动
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除活动"${row.activityName}"吗？此操作不可恢复！`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // TODO: 调用后端API删除活动
    ElMessage.success('删除成功')
    loadActivityList()
  } catch (error) {
    // 用户取消操作
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await activityFormRef.value.validate()
    
    // 验证时间范围
    if (!activityForm.timeRange || activityForm.timeRange.length !== 2) {
      ElMessage.error('请选择活动时间范围')
      return
    }
    
    // TODO: 调用后端API保存活动
    ElMessage.success(activityForm.id ? '更新成功' : '新增成功')
    dialogVisible.value = false
    loadActivityList()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadActivityList()
}

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.currentPage = page
  loadActivityList()
}

// 加载活动列表
const loadActivityList = async () => {
  loading.value = true
  try {
    // TODO: 调用后端API获取活动列表
    // 模拟数据
    setTimeout(() => {
      activityList.value = [
        {
          id: 1,
          activityName: '双11积分翻倍活动',
          type: 1,
          startTime: '2024-11-01 00:00:00',
          endTime: '2024-11-11 23:59:59',
          status: 1,
          rules: '活动期间所有消费积分翻倍',
          description: '双11购物节特别活动',
          config: '{"multiplier": 2}',
          createTime: new Date()
        },
        {
          id: 2,
          activityName: '新用户专享优惠',
          type: 3,
          startTime: '2024-01-01 00:00:00',
          endTime: '2024-12-31 23:59:59',
          status: 1,
          rules: '新用户注册后7天内享受9折优惠',
          description: '新用户专享优惠活动',
          config: '{"discount": 0.9, "validDays": 7}',
          createTime: new Date()
        }
      ]
      pagination.total = 2
      loading.value = false
    }, 500)
  } catch (error) {
    console.error('获取活动列表失败:', error)
    ElMessage.error('获取活动列表失败，请稍后重试')
    loading.value = false
  }
}

onMounted(() => {
  loadActivityList()
})
</script>

<style scoped>
.benefit-activities {
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
</style>
