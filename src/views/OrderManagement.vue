<template>
  <div class="order-management">
    <!-- 搜索和操作栏 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="4">
          <el-input
            v-model="searchForm.orderNo"
            placeholder="请输入订单号"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-input
            v-model="searchForm.account"
            placeholder="请输入用户账号"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.status" placeholder="订单状态" clearable>
            <el-option label="待支付" :value="0" />
            <el-option label="已支付" :value="1" />
            <el-option label="已发货" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.itemType" placeholder="商品类型" clearable>
            <el-option label="权益产品" :value="1" />
            <el-option label="权益包" :value="2" />
            <el-option label="其他类型" :value="3" />
          </el-select>
        </el-col>

        <el-col :span="4">
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
      <el-table :data="orderList" stripe v-loading="loading" border>
        <el-table-column prop="orderNo" label="订单号" width="150" />
        <el-table-column prop="account" label="用户账号" width="120" />
        <el-table-column label="商品信息" width="300">
          <template #default="scope">
            <div v-for="(item, index) in scope.row.items" :key="index" class="item-row">
              <div class="item-info">
                <span class="item-name">{{ item.itemName }}</span>
                <el-tag :type="getItemTypeTag(item.itemType)" size="small" class="item-type-tag">
                  {{ getItemTypeLabel(item.itemType) }}
                </el-tag>
              </div>
              <div class="item-details">
                <span>数量: {{ item.quantity }}</span>
                <span>单价: {{ item.pointPrice }}积分</span>
                <span>小计: {{ item.totalPoint }}积分</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="总价(积分)" width="120">
          <template #default="scope">
            <span class="order-amount">{{ scope.row.totalPoint || 0 }}积分</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="订单状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="160">
          <template #default="scope">
            {{ formatDateTime(scope.row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleViewDetails(scope.row)">详情</el-button>
            <el-button 
              v-if="scope.row.status === 0"
              size="small" 
              type="success" 
              @click="handleConfirmPayment(scope.row)"
            >确认支付</el-button>
            <el-button 
              v-if="scope.row.status === 1"
              size="small" 
              type="primary" 
              @click="handleCompleteOrder(scope.row)"
            >完成订单</el-button>
            <el-button 
              v-if="scope.row.status === 0"
              size="small" 
              type="danger" 
              @click="handleCancelOrder(scope.row)"
            >取消订单</el-button>
            <el-button 
              v-if="scope.row.status === 1 || scope.row.status === 3"
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
        <el-descriptions-item label="用户账号">{{ selectedOrder.account || '-' }}</el-descriptions-item>
        <el-descriptions-item label="地址ID">{{ selectedOrder.addressId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusTag(selectedOrder.status)">
            {{ getStatusLabel(selectedOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="总价">{{ selectedOrder.totalPoint || 0 }}积分</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(selectedOrder.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDateTime(selectedOrder.updateTime) }}</el-descriptions-item>
      </el-descriptions>

      <!-- 商品列表 -->
      <div class="order-items">
        <h4>商品列表</h4>
        <el-table :data="selectedOrder.items || []" border>
          <el-table-column prop="itemName" label="商品名称" width="200" />
          <el-table-column prop="itemType" label="商品类型" width="120">
            <template #default="scope">
              <el-tag :type="getItemTypeTag(scope.row.itemType)">
                {{ getItemTypeLabel(scope.row.itemType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column prop="pointPrice" label="单价(积分)" width="120" />
          <el-table-column prop="totalPoint" label="小计(积分)" width="120" />
        </el-table>
      </div>

      <!-- 订单流程 -->
      <div class="order-timeline">
        <h4>订单流程</h4>
        <el-timeline>
          <el-timeline-item 
            type="primary"
            :timestamp="formatDateTime(selectedOrder.createTime)"
          >
            订单创建
          </el-timeline-item>
          <el-timeline-item 
            v-if="selectedOrder.status >= 1" 
            type="success"
            :timestamp="formatDateTime(selectedOrder.updateTime)"
          >
            订单支付
          </el-timeline-item>
          <el-timeline-item 
            v-if="selectedOrder.status >= 2" 
            type="info"
            :timestamp="formatDateTime(selectedOrder.updateTime)"
          >
            订单发货
          </el-timeline-item>
          <el-timeline-item 
            v-if="selectedOrder.status === 3" 
            type="success"
            :timestamp="formatDateTime(selectedOrder.updateTime)"
          >
            订单完成
          </el-timeline-item>
          <el-timeline-item 
            v-if="selectedOrder.status === 4" 
            type="danger"
            :timestamp="formatDateTime(selectedOrder.updateTime)"
          >
            订单取消
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
        <el-form-item label="退款积分" prop="amount">
          <el-input-number
            v-model="refundForm.amount"
            :min="1"
            :max="selectedOrder.totalPoint"
            :precision="0"
            :step="1"
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
import { Search, Refresh, User } from '@element-plus/icons-vue'
import { queryOrderMain } from '@/api/user'

// 搜索表单
const searchForm = reactive({
  orderNo: '',
  account: '',
  status: null,
  itemType: null,
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
    { required: true, message: '请输入退款积分', trigger: 'blur' },
    { type: 'number', min: 1, message: '积分必须大于0', trigger: 'blur' }
  ],
  reason: [
    { required: true, message: '请选择退款原因', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入详细说明', trigger: 'blur' }
  ]
}




// 获取状态标签
const getStatusTag = (status) => {
  const tagMap = {
    0: 'warning',  // 待支付
    1: 'primary',  // 已支付
    2: 'info',     // 已发货
    3: 'success',  // 已完成
    4: 'danger'    // 已取消
  }
  return tagMap[status] || ''
}

// 获取状态标签文本
const getStatusLabel = (status) => {
  const labelMap = {
    0: '待支付',
    1: '已支付',
    2: '已发货',
    3: '已完成',
    4: '已取消'
  }
  return labelMap[status] || status
}

// 获取商品类型标签
const getItemTypeTag = (itemType) => {
  const tagMap = {
    1: 'primary',  // 权益产品
    2: 'success',  // 权益包
    3: 'info'      // 其他类型
  }
  return tagMap[itemType] || ''
}

// 获取商品类型标签文本
const getItemTypeLabel = (itemType) => {
  const labelMap = {
    1: '权益产品',
    2: '权益包',
    3: '其他类型'
  }
  return labelMap[itemType] || '未知类型'
}

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  try {
    const date = new Date(dateTime)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    return dateTime
  }
}

// 合并相同订单号的数据
const mergeOrdersByOrderNo = (orders) => {
  const orderMap = new Map()
  
  orders.forEach(order => {
    const orderNo = order.orderNo
    
    if (orderMap.has(orderNo)) {
      // 如果订单号已存在，将商品信息添加到商品列表中
      const existingOrder = orderMap.get(orderNo)
      existingOrder.items.push({
        itemName: order.itemName,
        itemType: order.itemType,
        quantity: order.quantity,
        pointPrice: order.pointPrice,
        totalPoint: order.totalPoint
      })
      // 累加总积分
      existingOrder.totalPoint += order.totalPoint
    } else {
      // 如果订单号不存在，创建新的订单记录
      orderMap.set(orderNo, {
        orderNo: order.orderNo,
        userId: order.userId,
        account: order.account,
        orderId: order.orderId,
        addressId: order.addressId,
        status: order.status,
        totalPoint: order.totalPoint,
        createTime: order.createTime,
        updateTime: order.updateTime,
        items: [{
          itemName: order.itemName,
          itemType: order.itemType,
          quantity: order.quantity,
          pointPrice: order.pointPrice,
          totalPoint: order.totalPoint
        }]
      })
    }
  })
  
  // 将Map转换为数组
  return Array.from(orderMap.values())
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadOrderList()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    orderNo: '',
    account: '',
    status: null,
    itemType: null,
    dateRange: []
  })
  handleSearch()
}

// 查看订单详情
const handleViewDetails = (row) => {
  selectedOrder.value = row
  detailsDialogVisible.value = true
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
    row.status = 1
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
    row.status = 3
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
    row.status = 4
    ElMessage.success('订单取消成功')
  })
}

// 申请退款
const handleRefund = (row) => {
  refundForm.orderId = row.orderId
  refundForm.amount = row.totalPoint
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
const loadOrderList = async () => {
  loading.value = true
  try {
    // 构建请求参数
    const request = {
      orderNo: searchForm.orderNo || null,
      account: searchForm.account || null,
      status: searchForm.status,
      itemType: searchForm.itemType,
      pageNum: pagination.currentPage,
      pageSize: pagination.pageSize
    }
    
    // 调用后端API
    const response = await queryOrderMain(request)
    
    if (response && response.data && response.data.data) {
      // 合并相同订单号的数据
      const mergedOrders = mergeOrdersByOrderNo(response.data.data || [])
      orderList.value = mergedOrders
      pagination.total = response.data.total || 0
    } else {
      orderList.value = []
      pagination.total = 0
    }
  } catch (error) {
    console.error('获取订单列表失败:', error)
    ElMessage.error('获取订单列表失败')
    orderList.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
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

.order-items {
  margin-top: 20px;
}

.order-items h4 {
  margin-bottom: 15px;
  color: #303133;
}

.item-row {
  margin-bottom: 8px;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.item-row:last-child {
  margin-bottom: 0;
}

.item-info {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.item-name {
  font-weight: 500;
  margin-right: 8px;
  color: #303133;
}

.item-type-tag {
  margin-left: auto;
}

.item-details {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #606266;
}

.item-details span {
  margin-right: 12px;
}
</style>
