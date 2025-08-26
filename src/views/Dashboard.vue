<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
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
              <div class="stats-number">¥{{ stats.totalRevenue }}</div>
              <div class="stats-label">总收入</div>
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
          </template>
          <div ref="userChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>订单统计</span>
          </template>
          <div ref="orderChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近活动 -->
    <el-row :gutter="20" class="activity-row">
      <el-col :span="12">
        <el-card class="activity-card">
          <template #header>
            <span>最近订单</span>
          </template>
          <el-table :data="recentOrders" stripe>
            <el-table-column prop="orderNo" label="订单号" width="120" />
            <el-table-column prop="userName" label="用户名" width="100" />
            <el-table-column prop="benefitName" label="权益商品" />
            <el-table-column prop="amount" label="金额" width="80" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="activity-card">
          <template #header>
            <span>系统通知</span>
          </template>
          <div class="notification-list">
            <div 
              v-for="notification in notifications" 
              :key="notification.id"
              class="notification-item"
            >
              <div class="notification-icon">
                <el-icon><Bell /></el-icon>
              </div>
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-time">{{ notification.time }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { User, Present, List, Wallet, Bell } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 统计数据
const stats = ref({
  totalUsers: 12580,
  totalBenefits: 156,
  totalOrders: 8920,
  totalRevenue: '125,680'
})

// 最近订单数据
const recentOrders = ref([
  { orderNo: 'ORD001', userName: '张三', benefitName: 'VIP会员月卡', amount: '99.00', status: '已完成' },
  { orderNo: 'ORD002', userName: '李四', benefitName: '电影票券', amount: '35.00', status: '处理中' },
  { orderNo: 'ORD003', userName: '王五', benefitName: '咖啡券', amount: '25.00', status: '已完成' },
  { orderNo: 'ORD004', userName: '赵六', benefitName: '购物券', amount: '50.00', status: '待支付' }
])

// 系统通知
const notifications = ref([
  { id: 1, title: '系统维护通知', time: '2024-01-15 10:00' },
  { id: 2, title: '新功能上线', time: '2024-01-14 15:30' },
  { id: 3, title: '权益商品更新', time: '2024-01-13 09:15' },
  { id: 4, title: '用户反馈处理', time: '2024-01-12 16:45' }
])

// 图表引用
const userChartRef = ref(null)
const orderChartRef = ref(null)

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    '已完成': 'success',
    '处理中': 'warning',
    '待支付': 'info'
  }
  return statusMap[status] || 'info'
}

// 初始化用户增长图表
const initUserChart = () => {
  const chart = echarts.init(userChartRef.value)
  const option = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: { type: 'value' },
    series: [{
      data: [820, 932, 901, 934, 1290, 1330],
      type: 'line',
      smooth: true,
      areaStyle: {}
    }]
  }
  chart.setOption(option)
}

// 初始化订单统计图表
const initOrderChart = () => {
  const chart = echarts.init(orderChartRef.value)
  const option = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '50%',
      data: [
        { value: 1048, name: '已完成' },
        { value: 735, name: '处理中' },
        { value: 580, name: '待支付' },
        { value: 484, name: '已取消' }
      ]
    }]
  }
  chart.setOption(option)
}

onMounted(() => {
  nextTick(() => {
    initUserChart()
    initOrderChart()
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

.activity-row {
  margin-bottom: 20px;
}

.activity-card {
  height: 400px;
}

.notification-list {
  padding: 10px 0;
}

.notification-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-icon {
  width: 40px;
  height: 40px;
  background-color: #f0f9ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  color: #409EFF;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 5px;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}
</style>
