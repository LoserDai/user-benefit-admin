<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; color: #303133;">数据概览</h3>
        <el-button 
          type="text" 
          size="small" 
          @click="fetchCount"
          style="margin: 0;"
        >
          <el-icon><Refresh /></el-icon>
          刷新统计
        </el-button>
      </div>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon user-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.totalUsers }}</div>
              <div class="stats-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon benefit-icon">
              <el-icon><Present /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.totalBenefits }}</div>
              <div class="stats-label">权益商品数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon order-icon">
              <el-icon><List /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.totalOrders }}</div>
              <div class="stats-label">总订单数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon revenue-icon">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="stats-info">
                             <div class="stats-number">{{ stats.totalRevenue }}</div>
              <div class="stats-label">总订单积分</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>用户增长趋势</span>
            <el-button 
              type="text" 
              size="small" 
              @click="fetchUserRegisterCount"
              :loading="userChartLoading"
              style="float: right; margin-top: -5px;"
            >
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </template>
          <div v-loading="userChartLoading" class="chart-container">
            <div ref="userChartRef" class="chart-content"></div>
            <div v-if="!userChartLoading && userGrowthData.length === 0" class="chart-empty">
              <el-empty description="暂无数据" />
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>订单统计</span>
            <el-button 
              type="text" 
              size="small" 
              @click="fetchOrderCount"
              style="float: right; margin-top: -5px;"
            >
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </template>
          <div ref="orderChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近活动 -->
    <el-row :gutter="20" class="activity-row">
      <el-col :span="24">
                 <el-card class="activity-card">
           <template #header>
             <span>最近订单</span>
             <el-button 
               type="text" 
               size="small" 
               @click="fetchRecentOrders"
               style="float: right; margin-top: -5px;"
             >
               <el-icon><Refresh /></el-icon>
               刷新
             </el-button>
           </template>
                     <el-table :data="recentOrders" stripe border :row-style="{ height: 'auto' }" :cell-style="{ padding: '12px 0' }">
             <el-table-column prop="orderNo" label="订单号" width="180" />
                           <el-table-column label="商品信息" min-width="250">
                <template #default="scope">
                  <div class="order-items-container">
                    <div v-for="(item, index) in scope.row.items" :key="index" class="order-item">
                      <div class="item-name">{{ item.itemName }}</div>
                      <div class="item-details">
                        <span class="quantity">数量: {{ item.quantity }}</span>
                        <span class="price">单价: {{ item.pointPrice }}积分</span>
                      </div>
                    </div>
                    <div v-if="scope.row.items.length === 0" class="no-items">
                      暂无商品信息
                    </div>
                  </div>
                </template>
              </el-table-column>
             <el-table-column label="总积分" width="100" align="center">
               <template #default="scope">
                 <span class="total-points">{{ scope.row.totalPoints }}</span>
               </template>
             </el-table-column>
             <el-table-column label="状态" width="100" align="center">
               <template #default="scope">
                 <el-tag :type="getStatusType(scope.row.status)">
                   {{ getStatusLabel(scope.row.status) }}
                 </el-tag>
               </template>
             </el-table-column>
                        </el-table>
             <div class="table-footer">
               <el-text size="small" type="info">
                 <el-icon><InfoFilled /></el-icon>
                 显示最近2个订单的所有商品信息
               </el-text>
             </div>
         </el-card>
      </el-col>
      

    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { User, Present, List, Wallet, Refresh, InfoFilled } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getUserRegisterCount, getOrderCount, getCount, queryOrderMain } from '@/api/user'
import { ElMessage } from 'element-plus'

// 统计数据
const stats = ref({
  totalUsers: 0,
  totalBenefits: 0,
  totalOrders: 0,
  totalRevenue: 0
})

// 最近订单数据
const recentOrders = ref([])



// 图表引用
const userChartRef = ref(null)
const orderChartRef = ref(null)

// 用户增长图表加载状态
const userChartLoading = ref(false)

// 用户增长趋势数据
const userGrowthData = ref([])

