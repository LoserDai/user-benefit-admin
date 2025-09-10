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
          <el-select v-model="searchForm.activityStatus" placeholder="活动状态" clearable>
            <el-option 
              v-for="(status, key) in ActivityStatus" 
              :key="key"
              :label="status.label" 
              :value="status.value" 
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.activityType" placeholder="活动类型" clearable>
            <el-option 
              v-for="(type, key) in ActivityType" 
              :key="key"
              :label="type.label" 
              :value="type.value" 
            />
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
        <el-table-column prop="activityType" label="活动类型" width="120">
          <template #default="scope">
            <el-tag :type="getActivityTypeTag(scope.row.activityType)">
              {{ getActivityTypeLabel(scope.row.activityType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="packageNames" label="关联权益包" width="280">
          <template #default="scope">
            <div v-if="scope.row.packageNames && scope.row.packageNames.length > 0" class="package-tags">
              <el-tag 
                v-for="packageName in scope.row.packageNames" 
                :key="packageName"
                size="small"
                type="info"
                class="package-tag"
              >
                {{ packageName }}
              </el-tag>
              <span class="package-count">({{ scope.row.packageNames.length }}个权益包)</span>
            </div>
            <span v-else class="text-muted">暂无关联权益包</span>
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
            <el-tag :type="getActivityStatusTag(scope.row.status)">
              {{ getActivityStatusLabel(scope.row.status) }}
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
            <el-button size="small" @click="handleDetail(scope.row)">详情</el-button>
            <el-button 
              v-if="canOperateActivity(scope.row.status)"
              size="small" 
              type="warning" 
              @click="handleCancelActivity(scope.row)"
              :loading="actionLoading"
              style="margin-left: 5px;"
            >
              取消
            </el-button>
            <el-button 
              v-if="canOperateActivity(scope.row.status)"
              size="small" 
              type="danger" 
              @click="handleEndActivity(scope.row)"
              :loading="actionLoading"
              style="margin-left: 5px;"
            >
              结束
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

    <!-- 新增活动对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="新增活动"
      width="800px"
    >
      <el-form
        ref="activityFormRef"
        :model="activityForm"
        :rules="activityFormRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
        <el-form-item label="活动名称" prop="activityName">
          <el-input v-model="activityForm.activityName" placeholder="请输入活动名称" />
        </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动类型" prop="activityType">
              <el-select v-model="activityForm.activityType" placeholder="请选择活动类型" style="width: 100%">
                <el-option 
                  v-for="(type, key) in ActivityType" 
                  :key="key"
                  :label="type.label" 
                  :value="type.value" 
                />
          </el-select>
        </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="活动描述" prop="description">
          <el-input
            v-model="activityForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入活动描述"
          />
        </el-form-item>

        <el-form-item label="活动图片" prop="file">
          <!-- 显示现有图片 -->
          <div v-if="activityForm.imagePath && !activityForm.file" class="existing-image">
            <el-image
              :src="getImageUrl(activityForm.imagePath)"
              style="width: 120px; height: 80px; object-fit: cover; border-radius: 4px;"
              fit="cover"
              :preview-src-list="[getImageUrl(activityForm.imagePath)]"
            />
            <div class="image-info">
              <span class="image-name">{{ activityForm.imagePath.split('/').pop() }}</span>
              <el-button type="text" size="small" @click="removeExistingImage">移除现有图片</el-button>
            </div>
          </div>
          
          <!-- 文件上传组件 -->
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            accept="image/*"
            @change="handleFileChange"
            @remove="handleFileRemove"
          >
            <el-button type="primary">{{ activityForm.imagePath ? '更换图片' : '选择图片' }}</el-button>
            <template #tip>
              <div class="el-upload__tip">
                只能上传jpg/png文件，且不超过2MB
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
        <el-form-item label="活动状态" prop="status">
              <el-select v-model="activityForm.status" placeholder="请选择活动状态" style="width: 100%">
                <el-option 
                  v-for="(status, key) in ActivityStatus" 
                  :key="key"
                  :label="status.label" 
                  :value="status.value" 
                />
              </el-select>
        </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联权益包" prop="packageNames">
              <el-select
                v-model="activityForm.packageNames"
                multiple
                placeholder="请选择权益包（可搜索）"
                style="width: 100%"
                filterable
                remote
                :remote-method="handlePackageSearch"
                :loading="packageLoading"
                clearable
                collapse-tags
                collapse-tags-tooltip
                :max-collapse-tags="3"
                @focus="handlePackageFocus"
                @blur="handlePackageBlur"
                @visible-change="handlePackageVisibleChange"
              >
                <el-option
                  v-for="pkg in packageOptions"
                  :key="pkg.id"
                  :label="pkg.packageName || pkg.package_name || pkg.name || `权益包-${pkg.id}`"
                  :value="pkg.packageName || pkg.package_name || pkg.name || `权益包-${pkg.id}`"
                >
                  <span style="float: left">{{ pkg.packageName || pkg.package_name || pkg.name || `权益包-${pkg.id}` }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">
                    ¥{{ pkg.price?.toFixed(2) || '0.00' }}
                  </span>
                </el-option>
              </el-select>
              <div class="el-form-item__help">
                支持搜索权益包名称，已选择 {{ activityForm.packageNames?.length || 0 }} 个权益包
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间" prop="startTime">
              <el-date-picker
                v-model="activityForm.startTime"
                type="datetime"
                placeholder="请选择开始时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DDTHH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="endTime">
              <el-date-picker
                v-model="activityForm.endTime"
                type="datetime"
                placeholder="请选择结束时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DDTHH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="折扣值" prop="discountValue">
              <el-input-number
                v-model="activityForm.discountValue"
                :min="0"
                :precision="2"
                :step="0.01"
                style="width: 100%"
                placeholder="请输入折扣值"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="价格" prop="price">
              <el-input-number
                v-model="activityForm.price"
                :min="0"
                :precision="2"
                :step="0.01"
                style="width: 100%"
                placeholder="请输入价格"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最低购买限制" prop="minPurchase">
              <el-input-number
                v-model="activityForm.minPurchase"
                :min="1"
                :precision="0"
                style="width: 100%"
                placeholder="请输入最低购买限制"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="限购数量" prop="purchaseLimit">
              <el-input-number
                v-model="activityForm.purchaseLimit"
                :min="1"
                :precision="0"
                style="width: 100%"
                placeholder="请输入限购数量"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="activityForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 活动详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="活动详情"
      width="800px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="活动名称">
          {{ activityDetail.activityName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="活动类型">
          <el-tag :type="getActivityTypeTag(activityDetail.activityType)">
            {{ getActivityTypeLabel(activityDetail.activityType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="活动状态">
          <el-tag :type="getActivityStatusTag(activityDetail.status)">
            {{ getActivityStatusLabel(activityDetail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="活动图片">
          <el-image
            v-if="activityDetail.imageUrl || activityDetail.activityImagePath"
            :src="getImageUrl(activityDetail.imageUrl || activityDetail.activityImagePath)"
            style="width: 100px; height: 100px"
            fit="cover"
            :preview-src-list="[getImageUrl(activityDetail.imageUrl || activityDetail.activityImagePath)]"
          />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="活动描述" :span="2">
          {{ activityDetail.description || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">
          {{ formatTime(activityDetail.startTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="结束时间">
          {{ formatTime(activityDetail.endTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="折扣值">
          {{ activityDetail.discountValue || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="价格">
          {{ activityDetail.price ? `¥${activityDetail.price}` : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="最低购买限制">
          {{ activityDetail.minPurchase || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="限购数量">
          {{ activityDetail.purchaseLimit || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="关联权益包" :span="2">
          <div v-if="activityDetail.packageNames && activityDetail.packageNames.length > 0" class="package-tags">
            <el-tag
              v-for="(pkgName, index) in activityDetail.packageNames"
              :key="index"
              class="package-tag"
              type="info"
            >
              {{ pkgName }}
            </el-tag>
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ activityDetail.remark || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatTime(activityDetail.createTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ formatTime(activityDetail.updateTime) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { queryActivityList } from '@/api/user'

// 活动状态枚举
const ActivityStatus = {
  NOT_STARTED: { label: '未开始', value: 'NOT_STARTED' },
  ONGOING: { label: '进行中', value: 'ONGOING' },
  ENDED: { label: '已结束', value: 'ENDED' },
  CANCELED: { label: '已取消', value: 'CANCELED' }
}

// 活动类型枚举
const ActivityType = {
  PERCENT_DISCOUNT: { label: '百分比折扣', value: 'PERCENT_DISCOUNT' },
  AMOUNT_DISCOUNT: { label: '金额折扣', value: 'AMOUNT_DISCOUNT' },
  GIFT: { label: '买赠活动', value: 'GIFT' }
}

// 搜索表单
const searchForm = reactive({
  activityName: '',  // 活动名称
  activityStatus: null,      // 活动状态
  activityType: null         // 活动类型
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
const activityFormRef = ref(null)

// 详情对话框
const detailDialogVisible = ref(false)
const activityDetail = ref({})
const actionLoading = ref(false)
const activityForm = reactive({
  id: null,
  activityName: '',
  description: '',
  activityType: null,
  status: 'NOT_STARTED',
  startTime: null,
  endTime: null,
  discountValue: 0,
  price: 0,
  remark: '',
  minPurchase: 1,
  purchaseLimit: 1,
  packageIds: [],      // 存储权益包ID数组（用于提交）
  packageNames: [],    // 存储权益包名称数组（用于显示和选择）
  file: null,
  imagePath: '' // 存储现有图片路径
})

// 权益包选项
const packageOptions = ref([])
const packageLoading = ref(false)

// 权益包搜索防抖定时器
let packageSearchTimeout = null

// 防止选择变化时触发搜索的标志
let isSelecting = false

// 表单验证规则
const activityFormRules = {
  activityName: [
    { required: true, message: '请输入活动名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入活动描述', trigger: 'blur' }
  ],
  activityType: [
    { required: true, message: '请选择活动类型', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择活动状态', trigger: 'change' }
  ],
  startTime: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' }
  ],
  discountValue: [
    { required: true, message: '请输入折扣值', trigger: 'blur' },
    { type: 'number', min: 0, message: '折扣值必须大于等于0', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入价格', trigger: 'blur' },
    { type: 'number', min: 0, message: '价格必须大于等于0', trigger: 'blur' }
  ],
  minPurchase: [
    { required: true, message: '请输入最低购买限制', trigger: 'blur' },
    { type: 'number', min: 1, message: '最低购买限制必须大于0', trigger: 'blur' }
  ],
  purchaseLimit: [
    { required: true, message: '请输入限购数量', trigger: 'blur' },
    { type: 'number', min: 1, message: '限购数量必须大于0', trigger: 'blur' }
  ]
}

// 获取活动类型标签类型
const getActivityTypeTag = (type) => {
  const tagMap = {
    'PERCENT_DISCOUNT': 'primary',
    'AMOUNT_DISCOUNT': 'success',
    'GIFT': 'warning'
  }
  return tagMap[type] || ''
}

// 获取活动类型标签文本
const getActivityTypeLabel = (type) => {
  const typeObj = Object.values(ActivityType).find(t => t.value === type)
  return typeObj ? typeObj.label : '未知类型'
}

// 获取活动状态标签类型
const getActivityStatusTag = (status) => {
  const tagMap = {
    'NOT_STARTED': 'info',      // 未开始
    'ONGOING': 'success',       // 进行中
    'ENDED': 'warning',         // 已结束
    'CANCELED': 'danger'        // 已取消
  }
  return tagMap[status] || ''
}

// 获取活动状态标签文本
const getActivityStatusLabel = (status) => {
  const statusMap = {
    'NOT_STARTED': '未开始',
    'ONGOING': '进行中',
    'ENDED': '已结束',
    'CANCELED': '已取消',
    0: '未开始',
    1: '进行中',
    2: '已结束',
    3: '已取消'
  }
  return statusMap[status] || '未知状态'
}

// 检查活动是否可以操作（取消或结束）
const canOperateActivity = (status) => {
  return status === 'NOT_STARTED' || 
         status === 'ONGOING' || 
         status === 0 || 
         status === 1
}

// 获取图片URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return ''
  if (imagePath.startsWith('http')) return imagePath
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${imagePath}`
}

// 权益包去重函数
const deduplicatePackages = (packages) => {
  return packages.reduce((acc, current) => {
    const currentName = current.packageName || current.package_name || current.name
    const existingPackage = acc.find(pkg => {
      const pkgName = pkg.packageName || pkg.package_name || pkg.name
      return pkgName === currentName
    })
    if (!existingPackage && currentName) {
      acc.push(current)
    }
    return acc
  }, [])
}

// 对权益活动数据进行分组处理
const groupActivityData = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return []
  }
  
  console.log('原始数据:', data) // 添加调试日志
  console.log('第一个数据项的字段:', data.length > 0 ? Object.keys(data[0]) : []) // 查看字段名
  
  // 按活动ID分组
  const activityMap = new Map()
  
  data.forEach((item) => {
    const activityId = item.id || item.activityId
    
    if (!activityMap.has(activityId)) {
      // 创建新的活动记录
      activityMap.set(activityId, {
        id: activityId,
        activityName: item.activityName || '',
        description: item.description || '',
        activityType: item.activityType || '',
        status: item.status || 'NOT_STARTED',
        startTime: item.startTime || null,
        endTime: item.endTime || null,
        discountValue: item.discountValue || 0,
        price: item.price || 0,
        remark: item.remark || '',
        minPurchase: item.minPurchase || 1,
        purchaseLimit: item.purchaseLimit || 1,
        createTime: item.createTime || null,
        activityImagePath: item.activityImagePath || item.imagePath || '',
        packageNames: [], // 存储权益包名称列表
        packageIds: [],   // 存储权益包ID列表
        packages: []      // 存储完整的权益包信息
      })
    }
    
    // 添加权益包信息
    const existingActivity = activityMap.get(activityId)
    
    // 处理不同的权益包数据结构
    console.log('处理数据项:', item) // 调试信息
    
    // 尝试多种可能的字段名称
    const packageName = item.packageName || item.package_name || item.name || item.packageName
    const packageId = item.packageId || item.package_id || item.id
    const packageNames = item.packageNames || item.package_names || item.names
    const packageIds = item.packageIds || item.package_ids || item.ids
    const packages = item.packages || item.packageList || item.package_list
    
    console.log('提取的字段:', { packageName, packageId, packageNames, packageIds, packages })
    
    if (packageName) {
      // 单个权益包名称
      if (!existingActivity.packageNames.includes(packageName)) {
        existingActivity.packageNames.push(packageName)
        existingActivity.packageIds.push(packageId)
        existingActivity.packages.push({
          id: packageId,
          packageName: packageName,
          price: item.packagePrice || item.package_price || 0
        })
        console.log('添加单个权益包:', packageName)
      }
    } else if (packageNames && Array.isArray(packageNames)) {
      // 权益包名称数组
      packageNames.forEach((name, index) => {
        if (name && !existingActivity.packageNames.includes(name)) {
          existingActivity.packageNames.push(name)
          if (packageIds && packageIds[index]) {
            existingActivity.packageIds.push(packageIds[index])
          }
          existingActivity.packages.push({
            id: packageIds ? packageIds[index] : null,
            packageName: name,
            price: 0
          })
          console.log('添加权益包名称:', name)
        }
      })
    } else if (packages && Array.isArray(packages)) {
      // 权益包对象数组
      packages.forEach(pkg => {
        const pkgName = pkg.packageName || pkg.package_name || pkg.name || pkg.packageName
        if (pkgName && !existingActivity.packageNames.includes(pkgName)) {
          existingActivity.packageNames.push(pkgName)
          existingActivity.packageIds.push(pkg.id || pkg.packageId || pkg.package_id)
          existingActivity.packages.push({
            id: pkg.id || pkg.packageId || pkg.package_id,
            packageName: pkgName,
            price: pkg.price || 0,
            ...pkg
          })
          console.log('添加权益包对象:', pkgName)
        }
      })
    }
    
    // 如果后端直接返回了 packageIds 数组，需要根据ID查找对应的权益包名称
    if (packageIds && Array.isArray(packageIds) && packageIds.length > 0) {
      packageIds.forEach(pkgId => {
        if (pkgId && !existingActivity.packageIds.includes(pkgId)) {
          existingActivity.packageIds.push(pkgId)
          // 如果后端没有提供名称，我们暂时用ID作为显示
          const displayName = `权益包-${pkgId}`
          if (!existingActivity.packageNames.includes(displayName)) {
            existingActivity.packageNames.push(displayName)
            existingActivity.packages.push({
              id: pkgId,
              packageName: displayName,
              price: 0
            })
            console.log('添加权益包ID:', pkgId, '显示名称:', displayName)
          }
        }
      })
    }
    
    // 如果后端返回了 packageNames 数组，直接使用
    if (packageNames && Array.isArray(packageNames) && packageNames.length > 0) {
      packageNames.forEach((name, index) => {
        if (name && !existingActivity.packageNames.includes(name)) {
          existingActivity.packageNames.push(name)
          // 如果有对应的ID，也添加进去
          if (packageIds && packageIds[index]) {
            if (!existingActivity.packageIds.includes(packageIds[index])) {
              existingActivity.packageIds.push(packageIds[index])
            }
          }
          existingActivity.packages.push({
            id: packageIds ? packageIds[index] : null,
            packageName: name,
            price: 0
          })
          console.log('添加权益包名称数组:', name)
        }
      })
    }
  })
  
  // 转换为数组并排序
  const result = Array.from(activityMap.values())
  result.sort((a, b) => {
    // 按创建时间倒序排列
    if (a.createTime && b.createTime) {
      return new Date(b.createTime) - new Date(a.createTime)
    }
    // 如果没有创建时间，按ID排序
    return (b.id || 0) - (a.id || 0)
  })
  
  console.log('分组后的数据:', result) // 添加调试日志
  return result
}

// 文件变化处理
const handleFileChange = (file) => {
  activityForm.file = file.raw
}

// 文件移除处理
const handleFileRemove = () => {
  activityForm.file = null
}

// 移除现有图片
const removeExistingImage = () => {
  activityForm.imagePath = ''
  activityForm.file = null
}

// 加载所有权益包数据
const loadAllPackages = async () => {
  try {
    const { queryPackage } = await import('@/api/user')
    const response = await queryPackage({
      status: 'ACTIVE',
      pageNum: 1,
      pageSize: 1000 // 获取所有权益包
    })
    if (response && response.code === 200 && response.data) {
      const packages = response.data.data || []
      // 根据权益包名称去重
      const uniquePackages = deduplicatePackages(packages)
      console.log('权益包选项数据:', uniquePackages)
      console.log('第一个权益包:', uniquePackages.length > 0 ? uniquePackages[0] : null)
      // 直接更新响应式数据，不使用 nextTick
      packageOptions.value = uniquePackages
    }
  } catch (error) {
    console.error('加载权益包失败:', error)
    // 确保在错误情况下也重置数据
    packageOptions.value = []
  }
}

// 根据权益包ID获取权益包名称
const loadPackageNamesByIds = async (packageIds) => {
  try {
    const { queryPackage } = await import('@/api/user')
    const response = await queryPackage({
      status: 'ACTIVE',
      pageNum: 1,
      pageSize: 1000 // 获取所有权益包
    })
    
    if (response && response.code === 200 && response.data) {
      const packages = response.data.data || []
      const packageMap = new Map()
      
      // 创建权益包ID到名称的映射
      packages.forEach(pkg => {
        const pkgName = pkg.packageName || pkg.package_name || pkg.name
        const pkgId = pkg.id || pkg.packageId || pkg.package_id
        if (pkgId && pkgName) {
          packageMap.set(pkgId, pkgName)
        }
      })
      
      console.log('权益包映射表:', packageMap)
      
      // 更新活动表单中的权益包名称
      const packageNames = packageIds.map(id => packageMap.get(id) || `权益包-${id}`)
      
      // 更新活动列表中的权益包名称
      const activityIndex = activityList.value.findIndex(activity => 
        activity.packageIds && activity.packageIds.some(id => packageIds.includes(id))
      )
      
      if (activityIndex !== -1) {
        activityList.value[activityIndex].packageNames = packageNames
      }
      
      console.log('根据ID获取的权益包名称:', packageNames)
    }
  } catch (error) {
    console.error('根据ID获取权益包名称失败:', error)
  }
}

// 清理搜索定时器
const clearPackageSearchTimeout = () => {
  if (packageSearchTimeout) {
    clearTimeout(packageSearchTimeout)
    packageSearchTimeout = null
  }
}

// 权益包搜索
const handlePackageSearch = async (query) => {
  // 如果正在选择中，不执行搜索
  if (isSelecting) {
    return
  }
  
  // 清除之前的定时器
  clearPackageSearchTimeout()
  
  // 如果查询为空，直接加载所有权益包，不设置延迟
  if (query === '') {
    await loadAllPackages()
    return
  }
  
  // 如果查询长度小于2，不执行搜索
  if (query.length < 2) {
    return
  }
  
  // 设置防抖延迟
  packageSearchTimeout = setTimeout(async () => {
    // 再次检查是否正在选择中
    if (isSelecting) {
      return
    }
    
    packageLoading.value = true
    try {
      const { queryPackage } = await import('@/api/user')
      const response = await queryPackage({
        packageName: query,
        status: 'ACTIVE',
        pageNum: 1,
        pageSize: 100
      })
      if (response && response.code === 200 && response.data) {
        const packages = response.data.data || []
        console.log('搜索到的权益包:', packages)
        // 根据权益包名称去重
        const uniquePackages = deduplicatePackages(packages)
        console.log('去重后的权益包:', uniquePackages)
        // 直接更新响应式数据
        packageOptions.value = uniquePackages
      }
    } catch (error) {
      console.error('搜索权益包失败:', error)
      // 确保在错误情况下也重置加载状态
      packageOptions.value = []
    } finally {
      packageLoading.value = false
    }
  }, 500) // 增加防抖延迟到500ms
}

// 权益包选择框获得焦点
const handlePackageFocus = () => {
  isSelecting = true
}

// 权益包选择框失去焦点
const handlePackageBlur = () => {
  // 延迟重置选择状态，避免在快速操作时出现问题
  setTimeout(() => {
    isSelecting = false
  }, 100)
}

// 权益包下拉框显示/隐藏变化
const handlePackageVisibleChange = (visible) => {
  if (visible) {
    isSelecting = true
  } else {
    // 延迟重置选择状态
    setTimeout(() => {
      isSelecting = false
    }, 100)
  }
}

// 同步权益包名称和ID的防抖定时器
let syncTimeout = null

// 同步权益包名称和ID
const syncPackageNamesAndIds = () => {
  // 清除之前的定时器
  if (syncTimeout) {
    clearTimeout(syncTimeout)
  }
  
  // 设置防抖延迟
  syncTimeout = setTimeout(() => {
    if (activityForm.packageNames && activityForm.packageNames.length > 0) {
      // 根据选择的权益包名称，找到对应的ID
      activityForm.packageIds = activityForm.packageNames.map(packageName => {
        const pkg = packageOptions.value.find(p => 
          (p.packageName || p.package_name || p.name) === packageName
        )
        return pkg ? pkg.id : null
      }).filter(id => id !== null)
    } else {
      activityForm.packageIds = []
    }
    console.log('同步后的权益包数据:', {
      packageNames: activityForm.packageNames,
      packageIds: activityForm.packageIds
    })
  }, 100) // 100ms 防抖延迟
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
    activityStatus: null,
    activityType: null
  })
  handleSearch()
}

// 新增活动
const handleAdd = async () => {
  Object.assign(activityForm, {
    id: null,
    activityName: '',
    description: '',
    activityType: null,
    status: 'NOT_STARTED',
    startTime: null,
    endTime: null,
    discountValue: 0,
    price: 0,
    remark: '',
    minPurchase: 1,
    purchaseLimit: 1,
    packageIds: [],
    packageNames: [],
    file: null,
    imagePath: ''
  })
  
  // 重置权益包选项
  packageOptions.value = []
  // 加载所有权益包数据
  await loadAllPackages()
  
  dialogVisible.value = true
}

// 查看活动详情
const handleDetail = (row) => {
  activityDetail.value = { ...row }
  console.log('活动详情数据:', activityDetail.value)
  console.log('活动状态:', activityDetail.value.status)
  console.log('状态类型:', typeof activityDetail.value.status)
  
  // 检查状态判断逻辑
  const canOperate = canOperateActivity(activityDetail.value.status)
  console.log('是否可以操作:', canOperate)
  
  detailDialogVisible.value = true
}

// 取消活动
const handleCancelActivity = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消活动"${row.activityName}"吗？取消后活动将无法恢复。`,
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    actionLoading.value = true
    
    const requestData = {
      id: row.id,
      activityName: row.activityName,
      description: row.description,
      activityType: row.activityType,
      status: 'CANCELED',
      startTime: row.startTime,
      endTime: row.endTime,
      discountValue: row.discountValue,
      price: row.price,
      remark: row.remark,
      minPurchase: row.minPurchase,
      purchaseLimit: row.purchaseLimit,
      packageIds: row.packageIds || []
    }
    
    const { updateActivity } = await import('@/api/user')
    const response = await updateActivity(requestData)
    
    if (response.code === 200) {
      ElMessage.success('活动已取消')
      // 刷新列表
      loadActivityList()
    } else {
      ElMessage.error(response.message || '取消失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消活动失败:', error)
      ElMessage.error('取消失败，请稍后重试')
    }
  } finally {
    actionLoading.value = false
  }
}

// 结束活动
const handleEndActivity = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要结束活动"${row.activityName}"吗？结束后活动将无法恢复。`,
      '确认结束',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    actionLoading.value = true
    
    const requestData = {
      id: row.id,
      activityName: row.activityName,
      description: row.description,
      activityType: row.activityType,
      status: 'ENDED',
      startTime: row.startTime,
      endTime: row.endTime,
      discountValue: row.discountValue,
      price: row.price,
      remark: row.remark,
      minPurchase: row.minPurchase,
      purchaseLimit: row.purchaseLimit,
      packageIds: row.packageIds || []
    }
    
    const { updateActivity } = await import('@/api/user')
    const response = await updateActivity(requestData)
    
    if (response.code === 200) {
      ElMessage.success('活动已结束')
      // 刷新列表
    loadActivityList()
    } else {
      ElMessage.error(response.message || '结束失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('结束活动失败:', error)
      ElMessage.error('结束失败，请稍后重试')
    }
  } finally {
    actionLoading.value = false
  }
}




// 提交表单
const handleSubmit = async () => {
  try {
    await activityFormRef.value.validate()
    
    // 验证时间
    if (!activityForm.startTime || !activityForm.endTime) {
      ElMessage.error('请选择活动开始和结束时间')
      return
    }
    
    // 验证时间逻辑
    const startTime = new Date(activityForm.startTime)
    const endTime = new Date(activityForm.endTime)
    
    if (startTime >= endTime) {
      ElMessage.error('结束时间必须晚于开始时间')
      return
    }
    
    // 构建请求参数
    const requestData = {
      activityName: activityForm.activityName,
      description: activityForm.description,
      activityType: activityForm.activityType,
      status: activityForm.status,
      startTime: activityForm.startTime,
      endTime: activityForm.endTime,
      discountValue: activityForm.discountValue,
      price: activityForm.price,
      remark: activityForm.remark,
      minPurchase: activityForm.minPurchase,
      purchaseLimit: activityForm.purchaseLimit,
      packageIds: activityForm.packageIds || []
    }
    
    console.log('提交的权益包ID:', activityForm.packageIds)
    console.log('请求参数:', requestData)
    
    // 新增时使用FormData（支持文件上传）
    const formData = new FormData()
    if (activityForm.file) {
      formData.append('file', activityForm.file)
    }
    
    // 将请求参数转换为Blob并添加到FormData
    const requestBlob = new Blob([JSON.stringify(requestData)], { type: 'application/json' })
    formData.append('request', requestBlob, 'request.json')
    
    // 调用保存活动API
    const { saveActivity } = await import('@/api/user')
    const response = await saveActivity(formData)
    
    if (response.code === 200) {
      ElMessage.success('新增成功')
    dialogVisible.value = false
    loadActivityList()
    } else {
      ElMessage.error(response.message || '新增失败')
    }
  } catch (error) {
    console.error('保存活动失败:', error)
    ElMessage.error('保存失败，请稍后重试')
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
    // 构建请求参数，只包含有效值
    const request = {
      pageNum: pagination.currentPage,
      pageSize: pagination.pageSize
    }
    
    // 只添加非空值，避免后端反序列化错误
    if (searchForm.activityName && searchForm.activityName.trim()) {
      request.activityName = searchForm.activityName.trim()
    }
    
    if (searchForm.activityStatus !== null && searchForm.activityStatus !== '' && searchForm.activityStatus !== undefined) {
      request.status = searchForm.activityStatus
    }
    
    if (searchForm.activityType !== null && searchForm.activityType !== '' && searchForm.activityType !== undefined) {
      request.activityType = searchForm.activityType
    }
    
    console.log('请求参数:', request) // 添加调试日志

    const response = await queryActivityList(request)
    console.log('接口响应数据:', response) // 添加调试日志
    
    if (response.code === 200 && response.data) {
      // 后端返回的数据结构是 data.data，需要适配
      const resultData = response.data.data || response.data.records || []
      const total = response.data.total || 0
      
      // 对数据进行分组处理，相同活动ID的数据合并到同一行
      const groupedData = groupActivityData(resultData)
      
      activityList.value = groupedData
      pagination.total = total
    } else {
      ElMessage.error(response.message || '获取活动列表失败')
    }
  } catch (error) {
    console.error('获取活动列表失败:', error)
    ElMessage.error('获取活动列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 监听权益包名称变化，自动同步ID
watch(() => activityForm.packageNames, () => {
  syncPackageNamesAndIds()
}, { deep: true })

onMounted(() => {
  loadActivityList()
})

// 组件卸载时清理定时器
onUnmounted(() => {
  clearPackageSearchTimeout()
  if (syncTimeout) {
    clearTimeout(syncTimeout)
  }
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

.existing-image {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.image-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.image-name {
  font-size: 12px;
  color: #666;
  word-break: break-all;
}

/* 权益包选择样式 */
.el-form-item__help {
  font-size: 12px;
  color: #909399;
  line-height: 1.2;
  margin-top: 4px;
}

/* 权益包选项样式 */
.el-select-dropdown__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 权益包标签样式 */
.package-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
}

.package-tag {
  margin: 0;
}

.package-count {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}

/* 详情对话框样式 */
.el-descriptions {
  margin-top: 20px;
}

.el-descriptions-item__label {
  font-weight: 600;
  color: #606266;
}


.text-muted {
  color: #909399;
  font-style: italic;
}
</style>
