<template>
  <div class="order-management">
    <!-- 搜索和操作栏 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入订单号或用户名"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.status" placeholder="订单状态" clearable>
            <el-option label="待支付" value="pending" />
            <el-option label="已支付" value="paid" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="退款中" value="refunding" />
            <el-option label="已退款" value="refunded" />
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

    <!-- 订单列表 -->
    <el-card class="table-card">
      <el-table :data="orderList" stripe v-loading="loading">
        <el-table-column prop="orderNo" label="订单号" width="150" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="benefitName" label="权益商品" width="200" />
        <el-table-column prop="amount" label="订单金额" width="120">
          <template #default="scope">
            <span class="order-amount">¥{{ scope.row.amount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="100">
          <template #default="scope">
            <el-tag>{{ getPaymentMethodLabel(scope.row.paymentMethod) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="下单时间" width="160" />
        <el-table-column prop="payTime" label="支付时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleViewDetails(scope.row)">详情</el-button>
            <el-button 
              v-if="scope.row.status === 'pending'"
              size="small" 
              type="success" 
              @click="handleConfirmPayment(scope.row)"
            >确认支付</el-button>
            <el-button 
              v-if="scope.row.status === 'paid'"
              size="small" 
              type="primary" 
              @click="handleCompleteOrder(scope.row)"
            >完成订单</el-button>
            <el-button 
              v-if="scope.row.status === 'pending'"
              size="small" 
              type="danger" 
              @click="handleCancelOrder(scope.row)"
            >取消订单</el-button>
            <el-button 
              v-if="scope.row.status === 'paid' || scope.row.status === 'completed'"
              size="small" 
              type="warning" 
              @click="handleRefund(scope.row)"
            >申请退款</el-button>
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

    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="detailsDialogVisible"
      title="订单详情"
      width="900px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ selectedOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ selectedOrder.username }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ selectedOrder.nickname }}</el-descriptions-item>
        <el-descriptions-item label="权益商品">{{ selectedOrder.benefitName }}</el-descriptions-item>
        <el-descriptions-item label="订单金额">¥{{ selectedOrder.amount?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ getPaymentMethodLabel(selectedOrder.paymentMethod) }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusTag(selectedOrder.status)">
            {{ getStatusLabel(selectedOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ selectedOrder.createTime }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ selectedOrder.payTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ selectedOrder.completeTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ selectedOrder.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <!-- 订单流程 -->
      <div class="order-timeline">
        <h4>订单流程</h4>
        <el-timeline>
          <el-timeline-item
            v-for="(activity, index) in orderTimeline"
            :key="index"
            :timestamp="activity.timestamp"
            :type="activity.type"
          >
            {{ activity.content }}
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>

    <!-- 退款对话框 -->
    <el-dialog
      v-model="refundDialogVisible"
      title="申请退款"
      width="500px"
    >
      <el-form
        ref="refundFormRef"
        :model="refundForm"
        :rules="refundFormRules"
        label-width="100px"
      >
        <el-form-item label="退款金额" prop="amount">
          <el-input-number
            v-model="refundForm.amount"
            :min="0.01"
            :max="selectedOrder.amount"
            :precision="2"
            :step="0.01"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="退款原因" prop="reason">
          <el-select v-model="refundForm.reason" placeholder="请选择退款原因" style="width: 100%">
            <el-option label="商品质量问题" value="quality_issue" />
            <el-option label="服务不满意" value="service_unsatisfied" />
            <el-option label="重复购买" value="duplicate_purchase" />
            <el-option label="其他原因" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="详细说明" prop="description">
          <el-input
            v-model="refundForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入详细说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRefundSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: '',
  paymentMethod: '',
  dateRange: []
})

// 订单列表数据
const orderList = ref([])
const loading = ref(false)

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 详情对话框
const detailsDialogVisible = ref(false)
const selectedOrder = ref({})
const orderTimeline = ref([])

// 退款对话框
const refundDialogVisible = ref(false)
const refundFormRef = ref(null)
const refundForm = reactive({
  orderId: '',
  amount: 0,
  reason: '',
  description: ''
})

// 表单验证规则
const refundFormRules = {
  amount: [
    { required: true, message: '请输入退款金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '金额必须大于0', trigger: 'blur' }
  ],
  reason: [
    { required: true, message: '请选择退款原因', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入详细说明', trigger: 'blur' }
  ]
}

// 模拟订单数据
const mockOrders = [
  {
    id: 'ORD001',
    orderNo: 'ORD20240115001',
    username: 'zhangsan',
    nickname: '张三',
    benefitName: 'VIP会员月卡',
    amount: 99.00,
    paymentMethod: 'alipay',
    status: 'completed',
    createTime: '2024-01-15 10:00:00',
    payTime: '2024-01-15 10:05:00',
    completeTime: '2024-01-15 10:10:00',
    remark: '用户主动购买'
  },
  {
    id: 'ORD002',
    orderNo: 'ORD20240115002',
    username: 'lisi',
    nickname: '李四',
    benefitName: '电影票券',
    amount: 35.00,
    paymentMethod: 'wechat',
    status: 'paid',
    createTime: '2024-01-15 11:00:00',
    payTime: '2024-01-15 11:02:00',
    completeTime: null,
    remark: '活动优惠购买'
  },
  {
    id: 'ORD003',
    orderNo: 'ORD20240115003',
    username: 'wangwu',
    nickname: '王五',
    benefitName: '咖啡券',
    amount: 25.00,
    paymentMethod: 'balance',
    status: 'pending',
    createTime: '2024-01-15 12:00:00',
    payTime: null,
    completeTime: null,
    remark: '余额支付'
  },
  {
    id: 'ORD004',
    orderNo: 'ORD20240115004',
    username: 'zhaoliu',
    nickname: '赵六',
    benefitName: '购物券',
    amount: 50.00,
    paymentMethod: 'bank',
    status: 'cancelled',
    createTime: '2024-01-15 13:00:00',
    payTime: null,
    completeTime: null,
    remark: '用户取消'
  }
]

// 获取支付方式标签文本
const getPaymentMethodLabel = (method) => {
  const labelMap = {
    alipay: '支付宝',
    wechat: '微信支付',
    bank: '银行卡',
    balance: '余额支付'
  }
  return labelMap[method] || method
}

// 获取状态标签
const getStatusTag = (status) => {
  const tagMap = {
    pending: 'warning',
    paid: 'primary',
    completed: 'success',
    cancelled: 'info',
    refunding: 'warning',
    refunded: 'info'
  }
  return tagMap[status] || ''
}

// 获取状态标签文本
const getStatusLabel = (status) => {
  const labelMap = {
    pending: '待支付',
    paid: '已支付',
    completed: '已完成',
    cancelled: '已取消',
    refunding: '退款中',
    refunded: '已退款'
  }
  return labelMap[status] || status
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadOrderList()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    status: '',
    paymentMethod: '',
    dateRange: []
  })
  handleSearch()
}

// 查看订单详情
const handleViewDetails = (row) => {
  selectedOrder.value = row
  // 生成订单流程时间线
  generateOrderTimeline(row)
  detailsDialogVisible.value = true
}

// 生成订单流程时间线
const generateOrderTimeline = (order) => {
  const timeline = []
  
  // 下单
  timeline.push({
    content: '用户下单',
    timestamp: order.createTime,
    type: 'primary'
  })
  
  // 支付
  if (order.payTime) {
    timeline.push({
      content: '支付成功',
      timestamp: order.payTime,
      type: 'success'
    })
  }
  
  // 完成
  if (order.completeTime) {
    timeline.push({
      content: '订单完成',
      timestamp: order.completeTime,
      type: 'success'
    })
  }
  
  // 取消
  if (order.status === 'cancelled') {
    timeline.push({
      content: '订单取消',
      timestamp: order.createTime,
      type: 'danger'
    })
  }
  
  orderTimeline.value = timeline
}

// 确认支付
const handleConfirmPayment = (row) => {
  ElMessageBox.confirm(
    `确定要确认订单 "${row.orderNo}" 的支付吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    row.status = 'paid'
    row.payTime = new Date().toLocaleString()
    ElMessage.success('支付确认成功')
  })
}

// 完成订单
const handleCompleteOrder = (row) => {
  ElMessageBox.confirm(
    `确定要完成订单 "${row.orderNo}" 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    row.status = 'completed'
    row.completeTime = new Date().toLocaleString()
    ElMessage.success('订单完成成功')
  })
}

// 取消订单
const handleCancelOrder = (row) => {
  ElMessageBox.confirm(
    `确定要取消订单 "${row.orderNo}" 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    row.status = 'cancelled'
    ElMessage.success('订单取消成功')
  })
}

// 申请退款
const handleRefund = (row) => {
  refundForm.orderId = row.id
  refundForm.amount = row.amount
  refundForm.reason = ''
  refundForm.description = ''
  refundDialogVisible.value = true
}

// 提交退款
const handleRefundSubmit = async () => {
  try {
    await refundFormRef.value.validate()
    // 这里调用退款API
    ElMessage.success('退款申请提交成功')
    refundDialogVisible.value = false
    loadOrderList()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadOrderList()
}

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.currentPage = page
  loadOrderList()
}

// 加载订单列表
const loadOrderList = () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    orderList.value = mockOrders
    pagination.total = mockOrders.length
    loading.value = false
  }, 500)
}

onMounted(() => {
  loadOrderList()
})
</script>

<style scoped>
.order-management {
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

.order-amount {
  font-weight: bold;
  color: #F56C6C;
}

.order-timeline {
  margin-top: 20px;
}

.order-timeline h4 {
  margin-bottom: 15px;
  color: #303133;
}
</style>
