<template>
  <div class="benefit-products">
    <!-- 搜索和操作栏 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchForm.productName"
            placeholder="请输入产品名称"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
                 <el-col :span="4">
           <el-select v-model="searchForm.status" placeholder="产品状态" clearable>
             <el-option label="激活" value="ACTIVE" />
             <el-option label="未激活" value="INACTIVE" />
             <el-option label="已过期" value="EXPIRED" />
             <el-option label="已删除" value="DELETED" />
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
            新增产品
          </el-button>
        </el-col>
      </el-row>
      
      <!-- 第二行搜索条件 -->
      <el-row :gutter="20" style="margin-top: 15px;">
        <el-col :span="6">
          <el-input-number
            v-model="searchForm.minPrice"
            placeholder="最低价格"
            :precision="2"
            :step="0.01"
            style="width: 100%"
            clearable
          />
        </el-col>
        <el-col :span="6">
          <el-input-number
            v-model="searchForm.maxPrice"
            placeholder="最高价格"
            :precision="2"
            :step="0.01"
            style="width: 100%"
            clearable
          />
        </el-col>
        <el-col :span="6">
          <el-date-picker
            v-model="searchForm.createTimeStart"
            type="datetime"
            placeholder="创建时间起始"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
            clearable
          />
        </el-col>
        <el-col :span="6">
          <el-date-picker
            v-model="searchForm.createTimeEnd"
            type="datetime"
            placeholder="创建时间结束"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
            clearable
          />
        </el-col>
      </el-row>
      
      
    </el-card>

    <!-- 产品列表 -->
    <el-card class="table-card">
      <el-table :data="productList" stripe v-loading="loading" border>
        <el-table-column prop="id" label="产品ID" width="100" />
        <el-table-column prop="productName" label="产品名称" width="200" />
        <el-table-column prop="price" label="价格" width="120">
          <template #default="scope">
            <span class="price-amount">¥{{ scope.row.price?.toFixed(2) || '0.00' }}</span>
          </template>
        </el-table-column>
                 <el-table-column prop="status" label="状态" width="100">
           <template #default="scope">
             <el-tag :type="getStatusType(scope.row.status)">
               {{ getStatusLabel(scope.row.status) }}
             </el-tag>
           </template>
         </el-table-column>
        <el-table-column prop="remark" label="备注" width="300" />
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="scope">
            {{ formatTime(scope.row.createTime) }}
          </template>
        </el-table-column>
                                   <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button 
                v-if="scope.row.status !== 'DELETED'"
                size="small" 
                @click="handleEdit(scope.row)"
              >
                编辑
              </el-button>
              
              <span v-if="scope.row.status === 'DELETED'" class="text-muted">
                已删除
              </span>
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

    <!-- 新增/编辑产品对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
    >
      <el-form
        ref="productFormRef"
        :model="productForm"
        :rules="productFormRules"
        label-width="100px"
      >
                 <el-form-item label="产品名称" prop="productName">
           <el-input v-model="productForm.productName" placeholder="请输入产品名称" />
         </el-form-item>
         <el-form-item label="产品图片" prop="file">
           <!-- 编辑时显示现有图片 -->
           <div v-if="productForm.id && productForm.previewImageUrl && !productForm.file" class="existing-image">
             <el-image
               :src="productForm.previewImageUrl"
               :preview-src-list="[productForm.previewImageUrl]"
               fit="cover"
               style="width: 100px; height: 100px; border-radius: 4px; margin-bottom: 10px;"
             />
             <div style="font-size: 12px; color: #909399; margin-bottom: 10px;">
               当前图片（如需更换请上传新图片）
             </div>
           </div>
           
           <el-upload
             ref="uploadRef"
             :auto-upload="false"
             :on-change="handleFileChange"
             :on-remove="handleFileRemove"
             :limit="1"
             accept="image/*"
             list-type="picture-card"
             :file-list="fileList"
             :before-upload="() => false"
             :show-file-list="true"
           >
             <el-icon><Plus /></el-icon>
             <template #tip>
               <div class="el-upload__tip">
                 {{ productForm.id ? '上传新图片将替换当前图片，不选择则保持当前图片' : '只能上传jpg/png文件，且不超过2MB' }}
               </div>
             </template>
           </el-upload>
           
                       <!-- 编辑时的提示信息 -->
            <div v-if="productForm.id" style="margin-top: 8px; font-size: 12px; color: #909399;">
              {{ productForm.file ? '已选择新图片，将替换当前图片' : '未选择新图片，将保持当前图片（自动下载上传）' }}
            </div>
           
           <!-- 新增时的调试信息 -->
           <div v-if="!productForm.id" style="margin-top: 8px; font-size: 12px; color: #909399;">
             当前文件状态: {{ productForm.file ? '已选择' : '未选择' }}
           </div>
         </el-form-item>
        <el-form-item label="产品价格" prop="price">
          <el-input-number
            v-model="productForm.price"
            :min="0"
            :precision="2"
            :step="0.01"
            style="width: 100%"
            placeholder="请输入产品价格"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="productForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
                 <el-form-item label="产品状态" prop="status">
           <el-radio-group v-model="productForm.status">
             <el-radio label="ACTIVE">激活</el-radio>
             <el-radio label="INACTIVE">未激活</el-radio>
             <el-radio label="EXPIRED">已过期</el-radio>
             <el-radio label="DELETED">已删除</el-radio>
           </el-radio-group>
         </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Calendar } from '@element-plus/icons-vue'
