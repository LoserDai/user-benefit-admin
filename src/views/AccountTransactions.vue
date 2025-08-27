<template>
  <div class="account-transactions">
    <!-- 搜索和筛选栏 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入用户名或交易号"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.transactionType" placeholder="交易类型" clearable>
            <el-option label="收入" value="income" />
            <el-option label="支出" value="expense" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.paymentMethod" placeholder="支付方式" clearable>
            <el-option label="支付宝" value="alipay" />
            <el-option label="微信支付" value="wechat" />
            <el-option label="银行卡" value="bank" />
            <el-option label="余额支付" value="balance" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
          />
        </el-col>
        <el-col :span="4">
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

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon income-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">¥{{ stats.totalIncome.toFixed(2) }}</div>
              <div class="stats-label">总收入</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon expense-icon">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">¥{{ stats.totalExpense.toFixed(2) }}</div>
              <div class="stats-label">总支出</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon balance-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">¥{{ stats.netAmount.toFixed(2) }}</div>
              <div class="stats-label">净收入</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon count-icon">
              <el-icon><List /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.totalCount }}</div>
              <div class="stats-label">交易笔数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 交易记录列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="table-header">
          <span>交易记录</span>
          <el-button type="primary" size="small" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
        </div>
      </template>
      
      <el-table :data="transactionList" stripe v-loading="loading" border>
        <el-table-column prop="transactionNo" label="交易号" width="150" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="type" label="交易类型" width="100">
          <template #default="scope">
            <el-tag :type="getTransactionTypeTag(scope.row.type)">
              {{ getTransactionTypeLabel(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="交易金额" width="120">
          <template #default="scope">
            <span :class="scope.row.type === 'income' ? 'income-amount' : 'expense-amount'">
              {{ scope.row.type === 'income' ? '+' : '-' }}¥{{ scope.row.amount.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="100">
          <template #default="scope">
            <el-tag>{{ getPaymentMethodLabel(scope.row.paymentMethod) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="账户余额" width="120">
          <template #default="scope">
            <span class="balance-amount">¥{{ scope.row.balance.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="交易时间" width="160" />
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
        <el-descriptions-item label="交易号">{{ selectedTransaction.transactionNo }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ selectedTransaction.username }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ selectedTransaction.nickname }}</el-descriptions-item>
        <el-descriptions-item label="交易类型">
          <el-tag :type="getTransactionTypeTag(selectedTransaction.type)">
            {{ getTransactionTypeLabel(selectedTransaction.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="交易金额">
          <span :class="selectedTransaction.type === 'income' ? 'income-amount' : 'expense-amount'">
            {{ selectedTransaction.type === 'income' ? '+' : '-' }}¥{{ selectedTransaction.amount?.toFixed(2) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ getPaymentMethodLabel(selectedTransaction.paymentMethod) }}</el-descriptions-item>
        <el-descriptions-item label="账户余额">¥{{ selectedTransaction.balance?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="交易状态">
          <el-tag :type="getStatusTag(selectedTransaction.status)">
            {{ getStatusLabel(selectedTransaction.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="交易时间">{{ selectedTransaction.createTime }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ selectedTransaction.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Money, Wallet, TrendCharts, List, Download } from '@element-plus/icons-vue'

// 搜索表单
const searchForm = reactive({
  keyword: '',
  transactionType: '',
  paymentMethod: '',
  dateRange: []
})

// 统计数据
const stats = ref({
  totalIncome: 0,
  totalExpense: 0,
  netAmount: 0,
  totalCount: 0
})

// 交易记录列表
const transactionList = ref([])
const loading = ref(false)

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 详情对话框
const detailsDialogVisible = ref(false)
const selectedTransaction = ref({})

// 模拟交易数据
const mockTransactions = [
  {
    id: 'TXN001',
    transactionNo: 'TXN20240115001',
    username: 'zhangsan',
    nickname: '张三',
    type: 'income',
    amount: 100.00,
    paymentMethod: 'alipay',
    balance: 1250.50,
    status: 'success',
    createTime: '2024-01-15 15:30:00',
    remark: '账户充值'
  },
  {
    id: 'TXN002',
    transactionNo: 'TXN20240115002',
    username: 'lisi',
    nickname: '李四',
    type: 'expense',
    amount: 25.00,
    paymentMethod: 'balance',
    balance: 1150.50,
    status: 'success',
    createTime: '2024-01-15 14:20:00',
    remark: '购买权益商品'
  },
  {
    id: 'TXN003',
    transactionNo: 'TXN20240115003',
    username: 'wangwu',
    nickname: '王五',
    type: 'income',
    amount: 50.00,
    paymentMethod: 'system',
    balance: 1175.50,
    status: 'success',
    createTime: '2024-01-15 10:15:00',
    remark: '活动奖励'
  },
  {
    id: 'TXN004',
    transactionNo: 'TXN20240115004',
    username: 'zhaoliu',
    nickname: '赵六',
    type: 'expense',
    amount: 35.00,
    paymentMethod: 'wechat',
    balance: 1140.50,
    status: 'success',
    createTime: '2024-01-15 09:30:00',
    remark: '购买电影票券'
  }
]

// 获取交易类型标签
const getTransactionTypeTag = (type) => {
  return type === 'income' ? 'success' : 'danger'
}

// 获取交易类型标签文本
const getTransactionTypeLabel = (type) => {
  return type === 'income' ? '收入' : '支出'
}

// 获取支付方式标签文本
const getPaymentMethodLabel = (method) => {
  const labelMap = {
    alipay: '支付宝',
    wechat: '微信支付',
    bank: '银行卡',
    balance: '余额支付',
    system: '系统调账'
  }
  return labelMap[method] || method
}

// 获取状态标签
const getStatusTag = (status) => {
  const tagMap = {
    success: 'success',
    pending: 'warning',
    failed: 'danger'
  }
  return tagMap[status] || ''
}

// 获取状态标签文本
const getStatusLabel = (status) => {
  const labelMap = {
    success: '成功',
    pending: '处理中',
    failed: '失败'
  }
  return labelMap[status] || status
}

// 计算统计数据
const calculateStats = () => {
  const income = mockTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const expense = mockTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  
  stats.value = {
    totalIncome: income,
    totalExpense: expense,
    netAmount: income - expense,
    totalCount: mockTransactions.length
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
    keyword: '',
    transactionType: '',
    paymentMethod: '',
    dateRange: []
  })
  handleSearch()
}

// 查看详情
const handleViewDetails = (row) => {
  selectedTransaction.value = row
  detailsDialogVisible.value = true
}

// 导出数据
const handleExport = () => {
  ElMessage.success('导出功能开发中...')
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
const loadTransactionList = () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    transactionList.value = mockTransactions
    pagination.total = mockTransactions.length
    loading.value = false
  }, 500)
}

onMounted(() => {
  calculateStats()
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

.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  height: 120px;
}

.stats-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stats-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 24px;
  color: #fff;
}

.income-icon { background-color: #67C23A; }
.expense-icon { background-color: #F56C6C; }
.balance-icon { background-color: #409EFF; }
.count-icon { background-color: #E6A23C; }

.stats-info {
  flex: 1;
}

.stats-number {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.stats-label {
  font-size: 14px;
  color: #909399;
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