// 订单统计数据
const orderData = ref([])

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    0: 'info',      // 待支付
    1: 'warning',   // 已支付
    2: 'primary',   // 已发货
    3: 'success',   // 已完成
    4: 'danger'     // 已取消
  }
  return statusMap[status] || 'info'
}

// 获取状态标签
const getStatusLabel = (status) => {
  const statusMap = {
    0: '待支付',
    1: '已支付',
    2: '已发货',
    3: '已完成',
    4: '已取消'
  }
  return statusMap[status] || '未知状态'
}

// 获取用户注册统计数据
const fetchUserRegisterCount = async () => {
  userChartLoading.value = true
  try {
    const response = await getUserRegisterCount()
    if (response.code === 200 && response.data) {
      userGrowthData.value = response.data
      // 数据获取成功后重新初始化图表
      nextTick(() => {
        initUserChart()
      })
    } else {
      ElMessage.error(response.message || '获取用户注册统计数据失败')
    }
  } catch (error) {
    console.error('获取用户注册统计数据失败:', error)
    ElMessage.error('获取用户注册统计数据失败，请稍后重试')
  } finally {
    userChartLoading.value = false
  }
}

// 获取订单统计数据
const fetchOrderCount = async () => {
  try {
    const response = await getOrderCount()
    if (response.code === 200 && response.data) {
      orderData.value = response.data
      // 数据获取成功后重新初始化图表
      nextTick(() => {
        initOrderChart()
      })
    } else {
      ElMessage.error(response.message || '获取订单统计数据失败')
    }
  } catch (error) {
    console.error('获取订单统计数据失败:', error)
    ElMessage.error('获取订单统计数据失败，请稍后重试')
  }
}