import { config } from '@/config'

// 搜索表单
const searchForm = reactive({
  productName: '',      // 产品名称
  status: null,         // 产品状态
  minPrice: null,       // 最低价格
  maxPrice: null,       // 最高价格
  createTimeStart: null, // 创建时间起始
  createTimeEnd: null    // 创建时间结束
})

// 产品列表数据
const productList = ref([])
const loading = ref(false)

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const productFormRef = ref(null)
const productForm = reactive({
  id: null,
  productName: '',
  price: 0,
  remark: '',
  status: 'ACTIVE',
  file: null,
  previewImageUrl: null // 用于编辑时显示现有图片
})

// 文件列表状态
const fileList = ref([])

// 表单验证规则
const productFormRules = computed(() => {
  const rules = {
    productName: [
      { required: true, message: '请输入产品名称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    price: [
      { required: true, message: '请输入产品价格', trigger: 'blur' },
      { type: 'number', min: 0, message: '价格不能小于0', trigger: 'blur' }
    ],
    status: [
      { required: true, message: '请选择产品状态', trigger: 'change' }
    ]
  }
  
  // 新增时要求上传文件
  if (!productForm.id) {
    rules.file = [
      { 
        required: true, 
        message: '请选择产品图片', 
        trigger: 'change',
        validator: (rule, value, callback) => {
          if (!productForm.file) {
            callback(new Error('请选择产品图片'))
          } else {
            callback()
          }
        }
      }
    ]
  } else {
    // 编辑时要求有图片（新上传的或现有的）
    rules.file = [
      {
        required: true,
        message: '请选择产品图片或保持现有图片',
        trigger: 'change',
        validator: (rule, value, callback) => {
          if (!productForm.file && !productForm.previewImageUrl) {
            callback(new Error('请选择产品图片或保持现有图片'))
          } else {
            callback()
          }
        }
      }
    ]
  }
  
  return rules
})



// 获取状态标签类型
const getStatusType = (status) => {
  const statusMap = {
    'ACTIVE': 'success',    // 激活 - 绿色
    'INACTIVE': 'info',     // 未激活 - 灰色
    'EXPIRED': 'warning',   // 已过期 - 橙色
    'DELETED': 'danger'     // 已删除 - 红色
  }
  return statusMap[status] || 'warning'
}

// 获取状态标签文本
const getStatusLabel = (status) => {
  const statusMap = {
    'ACTIVE': '激活',
    'INACTIVE': '未激活',
    'EXPIRED': '已过期',
    'DELETED': '已删除'
  }
  return statusMap[status] || '未知'
}

// 获取图片URL（通用函数）
const getImageUrl = (imagePath) => {
  if (!imagePath) return ''
  
  // 如果已经是完整的http URL格式，直接返回
  if (imagePath.startsWith('http')) {
    return imagePath
  }
  
  // 如果是本地路径，转换为可访问的URL
  if (imagePath.includes('\\') || imagePath.includes(':/')) {
    const fileName = imagePath.replace(/\\/g, '/').split('/').pop()
    // 确保使用后端端口8080
    return `http://localhost:8080/images/benefit-products/${fileName}`
  }
  
  // 如果是相对路径，也转换为后端URL
  if (imagePath.startsWith('/')) {
    return `http://localhost:8080${imagePath}`
  }
  
  return imagePath
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

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadProductList()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    productName: '',
    status: null,
    minPrice: null,
    maxPrice: null,
    createTimeStart: null,
    createTimeEnd: null
  })
  handleSearch()
}

// 新增产品
const handleAdd = () => {
  dialogTitle.value = '新增产品'
  Object.assign(productForm, {
    id: null,
    productName: '',
    price: 0,
    remark: '',
    status: 'ACTIVE',
    file: null,
    previewImageUrl: null
  })
  // 清空文件上传组件和文件列表
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
  fileList.value = []
  dialogVisible.value = true
}

