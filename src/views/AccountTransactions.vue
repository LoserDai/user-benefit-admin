<template>
  <div class="account-transactions">
    <!-- 搜索和筛选栏 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="6">
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
        <el-col :span="4">
          <el-select v-model="searchForm.changeType" placeholder="变更类型" clearable>
            <el-option label="获得" :value="1" />
            <el-option label="消费" :value="2" />
            <el-option label="退款" :value="3" />
            <el-option label="冻结" :value="4" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-input
            v-model="searchForm.bizId"
            placeholder="请输入业务ID(订单号)"
            clearable
            @keyup.enter="handleSearch"
          />
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
        </el-col>
      </el-row>
    </el-card>

    

    <!-- 交易记录列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="table-header">
          <span>交易记录</span>
        </div>
      </template>
      
      <el-table :data="transactionList" stripe v-loading="loading" border>
        <el-table-column prop="id" label="交易ID" width="120" />
        <el-table-column prop="account" label="账户名" width="150" />
        <el-table-column prop="changeType" label="变更类型" width="100">
          <template #default="scope">
            <el-tag :type="getChangeTypeTag(scope.row.changeType)">
              {{ getChangeTypeLabel(scope.row.changeType) }}
            </el-tag>
          </template>
        </el-table-column>
                 <el-table-column prop="changePoint" label="积分变更" width="120">
           <template #default="scope">
             <span :class="getPointsChangeClass(scope.row.changeType)">
               {{ getPointsChangeSymbol(scope.row.changeType) }}{{ scope.row.changePoint || 0 }}
             </span>
           </template>
         </el-table-column>
         <el-table-column prop="pointsAfter" label="积分余额" width="120">
           <template #default="scope">
             <span class="points-amount">{{ scope.row.pointsAfter || 0 }}</span>
           </template>
         </el-table-column>
         <el-table-column prop="changeBalance" label="余额变更" width="120">
           <template #default="scope">
             <span :class="getBalanceChangeClass(scope.row.changeType)">
               {{ getBalanceChangeSymbol(scope.row.changeType) }}¥{{ scope.row.changeBalance?.toFixed(2) || '0.00' }}
             </span>
           </template>
         </el-table-column>
         <el-table-column prop="balanceAfter" label="账户余额" width="120">
           <template #default="scope">
             <span class="balance-amount">¥{{ scope.row.balanceAfter?.toFixed(2) || '0.00' }}</span>
           </template>
         </el-table-column>
        <el-table-column prop="bizId" label="业务ID" width="150" />
                 <el-table-column prop="createTime" label="交易时间" width="160">
           <template #default="scope">
             {{ formatTime(scope.row.createTime) }}
           </template>
         </el-table-column>
        <el-table-column prop="remark" label="备注" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleViewDetails(scope.row)">详情</el-button>
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

    <!-- 交易详情对话框 -->
    <el-dialog
      v-model="detailsDialogVisible"
      title="交易详情"
      width="700px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="交易ID">{{ selectedTransaction.id }}</el-descriptions-item>
        <el-descriptions-item label="账户名">{{ selectedTransaction.account }}</el-descriptions-item>
        <el-descriptions-item label="变更类型">
          <el-tag :type="getChangeTypeTag(selectedTransaction.changeType)">
            {{ getChangeTypeLabel(selectedTransaction.changeType) }}
          </el-tag>
        </el-descriptions-item>
                 <el-descriptions-item label="积分变更">
           <span :class="getPointsChangeClass(selectedTransaction.changeType)">
             {{ getPointsChangeSymbol(selectedTransaction.changeType) }}{{ selectedTransaction.changePoint || 0 }}
           </span>
         </el-descriptions-item>
         <el-descriptions-item label="积分余额">{{ selectedTransaction.pointsAfter || 0 }}</el-descriptions-item>
         <el-descriptions-item label="余额变更">
           <span :class="getBalanceChangeClass(selectedTransaction.changeType)">
             {{ getBalanceChangeSymbol(selectedTransaction.changeType) }}¥{{ selectedTransaction.changeBalance?.toFixed(2) || '0.00' }}
           </span>
         </el-descriptions-item>
         <el-descriptions-item label="账户余额">¥{{ selectedTransaction.balanceAfter?.toFixed(2) || '0.00' }}</el-descriptions-item>
        <el-descriptions-item label="业务ID">{{ selectedTransaction.bizId || '-' }}</el-descriptions-item>
                 <el-descriptions-item label="交易时间">{{ formatTime(selectedTransaction.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ selectedTransaction.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { queryAllPointTransaction } from '@/api/user'

// 搜索表单
const searchForm = reactive({
  account: '',        // 账户名
  changeType: null,   // 变更类型：1:获得 2:消费 3:退款 4:冻结
  bizId: ''           // 业务ID(订单号)
})



// 交易记录列表
const transactionList = ref([])
const loading = ref(false)

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 详情对话框
const detailsDialogVisible = ref(false)
const selectedTransaction = ref({})



// 获取变更类型标签
const getChangeTypeTag = (changeType) => {
  const tagMap = {
    1: 'success',   // 获得
    2: 'danger',    // 消费
    3: 'warning',   // 退款
    4: 'info'       // 冻结
  }
  return tagMap[changeType] || ''
}

// 获取变更类型标签文本
const getChangeTypeLabel = (changeType) => {
  const labelMap = {
    1: '获得',
    2: '消费',
    3: '退款',
    4: '冻结'
  }
  return labelMap[changeType] || '未知'
}

// 获取积分变更样式类
const getPointsChangeClass = (changeType) => {
  if (changeType === 1 || changeType === 3) {
    return 'income-amount'  // 获得或退款
  } else {
    return 'expense-amount' // 消费或冻结
  }
}

// 获取积分变更符号
const getPointsChangeSymbol = (changeType) => {
  if (changeType === 1 || changeType === 3) {
    return '+'  // 获得或退款
  } else {
    return '-'  // 消费或冻结
  }
}

// 获取余额变更样式类
const getBalanceChangeClass = (changeType) => {
  if (changeType === 1 || changeType === 3) {
    return 'income-amount'  // 获得或退款
  } else {
    return 'expense-amount' // 消费或冻结
  }
}

// 获取余额变更符号
const getBalanceChangeSymbol = (changeType) => {
  if (changeType === 1 || changeType === 3) {
    return '+'  // 获得或退款
  } else {
    return '-'  // 消费或冻结
  }
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return '-'
  
  try {
    const date = new Date(time)
    if (isNaN(date.getTime())) return time // 如果解析失败，返回原值
    
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
  loadTransactionList()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    account: '',
    changeType: null,
    bizId: ''
  })
  handleSearch()
}

// 查看详情
const handleViewDetails = (row) => {
  selectedTransaction.value = row
  detailsDialogVisible.value = true
}



// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadTransactionList()
}

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.currentPage = page
  loadTransactionList()
}

// 加载交易列表
const loadTransactionList = async () => {
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
    
    console.log('查询交易流水请求参数:', request)
    
    const response = await queryAllPointTransaction(request)
         if (response.code === 200 && response.data) {
       transactionList.value = response.data.data || []
       pagination.total = response.data.total || 0
     } else {
      ElMessage.error(response.message || '获取交易列表失败')
    }
  } catch (error) {
    console.error('获取交易列表失败:', error)
    ElMessage.error('获取交易列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTransactionList()
})
</script>

<style scoped>
.account-transactions {
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

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.income-amount {
  color: #67C23A;
  font-weight: bold;
}

.expense-amount {
  color: #F56C6C;
  font-weight: bold;
}

.balance-amount {
  font-weight: bold;
  color: #409EFF;
}
</style>
