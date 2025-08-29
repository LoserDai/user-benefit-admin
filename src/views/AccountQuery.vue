<template>
  <div class="points-query">
    <!-- 搜索和操作栏 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-input
            v-model="searchForm.account"
            placeholder="请输入账户名"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>

        <el-col :span="12">
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-col>

      </el-row>
    </el-card>

    <!-- 积分账户列表 -->
    <el-card class="table-card">
      <el-table :data="accountList" stripe v-loading="loading" border>
        <el-table-column prop="userId" label="账户ID" width="120" />
        <el-table-column prop="account" label="账户名" width="200" />
        <el-table-column prop="balance" label="账户余额" width="150">
          <template #default="scope">
            <span class="balance-amount">¥{{ scope.row.balance?.toFixed(2) || '0.00' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分余额" width="120">
          <template #default="scope">
            <span class="points-amount">{{ scope.row.points || 0 }}</span>
          </template>
        </el-table-column>
                 <el-table-column label="操作" width="120" fixed="right">
           <template #default="scope">
             <el-button size="small" type="warning" @click="handleAdjustBalance(scope.row)">调账</el-button>
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

    

    <!-- 调账对话框 -->
    <el-dialog
      v-model="adjustDialogVisible"
      title="积分账户调账"
      width="500px"
    >
      <el-form
        ref="adjustFormRef"
        :model="adjustForm"
        :rules="adjustFormRules"
        label-width="100px"
      >
                 <el-form-item label="调账类型" prop="side">
           <el-radio-group v-model="adjustForm.side">
             <el-radio :label="0">充值</el-radio>
             <el-radio :label="1">扣减</el-radio>
           </el-radio-group>
         </el-form-item>
         <el-form-item label="调账积分" prop="points">
           <el-input-number
             v-model="adjustForm.points"
             :min="0.01"
             :precision="2"
             :step="0.01"
             style="width: 100%"
           />
         </el-form-item>
         <el-form-item label="账户余额" prop="balance">
           <el-input-number
             v-model="adjustForm.balance"
             :min="0"
             :precision="2"
             :step="0.01"
             style="width: 100%"
           />
         </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAdjustSubmit">确定</el-button>
      </template>
    </el-dialog>


  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { pageQueryPoints, modifyBalance } from '@/api/user'

// 搜索表单
const searchForm = reactive({
  account: '' // 账户名
})

// 积分账户列表数据
const accountList = ref([])
const loading = ref(false)

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})



// 调账对话框
const adjustDialogVisible = ref(false)
const adjustFormRef = ref(null)
const adjustForm = reactive({
  userId: null,
  type: 2, // 2：调账
  side: 0, // 0：充值, 1：扣减
  points: 0,
  balance: 0
})





const adjustFormRules = {
  side: [
    { required: true, message: '请选择调账类型', trigger: 'change' }
  ],
  points: [
    { required: true, message: '请输入调账积分', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '积分必须大于0', trigger: 'blur' }
  ]
}











// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadAccountList()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    account: ''
  })
  handleSearch()
}





// 调账
const handleAdjustBalance = (row) => {
  adjustForm.userId = row.userId
  adjustForm.type = 2 // 2：调账
  adjustForm.side = 0 // 默认充值
  adjustForm.points = 0
  adjustForm.balance = row.balance || 0
  adjustDialogVisible.value = true
}







// 提交调账
const handleAdjustSubmit = async () => {
  try {
    await adjustFormRef.value.validate()
    
    // 调用积分调账API
    const response = await modifyBalance(adjustForm)
    if (response.code === 200) {
      ElMessage.success('积分调账成功')
      adjustDialogVisible.value = false
      loadAccountList() // 刷新列表
    } else {
      ElMessage.error(response.message || '调账失败')
    }
  } catch (error) {
    console.error('调账失败:', error)
    ElMessage.error('调账失败，请稍后重试')
  }
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadAccountList()
}

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.currentPage = page
  loadAccountList()
}

// 加载积分账户列表
const loadAccountList = async () => {
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
    
    console.log('查询积分账户请求参数:', request)
    
    const response = await pageQueryPoints(request)
    if (response.code === 200 && response.data) {
      accountList.value = response.data.data || []
      pagination.total = response.data.total || 0
    } else {
      ElMessage.error(response.message || '获取账户列表失败')
    }
  } catch (error) {
    console.error('获取账户列表失败:', error)
    ElMessage.error('获取账户列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAccountList()
})
</script>

<style scoped>
.points-query {
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

.balance-amount {
  font-weight: bold;
  color: #409EFF;
}


</style>
