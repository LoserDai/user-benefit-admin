<template>
  <div class="account-query">
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
          <el-select v-model="searchForm.accountType" placeholder="账户类型" clearable>
            <el-option label="个人账户" value="personal" />
            <el-option label="企业账户" value="enterprise" />
            <el-option label="VIP账户" value="vip" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.status" placeholder="账户状态" clearable>
            <el-option label="正常" value="active" />
            <el-option label="冻结" value="frozen" />
            <el-option label="注销" value="closed" />
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
          <el-button type="success" @click="handleRecharge">
            <el-icon><Money /></el-icon>
            批量充值
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 账户列表 -->
    <el-card class="table-card">
      <el-table :data="accountList" stripe v-loading="loading" border>
        <el-table-column prop="id" label="账户ID" width="100" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="accountType" label="账户类型" width="100">
          <template #default="scope">
            <el-tag :type="getAccountTypeTag(scope.row.accountType)">
              {{ getAccountTypeLabel(scope.row.accountType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="账户余额" width="120">
          <template #default="scope">
            <span class="balance-amount">¥{{ scope.row.balance.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="开户时间" width="160" />
        <el-table-column prop="lastUpdateTime" label="最后更新" width="160" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleViewDetails(scope.row)">详情</el-button>
            <el-button size="small" type="primary" @click="handleRechargeSingle(scope.row)">充值</el-button>
            <el-button size="small" type="warning" @click="handleAdjustBalance(scope.row)">调账</el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === 'active' ? 'danger' : 'success'"
              @click="handleToggleStatus(scope.row)"
            >
              {{ scope.row.status === 'active' ? '冻结' : '解冻' }}
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

    <!-- 充值对话框 -->
    <el-dialog
      v-model="rechargeDialogVisible"
      :title="rechargeDialogTitle"
      width="500px"
    >
      <el-form
        ref="rechargeFormRef"
        :model="rechargeForm"
        :rules="rechargeFormRules"
        label-width="100px"
      >
        <el-form-item label="充值金额" prop="amount">
          <el-input-number
            v-model="rechargeForm.amount"
            :min="0.01"
            :precision="2"
            :step="0.01"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="充值方式" prop="method">
          <el-select v-model="rechargeForm.method" placeholder="请选择充值方式" style="width: 100%">
            <el-option label="支付宝" value="alipay" />
            <el-option label="微信支付" value="wechat" />
            <el-option label="银行卡" value="bank" />
            <el-option label="系统调账" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="rechargeForm.remark" type="textarea" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rechargeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRechargeSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 调账对话框 -->
    <el-dialog
      v-model="adjustDialogVisible"
      title="账户调账"
      width="500px"
    >
      <el-form
        ref="adjustFormRef"
        :model="adjustForm"
        :rules="adjustFormRules"
        label-width="100px"
      >
        <el-form-item label="调账类型" prop="type">
          <el-radio-group v-model="adjustForm.type">
            <el-radio label="increase">增加</el-radio>
            <el-radio label="decrease">减少</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="调账金额" prop="amount">
          <el-input-number
            v-model="adjustForm.amount"
            :min="0.01"
            :precision="2"
            :step="0.01"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="调账原因" prop="reason">
          <el-select v-model="adjustForm.reason" placeholder="请选择调账原因" style="width: 100%">
            <el-option label="系统错误修正" value="system_error" />
            <el-option label="活动奖励" value="activity_reward" />
            <el-option label="客服处理" value="customer_service" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="详细说明" prop="description">
          <el-input v-model="adjustForm.description" type="textarea" placeholder="请输入详细说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAdjustSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 账户详情对话框 -->
    <el-dialog
      v-model="detailsDialogVisible"
      title="账户详情"
      width="800px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="账户ID">{{ selectedAccount.id }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ selectedAccount.username }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ selectedAccount.nickname }}</el-descriptions-item>
        <el-descriptions-item label="账户类型">{{ getAccountTypeLabel(selectedAccount.accountType) }}</el-descriptions-item>
        <el-descriptions-item label="账户余额">¥{{ selectedAccount.balance?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="积分">{{ selectedAccount.points }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ getStatusLabel(selectedAccount.status) }}</el-descriptions-item>
        <el-descriptions-item label="开户时间">{{ selectedAccount.createTime }}</el-descriptions-item>
        <el-descriptions-item label="最后更新">{{ selectedAccount.lastUpdateTime }}</el-descriptions-item>
      </el-descriptions>

      <!-- 交易记录 -->
      <div class="transaction-history">
        <h4>最近交易记录</h4>
        <el-table :data="transactionHistory" stripe border>
          <el-table-column prop="time" label="时间" width="160" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="scope">
              <el-tag :type="getTransactionTypeTag(scope.row.type)">
                {{ getTransactionTypeLabel(scope.row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="120">
            <template #default="scope">
              <span :class="scope.row.type === 'income' ? 'income-amount' : 'expense-amount'">
                {{ scope.row.type === 'income' ? '+' : '-' }}¥{{ scope.row.amount.toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="balance" label="余额" width="120" />
          <el-table-column prop="remark" label="备注" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Money } from '@element-plus/icons-vue'

// 搜索表单
const searchForm = reactive({
  keyword: '',
  accountType: '',
  status: ''
})

// 账户列表数据
const accountList = ref([])
const loading = ref(false)

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 充值对话框
const rechargeDialogVisible = ref(false)
const rechargeDialogTitle = ref('')
const rechargeFormRef = ref(null)
const rechargeForm = reactive({
  accountId: '',
  amount: 0,
  method: '',
  remark: ''
})

// 调账对话框
const adjustDialogVisible = ref(false)
const adjustFormRef = ref(null)
const adjustForm = reactive({
  accountId: '',
  type: 'increase',
  amount: 0,
  reason: '',
  description: ''
})

// 详情对话框
const detailsDialogVisible = ref(false)
const selectedAccount = ref({})
const transactionHistory = ref([])

// 表单验证规则
const rechargeFormRules = {
  amount: [
    { required: true, message: '请输入充值金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '金额必须大于0', trigger: 'blur' }
  ],
  method: [
    { required: true, message: '请选择充值方式', trigger: 'change' }
  ]
}

const adjustFormRules = {
  type: [
    { required: true, message: '请选择调账类型', trigger: 'change' }
  ],
  amount: [
    { required: true, message: '请输入调账金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '金额必须大于0', trigger: 'blur' }
  ],
  reason: [
    { required: true, message: '请选择调账原因', trigger: 'change' }
  ]
}

// 模拟账户数据
const mockAccounts = [
  {
    id: 'ACC001',
    username: 'zhangsan',
    nickname: '张三',
    accountType: 'personal',
    balance: 1250.50,
    points: 1250,
    status: 'active',
    createTime: '2024-01-01 10:00:00',
    lastUpdateTime: '2024-01-15 15:30:00'
  },
  {
    id: 'ACC002',
    username: 'lisi',
    nickname: '李四',
    accountType: 'vip',
    balance: 5680.00,
    points: 5680,
    status: 'active',
    createTime: '2024-01-02 11:00:00',
    lastUpdateTime: '2024-01-15 16:20:00'
  },
  {
    id: 'ACC003',
    username: 'wangwu',
    nickname: '王五',
    accountType: 'enterprise',
    balance: 0.00,
    points: 0,
    status: 'frozen',
    createTime: '2024-01-03 12:00:00',
    lastUpdateTime: '2024-01-14 09:15:00'
  }
]

// 模拟交易记录
const mockTransactions = [
  { time: '2024-01-15 15:30:00', type: 'income', amount: 100.00, balance: 1250.50, remark: '充值' },
  { time: '2024-01-15 14:20:00', type: 'expense', amount: 25.00, balance: 1150.50, remark: '购买权益商品' },
  { time: '2024-01-15 10:15:00', type: 'income', amount: 50.00, balance: 1175.50, remark: '活动奖励' }
]

// 获取账户类型标签
const getAccountTypeTag = (type) => {
  const tagMap = {
    personal: '',
    vip: 'warning',
    enterprise: 'success'
  }
  return tagMap[type] || ''
}

// 获取账户类型标签文本
const getAccountTypeLabel = (type) => {
  const labelMap = {
    personal: '个人账户',
    vip: 'VIP账户',
    enterprise: '企业账户'
  }
  return labelMap[type] || type
}

// 获取状态标签
const getStatusTag = (status) => {
  const tagMap = {
    active: 'success',
    frozen: 'warning',
    closed: 'danger'
  }
  return tagMap[status] || ''
}

// 获取状态标签文本
const getStatusLabel = (status) => {
  const labelMap = {
    active: '正常',
    frozen: '冻结',
    closed: '注销'
  }
  return labelMap[status] || status
}

// 获取交易类型标签
const getTransactionTypeTag = (type) => {
  return type === 'income' ? 'success' : 'danger'
}

// 获取交易类型标签文本
const getTransactionTypeLabel = (type) => {
  return type === 'income' ? '收入' : '支出'
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadAccountList()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    accountType: '',
    status: ''
  })
  handleSearch()
}

// 批量充值
const handleRecharge = () => {
  ElMessage.info('请选择要充值的账户')
}

// 单个充值
const handleRechargeSingle = (row) => {
  rechargeDialogTitle.value = `为 ${row.nickname} 充值`
  rechargeForm.accountId = row.id
  rechargeForm.amount = 0
  rechargeForm.method = ''
  rechargeForm.remark = ''
  rechargeDialogVisible.value = true
}

// 调账
const handleAdjustBalance = (row) => {
  adjustForm.accountId = row.id
  adjustForm.type = 'increase'
  adjustForm.amount = 0
  adjustForm.reason = ''
  adjustForm.description = ''
  adjustDialogVisible.value = true
}

// 查看详情
const handleViewDetails = (row) => {
  selectedAccount.value = row
  transactionHistory.value = mockTransactions
  detailsDialogVisible.value = true
}

// 切换状态
const handleToggleStatus = (row) => {
  const action = row.status === 'active' ? '冻结' : '解冻'
  ElMessageBox.confirm(
    `确定要${action}账户 "${row.nickname}" 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    row.status = row.status === 'active' ? 'frozen' : 'active'
    ElMessage.success(`${action}成功`)
  })
}

// 提交充值
const handleRechargeSubmit = async () => {
  try {
    await rechargeFormRef.value.validate()
    // 这里调用充值API
    ElMessage.success('充值成功')
    rechargeDialogVisible.value = false
    loadAccountList()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 提交调账
const handleAdjustSubmit = async () => {
  try {
    await adjustFormRef.value.validate()
    // 这里调用调账API
    ElMessage.success('调账成功')
    adjustDialogVisible.value = false
    loadAccountList()
  } catch (error) {
    console.error('表单验证失败:', error)
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

// 加载账户列表
const loadAccountList = () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    accountList.value = mockAccounts
    pagination.total = mockAccounts.length
    loading.value = false
  }, 500)
}

onMounted(() => {
  loadAccountList()
})
</script>

<style scoped>
.account-query {
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

.balance-amount {
  font-weight: bold;
  color: #67C23A;
}

.transaction-history {
  margin-top: 20px;
}

.transaction-history h4 {
  margin-bottom: 15px;
  color: #303133;
}

.income-amount {
  color: #67C23A;
  font-weight: bold;
}

.expense-amount {
  color: #F56C6C;
  font-weight: bold;
}
</style>