// 获取仪表盘统计数据
const fetchCount = async () => {
  try {
    const response = await getCount()
    if (response.code === 200 && response.data) {
      const data = response.data
      stats.value = {
        totalUsers: data.userCount || 0,
        totalBenefits: data.productCount || 0,
        totalOrders: data.orderMainCount || 0,
        totalRevenue: data.orderPointsCount || 0
      }
    } else {
      ElMessage.error(response.message || '获取统计数据失败')
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败，请稍后重试')
  }
}

// 获取最近订单数据
const fetchRecentOrders = async () => {
  try {
    const request = {
      pageNum: 1,
      pageSize: 20 // 增加页面大小以获取更多数据
    }
    const response = await queryOrderMain(request)
    if (response.code === 200 && response.data) {
      // 处理订单数据，合并相同订单号的商品
      const orderMap = new Map()
      
      response.data.data.forEach(item => {
        const orderNo = item.orderNo
        if (!orderMap.has(orderNo)) {
          orderMap.set(orderNo, {
            orderNo: orderNo,
            orderId: item.orderId,
            status: item.status,
            items: [],
            totalPoints: 0
          })
        }
        
        const order = orderMap.get(orderNo)
        // 显示所有商品，不限制数量
        order.items.push({
          itemName: item.itemName,
          quantity: item.quantity,
          pointPrice: item.pointPrice,
          totalPoint: item.totalPoint
        })
        order.totalPoints += item.totalPoint
      })
      
      // 转换为数组并排序，只显示最近2个订单
      recentOrders.value = Array.from(orderMap.values())
        .sort((a, b) => b.orderId - a.orderId)
        .slice(0, 2)
    } else {
      ElMessage.error(response.message || '获取订单数据失败')
    }
  } catch (error) {
    console.error('获取订单数据失败:', error)
    ElMessage.error('获取订单数据失败，请稍后重试')
  }
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

// 初始化用户增长图表
const initUserChart = () => {
  if (!userChartRef.value) return
  
  const chart = echarts.init(userChartRef.value)
  
  // 处理数据格式
  const dates = userGrowthData.value.map(item => formatDate(item.registerDate))
  const counts = userGrowthData.value.map(item => item.userCount)
  
  const option = {
    tooltip: { 
      trigger: 'axis',
      formatter: function(params) {
        const data = params[0]
        return `${data.name}<br/>注册用户: ${data.value}人`
      }
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: 45,
        fontSize: 12
      }
    },
    yAxis: { 
      type: 'value',
      name: '用户数',
      minInterval: 1, // 强制最小间隔为1，确保只显示整数
      axisLabel: {
        formatter: '{value}人'
      }
    },
    series: [{
      name: '注册用户数',
      data: counts,
      type: 'line',
      smooth: true,
      areaStyle: {
        opacity: 0.3
      },
      itemStyle: {
        color: '#409EFF'
      },
      lineStyle: {
        color: '#409EFF',
        width: 3
      }
    }],
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '15%'
    }
  }
  
  chart.setOption(option)
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

// 订单状态映射
const getOrderStatusLabel = (status) => {
  const statusMap = {
    0: '待支付',
    1: '已支付',
    2: '已发货',
    3: '已完成',
    4: '已取消'
  }
  return statusMap[status] || '未知状态'
}

// 订单状态颜色映射
const getOrderStatusColor = (status) => {
  const colorMap = {
    0: '#E6A23C', // 待支付 - 橙色
    1: '#409EFF', // 已支付 - 蓝色
    2: '#67C23A', // 已发货 - 绿色
    3: '#67C23A', // 已完成 - 绿色
    4: '#F56C6C'  // 已取消 - 红色
  }
  return colorMap[status] || '#909399'
}

// 初始化订单统计图表
const initOrderChart = () => {
  if (!orderChartRef.value) return
  
  const chart = echarts.init(orderChartRef.value)
  
  // 处理数据格式，按状态排序
  const sortedData = orderData.value
    .sort((a, b) => a.orderStatus - b.orderStatus)
    .map(item => ({
      value: item.orderCount,
      name: getOrderStatusLabel(item.orderStatus),
      itemStyle: {
        color: getOrderStatusColor(item.orderStatus)
      }
    }))
  
  const option = {
    tooltip: { 
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle',
      textStyle: {
        fontSize: 12
      }
    },
    series: [{
      name: '订单状态',
      type: 'pie',
      radius: '50%',
      center: ['60%', '50%'],
      data: sortedData,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      label: {
        show: true,
        formatter: '{b}: {c}'
      }
    }]
  }
  
  chart.setOption(option)
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

onMounted(() => {
  // 获取仪表盘统计数据
  fetchCount()
  
  // 获取用户注册统计数据
  fetchUserRegisterCount()
  
  // 获取订单统计数据
  fetchOrderCount()
  
  // 获取最近订单数据
  fetchRecentOrders()
  
  nextTick(() => {
    // 图表初始化会在数据获取成功后自动调用
  })
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
  width: 100%;
  min-height: 100%;
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

.user-icon { background-color: #409EFF; }
.benefit-icon { background-color: #67C23A; }
.order-icon { background-color: #E6A23C; }
.revenue-icon { background-color: #F56C6C; }

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

.charts-row {
  margin-bottom: 20px;
}

.chart-card {
  height: 400px;
}

.chart-container {
  height: 320px;
}

.chart-content {
  height: 100%;
}

.chart-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-row {
  margin-bottom: 20px;
}

.activity-card {
  height: 900px; /* 进一步增加卡片高度，确保能完全显示所有数据 */
}

/* 订单商品样式 */
.order-items-container {
  padding: 8px 0;
  min-height: 120px; /* 确保商品容器有足够的最小高度 */
}

.order-item {
  padding: 16px; /* 增加内边距，确保商品项有足够的空间 */
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
  margin-bottom: 10px; /* 增加商品项之间的间距 */
  border-radius: 6px;
}

.order-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.item-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.4;
}

.item-details {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #606266;
  background-color: #fff;
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.quantity {
  margin-right: 15px;
  color: #409EFF;
  font-weight: 500;
}

.price {
  color: #67C23A;
  font-weight: 500;
}

.total-points {
  font-weight: 600;
  color: #409EFF;
  font-size: 16px;
}

.no-items {
  text-align: center;
  color: #909399;
  font-style: italic;
  padding: 20px 0;
}

.table-footer {
  padding: 16px 0; /* 增加上下内边距 */
  text-align: center;
  border-top: 1px solid #f0f0f0;
  margin-top: 20px; /* 增加与表格的间距 */
}

.table-footer .el-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

</style>