// 编辑产品
const handleEdit = (row) => {
  dialogTitle.value = '编辑产品'
  
  // 复制数据到表单
  const formData = { ...row }
  
  // 处理图片路径：如果有productImagePath，设置预览图片URL
  if (row.productImagePath) {
    // 提取文件名，支持Windows和Unix路径分隔符
    const fileName = row.productImagePath.replace(/\\/g, '/').split('/').pop()
    // 确保使用后端端口8080
    formData.previewImageUrl = `http://localhost:8080/images/benefit-products/${fileName}`
  }
  
  Object.assign(productForm, formData)
  // 编辑时不要求上传文件
  productForm.file = null
  // 清空文件列表，显示现有图片
  fileList.value = []
  dialogVisible.value = true
}

// 文件上传引用
const uploadRef = ref(null)

// 处理文件选择
const handleFileChange = (file, fileList) => {
  console.log('文件选择:', file, '文件列表:', fileList)
  
  try {
    // 使用安全的文件验证函数
    if (!isValidImageFile(file)) {
      ElMessage.error('请选择有效的图片文件（jpg/png/gif等，大小不超过2MB）')
      // 移除文件
      if (uploadRef.value) {
        uploadRef.value.clearFiles()
      }
      productForm.file = null
      return false
    }
    
    // 设置文件到表单
    productForm.file = file.raw
    // 更新文件列表状态
    fileList.value = [file]
    console.log('文件已设置到表单:', productForm.file)
    console.log('文件列表已更新:', fileList.value)
    
    if (productForm.id) {
      ElMessage.success('新图片已选择，将替换当前图片')
    } else {
      ElMessage.success('图片上传成功')
    }
  } catch (error) {
    console.error('文件处理错误:', error)
    ElMessage.error('文件处理失败，请重试')
    // 清理状态
    if (uploadRef.value) {
      uploadRef.value.clearFiles()
    }
    productForm.file = null
    fileList.value = []
  }
}

// 处理文件移除
const handleFileRemove = (file, fileList) => {
  console.log('文件被移除:', file, '剩余文件列表:', fileList)
  productForm.file = null
  
  // 更新文件列表状态 - 确保 fileList 是数组
  if (Array.isArray(fileList)) {
    fileList.value = fileList
  } else {
    fileList.value = []
  }
  
  // 编辑时，如果移除了新选择的文件，提示用户
  if (productForm.id && productForm.previewImageUrl) {
    ElMessage.info('已移除新选择的图片，将保持现有图片')
  }
}

// 检查文件是否已上传
const hasFile = computed(() => {
  return productForm.file !== null && productForm.file !== undefined
})

// 检查编辑时是否有图片（新上传的或现有的）
const hasImageForEdit = computed(() => {
  if (!productForm.id) return true // 新增时不需要检查
  return productForm.file !== null || productForm.previewImageUrl !== null
})

// 安全的文件类型检查
const isValidImageFile = (file) => {
  if (!file || !file.raw) {
    return false
  }
  
  // 检查文件大小
  if (file.raw.size > 2 * 1024 * 1024) {
    return false
  }
  
  // 检查文件类型
  let isImage = false
  
  // 检查 MIME 类型
  if (file.type && typeof file.type === 'string') {
    isImage = file.type.startsWith('image/')
  }
  
  if (!isImage && file.raw.type && typeof file.raw.type === 'string') {
    isImage = file.raw.type.startsWith('image/')
  }
  
  // 检查文件扩展名
  if (!isImage && file.name) {
    const extension = file.name.toLowerCase().split('.').pop()
    isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)
  }
  
  return isImage
}





