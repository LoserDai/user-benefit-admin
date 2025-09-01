<template>
  <div class="benefit-management">
    <!-- 搜索和操作栏 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入商品名称或编码"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.category" placeholder="商品分类" clearable>
            <el-option label="会员服务" value="membership" />
            <el-option label="生活服务" value="lifestyle" />
            <el-option label="娱乐服务" value="entertainment" />
            <el-option label="购物服务" value="shopping" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.status" placeholder="商品状态" clearable>
            <el-option label="上架" value="active" />
            <el-option label="下架" value="inactive" />
            <el-option label="草稿" value="draft" />
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
          <el-button type="success" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            添加商品
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 商品列表 -->
    <el-card class="table-card">
      <el-table :data="benefitList" stripe v-loading="loading" border>
        <el-table-column prop="id" label="商品ID" width="100" />
        <el-table-column prop="image" label="商品图片" width="100">
          <template #default="scope">
            <el-image
              :src="getImageUrl(scope.row)"
              :preview-src-list="[getImageUrl(scope.row)]"
              fit="cover"
              style="width: 60px; height: 60px; border-radius: 4px;"
            />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" width="200" />
        <el-table-column prop="code" label="商品编码" width="120" />
        <el-table-column prop="category" label="分类" width="100">
          <template #default="scope">
            <el-tag>{{ getCategoryLabel(scope.row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="100">
          <template #default="scope">
            <span class="price-amount">¥{{ scope.row.price.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="originalPrice" label="原价" width="100">
          <template #default="scope">
            <span class="original-price">¥{{ scope.row.originalPrice.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" />
        <el-table-column prop="sales" label="销量" width="80" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === 'active' ? 'warning' : 'success'"
              @click="handleToggleStatus(scope.row)"
            >
              {{ scope.row.status === 'active' ? '下架' : '上架' }}
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDelete(scope.row)"
            >删除</el-button>
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

    <!-- 商品表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="handleDialogClose"
    >
      <el-form
        ref="benefitFormRef"
        :model="benefitForm"
        :rules="benefitFormRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品名称" prop="name">
              <el-input v-model="benefitForm.name" placeholder="请输入商品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品编码" prop="code">
              <el-input v-model="benefitForm.code" placeholder="请输入商品编码" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品分类" prop="category">
              <el-select v-model="benefitForm.category" placeholder="请选择商品分类" style="width: 100%">
                <el-option label="会员服务" value="membership" />
                <el-option label="生活服务" value="lifestyle" />
                <el-option label="娱乐服务" value="entertainment" />
                <el-option label="购物服务" value="shopping" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品状态" prop="status">
              <el-select v-model="benefitForm.status" placeholder="请选择商品状态" style="width: 100%">
                <el-option label="上架" value="active" />
                <el-option label="下架" value="inactive" />
                <el-option label="草稿" value="draft" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品价格" prop="price">
              <el-input-number
                v-model="benefitForm.price"
                :min="0.01"
                :precision="2"
                :step="0.01"
                style="width: 100%"
                placeholder="请输入商品价格"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="原价" prop="originalPrice">
              <el-input-number
                v-model="benefitForm.originalPrice"
                :min="0.01"
                :precision="2"
                :step="0.01"
                style="width: 100%"
                placeholder="请输入原价"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="库存数量" prop="stock">
              <el-input-number
                v-model="benefitForm.stock"
                :min="0"
                :precision="0"
                style="width: 100%"
                placeholder="请输入库存数量"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序权重" prop="sort">
              <el-input-number
                v-model="benefitForm.sort"
                :min="0"
                :precision="0"
                style="width: 100%"
                placeholder="请输入排序权重"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="商品图片" prop="image">
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :on-success="handleImageSuccess"
            :before-upload="beforeImageUpload"
            action="#"
            :http-request="handleImageUpload"
          >
            <img v-if="benefitForm.image" :src="benefitForm.image" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="benefitForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入商品描述"
          />
        </el-form-item>

        <el-form-item label="使用说明" prop="instructions">
          <el-input
            v-model="benefitForm.instructions"
            type="textarea"
            :rows="3"
            placeholder="请输入使用说明"
          />
        </el-form-item>

        <el-form-item label="有效期" prop="validityPeriod">
          <el-date-picker
            v-model="benefitForm.validityPeriod"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 商品详情对话框 -->
    <el-dialog
      v-model="detailsDialogVisible"
      title="商品详情"
      width="800px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="商品ID">{{ selectedBenefit.id }}</el-descriptions-item>
        <el-descriptions-item label="商品名称">{{ selectedBenefit.name }}</el-descriptions-item>
        <el-descriptions-item label="商品编码">{{ selectedBenefit.code }}</el-descriptions-item>
        <el-descriptions-item label="商品分类">{{ getCategoryLabel(selectedBenefit.category) }}</el-descriptions-item>
        <el-descriptions-item label="商品价格">¥{{ selectedBenefit.price?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="原价">¥{{ selectedBenefit.originalPrice?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="库存">{{ selectedBenefit.stock }}</el-descriptions-item>
        <el-descriptions-item label="销量">{{ selectedBenefit.sales }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ getStatusLabel(selectedBenefit.status) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ selectedBenefit.createTime }}</el-descriptions-item>
      </el-descriptions>

      <div class="benefit-details">
        <h4>商品图片</h4>
        <el-image
          :src="selectedBenefit.image"
          :preview-src-list="[selectedBenefit.image]"
          fit="cover"
          style="width: 200px; height: 200px; border-radius: 8px;"
        />

        <h4>商品描述</h4>
        <p>{{ selectedBenefit.description }}</p>

        <h4>使用说明</h4>
        <p>{{ selectedBenefit.instructions }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { config } from '@/config'

// 搜索表单
const searchForm = reactive({
  keyword: '',
  category: '',
  status: ''
})

// 商品列表数据
const benefitList = ref([])
const loading = ref(false)

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const benefitFormRef = ref(null)
const benefitForm = reactive({
  id: '',
  name: '',
  code: '',
  category: '',
  price: 0,
  originalPrice: 0,
  stock: 0,
  sort: 0,
  image: '',
  description: '',
  instructions: '',
  validityPeriod: [],
  status: 'draft'
})

// 详情对话框
const detailsDialogVisible = ref(false)
const selectedBenefit = ref({})

// 表单验证规则
const benefitFormRules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入商品编码', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择商品分类', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入商品价格', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '价格必须大于0', trigger: 'blur' }
  ],
  stock: [
    { required: true, message: '请输入库存数量', trigger: 'blur' },
    { type: 'number', min: 0, message: '库存不能小于0', trigger: 'blur' }
  ],
  image: [
    { required: true, message: '请上传商品图片', trigger: 'change' }
  ]
}

// 模拟商品数据（包含productImagePath字段，模拟后端返回的数据结构）
const mockBenefits = [
  {
    id: 'BEN001',
    name: 'VIP会员月卡',
    code: 'VIP001',
    category: 'membership',
    price: 99.00,
    originalPrice: 199.00,
    stock: 1000,
    sales: 500,
    status: 'active',
    productImagePath: 'D:\\code\\Java\\user-benefit-service\\images\\benefit-products\\vip-card.jpg', // 模拟后端路径
    description: '享受VIP专属权益，包括优先客服、专属活动、生日特权等',
    instructions: '购买后立即生效，有效期30天',
    createTime: '2024-01-01 10:00:00'
  },
  {
    id: 'BEN002',
    name: '电影票券',
    code: 'MOVIE001',
    category: 'entertainment',
    price: 35.00,
    originalPrice: 50.00,
    stock: 500,
    sales: 200,
    status: 'active',
    productImagePath: 'D:\\code\\Java\\user-benefit-service\\images\\benefit-products\\movie-ticket.jpg', // 模拟后端路径
    description: '全国通用电影票券，支持主流影院使用',
    instructions: '购买后7天内有效，请及时使用',
    createTime: '2024-01-02 11:00:00'
  },
  {
    id: 'BEN003',
    name: '咖啡券',
    code: 'COFFEE001',
    category: 'lifestyle',
    price: 25.00,
    originalPrice: 35.00,
    stock: 800,
    sales: 300,
    status: 'inactive',
    productImagePath: 'D:\\code\\Java\\user-benefit-service\\images\\benefit-products\\coffee-coupon.jpg', // 模拟后端路径
    description: '星巴克、瑞幸等主流咖啡品牌通用券',
    instructions: '购买后30天内有效，全国门店通用',
    createTime: '2024-01-03 12:00:00'
  }
]

// 获取分类标签文本
const getCategoryLabel = (category) => {
  const labelMap = {
    membership: '会员服务',
    lifestyle: '生活服务',
    entertainment: '娱乐服务',
    shopping: '购物服务'
  }
  return labelMap[category] || category
}

// 获取状态标签
const getStatusTag = (status) => {
  const tagMap = {
    active: 'success',
    inactive: 'warning',
    draft: 'info'
  }
  return tagMap[status] || ''
}

// 获取状态标签文本
const getStatusLabel = (status) => {
  const labelMap = {
    active: '上架',
    inactive: '下架',
    draft: '草稿'
  }
  return labelMap[status] || status
}

// 获取图片URL
const getImageUrl = (row) => {
  // 如果已经有处理过的image字段且是完整的http URL，直接返回
  if (row.image && row.image.startsWith('http')) {
    return row.image
  }

  // 如果有productImagePath字段，转换为可访问的URL
  if (row.productImagePath) {
    // 提取文件名，支持Windows和Unix路径分隔符
    const fileName = row.productImagePath.replace(/\\/g, '/').split('/').pop()
    // 确保使用后端端口8080
    return `http://localhost:8080/images/benefit-products/${fileName}`
  }

  // 如果image字段包含本地路径，也进行转换
  if (row.image && (row.image.includes('\\') || row.image.includes(':/'))) {
    const fileName = row.image.replace(/\\/g, '/').split('/').pop()
    // 确保使用后端端口8080
    return `http://localhost:8080/images/benefit-products/${fileName}`
  }

  // 如果image字段是相对路径，转换为后端URL
  if (row.image && row.image.startsWith('/')) {
    return `http://localhost:8080${row.image}`
  }

  // 默认返回空字符串
  return ''
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadBenefitList()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    category: '',
    status: ''
  })
  handleSearch()
}

// 添加商品
const handleAdd = () => {
  dialogTitle.value = '添加商品'
  Object.assign(benefitForm, {
    id: '',
    name: '',
    code: '',
    category: '',
    price: 0,
    originalPrice: 0,
    stock: 0,
    sort: 0,
    image: '',
    description: '',
    instructions: '',
    validityPeriod: [],
    status: 'draft'
  })
  dialogVisible.value = true
}

// 编辑商品
const handleEdit = (row) => {
  dialogTitle.value = '编辑商品'

  // 复制数据到表单
  const formData = { ...row }

  // 处理图片路径：将productImagePath转换为可访问的URL
  if (row.productImagePath) {
    // 提取文件名，支持Windows和Unix路径分隔符
    const fileName = row.productImagePath.replace(/\\/g, '/').split('/').pop()
    // 确保使用后端端口8080
    formData.image = `http://localhost:8080/images/benefit-products/${fileName}`
  } else if (row.image) {
    // 如果image字段包含本地路径，进行转换
    if (row.image.includes('\\') || row.image.includes(':/')) {
      const fileName = row.image.replace(/\\/g, '/').split('/').pop()
      // 确保使用后端端口8080
      formData.image = `http://localhost:8080/images/benefit-products/${fileName}`
    } else if (row.image.startsWith('/')) {
      // 如果是相对路径，转换为完整URL
      formData.image = `http://localhost:8080${row.image}`
    } else if (row.image.startsWith('http')) {
      // 如果已经是完整URL格式，直接使用
      formData.image = row.image
    }
  }

  Object.assign(benefitForm, formData)
  dialogVisible.value = true
}

// 查看商品
const handleView = (row) => {
  // 复制数据并处理图片路径
  const detailData = { ...row }

  // 处理图片路径：将productImagePath转换为可访问的URL
  if (row.productImagePath) {
    // 提取文件名，支持Windows和Unix路径分隔符
    const fileName = row.productImagePath.replace(/\\/g, '/').split('/').pop()
    // 确保使用后端端口8080
    detailData.image = `http://localhost:8080/images/benefit-products/${fileName}`
  } else if (row.image && (row.image.includes('\\') || row.image.includes(':/'))) {
    // 如果image字段包含本地路径，也进行转换
    const fileName = row.image.replace(/\\/g, '/').split('/').pop()
    // 确保使用后端端口8080
    detailData.image = `http://localhost:8080/images/benefit-products/${fileName}`
  } else if (row.image && row.image.startsWith('/')) {
    // 如果是相对路径，转换为完整URL
    detailData.image = `http://localhost:8080${row.image}`
  }

  selectedBenefit.value = detailData
  detailsDialogVisible.value = true
}

// 删除商品
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除商品 "${row.name}" 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 这里调用删除API
    ElMessage.success('删除成功')
    loadBenefitList()
  })
}

// 切换商品状态
const handleToggleStatus = (row) => {
  const action = row.status === 'active' ? '下架' : '上架'
  ElMessageBox.confirm(
    `确定要${action}商品 "${row.name}" 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    row.status = row.status === 'active' ? 'inactive' : 'active'
    ElMessage.success(`${action}成功`)
  })
}

// 提交表单
const handleSubmit = async () => {
  try {
    await benefitFormRef.value.validate()
    // 这里调用保存API
    ElMessage.success(benefitForm.id ? '更新成功' : '添加成功')
    dialogVisible.value = false
    loadBenefitList()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 对话框关闭
const handleDialogClose = () => {
  benefitFormRef.value?.resetFields()
}

// 图片上传相关
const handleImageSuccess = (response, file) => {
  // 处理图片上传成功
}

const beforeImageUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('上传图片只能是 JPG/PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过 2MB!')
  }
  return isJPG && isLt2M
}

const handleImageUpload = (options) => {
  // 模拟图片上传
  const reader = new FileReader()
  reader.onload = (e) => {
    benefitForm.image = e.target.result
  }
  reader.readAsDataURL(options.file)
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadBenefitList()
}

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.currentPage = page
  loadBenefitList()
}

// 加载商品列表
const loadBenefitList = () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    benefitList.value = mockBenefits
    pagination.total = mockBenefits.length
    loading.value = false
  }, 500)
}

onMounted(() => {
  loadBenefitList()
})
</script>

<style scoped>
.benefit-management {
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

.price-amount {
  font-weight: bold;
  color: #F56C6C;
}

.original-price {
  text-decoration: line-through;
  color: #909399;
}

.avatar-uploader {
  text-align: center;
}

.avatar-uploader .avatar {
  width: 100px;
  height: 100px;
  border-radius: 4px;
}

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
}

.benefit-details {
  margin-top: 20px;
}

.benefit-details h4 {
  margin: 20px 0 10px 0;
  color: #303133;
}

.benefit-details p {
  margin: 10px 0;
  color: #606266;
  line-height: 1.6;
}
</style>