// 提交表单
const handleSubmit = async () => {
  try {
    // 手动验证文件字段（新增时）
    if (!productForm.id && !productForm.file) {
      ElMessage.error('请选择产品图片')
      return
    }
    
    // 编辑时验证：必须有图片（要么现有图片，要么新上传的图片）
    if (productForm.id && !productForm.file && !productForm.previewImageUrl) {
      ElMessage.error('请选择产品图片')
      return
    }
    
    await productFormRef.value.validate()
    
    if (productForm.id) {
      // 编辑产品 - 调用更新接口
      await handleUpdateProduct()
    } else {
      // 新增产品
      await handleInsertProduct()
    }
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 新增产品
const handleInsertProduct = async () => {
  try {
    console.log('开始新增产品，当前文件状态:', productForm.file)
    
    // 再次检查是否选择了文件
    if (!productForm.file) {
      ElMessage.error('请选择产品图片')
      return
    }
    
    // 构建FormData - 修复multipart/form-data格式问题
    const formData = new FormData()
    
    // 添加文件 - 确保文件名正确
    const file = productForm.file
    const fileName = file.name || 'product-image.jpg'
    formData.append('file', file, fileName)
    
    // 构建产品请求参数 - 根据后端接口要求，使用@RequestPart
    const productRequest = {
      productName: productForm.productName,
      price: productForm.price,
      remark: productForm.remark,
      status: productForm.status
    }
    
    // 将产品请求参数作为JSON字符串添加到FormData（以application/json的Blob传递，兼容@RequestPart）
    const productRequestBlob = new Blob([JSON.stringify(productRequest)], { type: 'application/json' })
    formData.append('productRequest', productRequestBlob, 'productRequest.json')
    
    // 调用后端接口
    const { insertProduct } = await import('@/api/user')
    const response = await insertProduct(formData)
    
    if (response.code === 200) {
      ElMessage.success('新增产品成功')
      dialogVisible.value = false
      loadProductList()
    } else {
      ElMessage.error(response.message || '新增产品失败')
    }
  } catch (error) {
    console.error('新增产品失败:', error)
    ElMessage.error('新增产品失败，请稍后重试')
  }
}

// 更新产品
const handleUpdateProduct = async () => {
  try {
    console.log('开始更新产品，产品ID:', productForm.id)
    
    // 构建FormData - 使用与新增产品相同的方式
    const formData = new FormData()
    
    // 处理文件上传
    if (productForm.file) {
      // 如果有新上传的文件，使用新文件
      const file = productForm.file
      const fileName = file.name || 'product-image.jpg'
      formData.append('file', file, fileName)
      console.log('使用新上传的图片文件:', fileName)
    } else if (productForm.previewImageUrl) {
      // 如果没有新文件，需要从现有图片URL下载图片再上传
      try {
        console.log('下载现有图片:', productForm.previewImageUrl)
        
        // 从现有图片URL下载图片
        const response = await fetch(productForm.previewImageUrl)
        if (!response.ok) {
          throw new Error(`下载图片失败: ${response.status}`)
        }
        
        const blob = await response.blob()
        // 从URL中提取文件名
        const fileName = productForm.previewImageUrl.split('/').pop()
        formData.append('file', blob, fileName)
        console.log('成功下载并添加现有图片:', fileName)
      } catch (downloadError) {
        console.error('下载现有图片失败:', downloadError)
        ElMessage.error('处理现有图片失败，请重新选择图片')
        return
      }
    } else {
      // 如果既没有新文件也没有现有图片，提示用户
      ElMessage.error('请选择产品图片')
      return
    }
    
    // 构建产品请求参数 - 使用@RequestPart("product")
    const productRequest = {
      id: productForm.id,
      productName: productForm.productName,
      price: productForm.price,
      remark: productForm.remark,
      status: productForm.status
    }
    
    // 将产品请求参数作为JSON字符串添加到FormData（以application/json的Blob传递，兼容@RequestPart）
    const productRequestBlob = new Blob([JSON.stringify(productRequest)], { type: 'application/json' })
    formData.append('product', productRequestBlob, 'product.json')
    
    console.log('更新产品请求参数:', productRequest)
    
    // 调用后端更新接口
    const { updateProduct } = await import('@/api/user')
    const response = await updateProduct(formData)
    
    if (response.code === 200) {
      ElMessage.success('更新产品成功')
      dialogVisible.value = false
      loadProductList()
    } else {
      ElMessage.error(response.message || '更新产品失败')
    }
  } catch (error) {
    console.error('更新产品失败:', error)
    ElMessage.error('更新产品失败，请稍后重试')
  }
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadProductList()
}

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.currentPage = page
  loadProductList()
}

// 加载产品列表
const loadProductList = async () => {
  loading.value = true
  try {
         // 构建请求参数
     const request = {
       productName: searchForm.productName || undefined,
       status: searchForm.status,
       minPrice: searchForm.minPrice,
       maxPrice: searchForm.maxPrice,
       createTimeStart: searchForm.createTimeStart,
       createTimeEnd: searchForm.createTimeEnd,
       pageNum: pagination.currentPage,
       pageSize: pagination.pageSize
     }
    
    // 移除undefined的字段
    Object.keys(request).forEach(key => {
      if (request[key] === undefined || request[key] === null || request[key] === '') {
        delete request[key]
      }
    })
    
    const { queryAllProduct } = await import('@/api/user')
    const response = await queryAllProduct(request)
    
         if (response.code === 200 && response.data) {
       // 后端返回的数据结构是 data.data，需要适配
       const resultData = response.data.data || response.data.records || []
       const total = response.data.total || 0
       
       productList.value = resultData
       pagination.total = total
       
       console.log('产品列表数据:', resultData)
       console.log('总数:', total)
     } else {
       ElMessage.error(response.message || '获取产品列表失败')
       productList.value = []
       pagination.total = 0
     }
  } catch (error) {
    console.error('获取产品列表失败:', error)
    ElMessage.error('获取产品列表失败，请稍后重试')
    productList.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProductList()
})
</script>

<style scoped>
.benefit-products {
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

.price-amount {
  font-weight: bold;
  color: #E6A23C;
}

.points-amount {
  font-weight: bold;
  color: #67C23A;
}

.text-muted {
  color: #909399;
  font-style: italic;
}
</style>
