<template>
  <div class="benefit-packages">
    <!-- 搜索和操作栏 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchForm.packageName"
            placeholder="请输入权益包名称"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.status" placeholder="状态" clearable>
            <el-option label="启用" value="ACTIVE" />
            <el-option label="禁用" value="INACTIVE" />
            <el-option label="已过期" value="EXPIRED" />
            <el-option label="已删除" value="DELETED" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-input-number
            v-model="searchForm.quantity"
            placeholder="库存"
            :min="0"
            style="width: 100%"
            clearable
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
          <el-button type="success" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增权益包
          </el-button>
        </el-col>
      </el-row>
      
             <!-- 第二行搜索条件 -->
       <el-row :gutter="20" style="margin-top: 15px;">
         <el-col :span="6">
           <el-input-number
             v-model="searchForm.price"
             placeholder="价格"
             :precision="2"
             :step="0.01"
             style="width: 100%"
             clearable
           />
         </el-col>
       </el-row>
    </el-card>

    <!-- 权益包列表 -->
    <el-card class="table-card">
      <el-table :data="packageList" stripe v-loading="loading" border>
        <el-table-column prop="id" label="权益包ID" width="100" />
        <el-table-column prop="packageName" label="权益包名称" width="200" />
                 <el-table-column prop="productNames" label="权益产品" width="280">
           <template #default="scope">
             <div v-if="scope.row.productNames && scope.row.productNames.length > 0" class="product-tags">
               <el-tag 
                 v-for="productName in scope.row.productNames" 
                 :key="productName"
                 size="small"
                 type="info"
                 class="product-tag"
               >
                 {{ productName }}
               </el-tag>
               <span class="product-count">({{ scope.row.productNames.length }}个产品)</span>
             </div>
             <span v-else class="text-muted">暂无权益产品</span>
           </template>
         </el-table-column>
        <el-table-column prop="quantity" label="库存" width="100">
          <template #default="scope">
            <span class="quantity-amount">{{ scope.row.quantity || 0 }}</span>
          </template>
        </el-table-column>
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
        <el-table-column prop="remark" label="备注" width="200" />
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="scope">
            {{ formatTime(scope.row.createTime) }}
          </template>
                </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑权益包对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
    >
      <el-form
        ref="packageFormRef"
        :model="packageForm"
        :rules="packageFormRules"
        label-width="100px"
      >
        <el-form-item label="权益包名称" prop="packageName">
          <el-input v-model="packageForm.packageName" placeholder="请输入权益包名称" />
        </el-form-item>
                 <el-form-item label="权益包图片" prop="file">
                     <!-- 显示现有图片 -->
           <div v-if="packageForm.imagePath && !packageForm.file" class="existing-image">
             <el-image
               :src="getImageUrl(packageForm.imagePath)"
               style="width: 120px; height: 80px; object-fit: cover; border-radius: 4px;"
               fit="cover"
               :preview-src-list="[getImageUrl(packageForm.imagePath)]"
             />
             <div class="image-info">
               <span class="image-name">{{ packageForm.imagePath.split('/').pop() }}</span>
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
            <el-button type="primary">{{ packageForm.imagePath ? '更换图片' : '选择图片' }}</el-button>
            <template #tip>
              <div class="el-upload__tip">
                只能上传jpg/png文件，且不超过2MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
         <el-form-item label="权益产品" prop="productNames">
           <el-select
             v-model="packageForm.productNames"
             multiple
             placeholder="请选择权益产品"
             style="width: 100%"
             filterable
             remote
             :remote-method="handleProductSearch"
             :loading="productLoading"
           >
             <el-option
               v-for="product in productOptions"
               :key="product.id"
               :label="product.productName"
               :value="product.productName"
             />
           </el-select>
         </el-form-item>
        <el-form-item label="库存数量" prop="quantity">
          <el-input-number
            v-model="packageForm.quantity"
            :min="0"
            :precision="0"
            style="width: 100%"
            placeholder="请输入库存数量"
          />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number
            v-model="packageForm.price"
            :min="0"
            :precision="2"
            :step="0.01"
            style="width: 100%"
            placeholder="请输入价格"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="packageForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="packageForm.status">
            <el-radio label="ACTIVE">启用</el-radio>
            <el-radio label="INACTIVE">禁用</el-radio>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'

// 搜索表单
const searchForm = reactive({
  id: null,           // 权益包ID
  packageName: '',    // 权益包名称
  productNames: [],   // 权益产品名称列表
  status: null,       // 状态
  quantity: null,     // 库存
  price: null         // 价格
})

// 权益包列表数据
const packageList = ref([])
const loading = ref(false)

// 分页信息
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const packageFormRef = ref(null)
const uploadRef = ref(null)
const packageForm = reactive({
  id: null,
  packageName: '',
  productNames: [],
  status: 'ACTIVE',
  quantity: 0,
  price: 0,
  remark: '',
  createTime: null,
  file: null,
  imagePath: '' // 存储现有图片路径
})

// 权益产品选项
const productOptions = ref([])
const productLoading = ref(false)

// 表单验证规则
const packageFormRules = {
  packageName: [
    { required: true, message: '请输入权益包名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  file: [
    { 
      validator: (rule, value, callback) => {
        if (!value && !packageForm.imagePath) {
          callback(new Error('请选择权益包图片'))
        } else {
          callback()
        }
      }, 
      trigger: 'change' 
    }
  ],
  productNames: [
    { required: true, message: '请选择权益产品', trigger: 'change' }
  ],
  quantity: [
    { required: true, message: '请输入库存数量', trigger: 'blur' },
    { type: 'number', min: 0, message: '库存不能小于0', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入价格', trigger: 'blur' },
    { type: 'number', min: 0, message: '价格不能小于0', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择权益包状态', trigger: 'change' }
  ]
}

// 获取状态标签类型
const getStatusType = (status) => {
  const statusMap = {
    'ACTIVE': 'success',    // 启用 - 绿色
    'INACTIVE': 'info',     // 禁用 - 灰色
    'EXPIRED': 'warning',   // 已过期 - 橙色
    'DELETED': 'danger'     // 已删除 - 红色
  }
  return statusMap[status] || 'warning'
}

// 获取状态标签文本
const getStatusLabel = (status) => {
  const statusMap = {
    'ACTIVE': '启用',
    'INACTIVE': '禁用',
    'EXPIRED': '已过期',
    'DELETED': '已删除'
  }
  return statusMap[status] || '未知'
}

// 对权益包数据进行分组处理
const groupPackageData = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return []
  }
  
  // 按权益包ID分组
  const packageMap = new Map()
  
  data.forEach((item) => {
    const packageId = item.id || item.packageId
    
    if (!packageMap.has(packageId)) {
      // 创建新的权益包记录
      packageMap.set(packageId, {
        id: packageId,
        packageName: item.packageName || '',
        status: item.status || 'ACTIVE',
        quantity: item.quantity || 0,
        price: item.price || 0,
        remark: item.remark || '',
        createTime: item.createTime || null,
        imagePath: item.imagePath || item.packageImagePath || item.image || item.packageImage || '', // 添加图片路径
        productNames: [], // 存储权益产品名称列表
        products: []      // 存储完整的权益产品信息
      })
    }
    
    // 添加权益产品信息
    const existingPackage = packageMap.get(packageId)
    
    // 处理不同的产品数据结构
    if (item.productName) {
      // 单个产品名称
      if (!existingPackage.productNames.includes(item.productName)) {
        existingPackage.productNames.push(item.productName)
        existingPackage.products.push({
          productName: item.productName,
          // 可以添加其他产品相关字段
        })
      }
    } else if (item.productNames && Array.isArray(item.productNames)) {
      // 产品名称数组
      item.productNames.forEach(productName => {
        if (productName && !existingPackage.productNames.includes(productName)) {
          existingPackage.productNames.push(productName)
          existingPackage.products.push({
            productName: productName,
          })
        }
      })
    } else if (item.products && Array.isArray(item.products)) {
      // 产品对象数组
      item.products.forEach(product => {
        const productName = product.productName || product.name
        if (productName && !existingPackage.productNames.includes(productName)) {
          existingPackage.productNames.push(productName)
          existingPackage.products.push({
            productName: productName,
            ...product
          })
        }
      })
    }
  })
  
  // 转换为数组并排序
  const result = Array.from(packageMap.values())
  result.sort((a, b) => {
    // 按创建时间倒序排列
    if (a.createTime && b.createTime) {
      return new Date(b.createTime) - new Date(a.createTime)
    }
    // 如果没有创建时间，按ID排序
    return (b.id || 0) - (a.id || 0)
  })
  
  return result
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
  pagination.pageNum = 1
  loadPackageList()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    id: null,
    packageName: '',
    productNames: [],
    status: null,
    quantity: null,
    price: null
  })
  handleSearch()
}

// 新增权益包
const handleAdd = () => {
  dialogTitle.value = '新增权益包'
  Object.assign(packageForm, {
    id: null,
    packageName: '',
    productNames: [],
    status: 'ACTIVE',
    quantity: 0,
    price: 0,
    remark: '',
    createTime: null,
    file: null,
    imagePath: '' // 重置图片路径
  })
  // 重置文件上传组件
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
  // 重置产品选项
  productOptions.value = []
  // 加载权益产品选项
  loadProductOptions()
  dialogVisible.value = true
}

// 编辑权益包
const handleEdit = (row) => {
  dialogTitle.value = '编辑权益包'
  
  // 尝试多种可能的图片路径字段
  const imagePath = row.imagePath || row.packageImagePath || row.image || row.packageImage || ''
  
  Object.assign(packageForm, {
    ...row,
    imagePath: imagePath
  })
  
  dialogVisible.value = true
}



// 文件选择处理
const handleFileChange = (file) => {
  packageForm.file = file.raw
}

// 文件移除处理
const handleFileRemove = () => {
  packageForm.file = null
}

// 获取图片URL
const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return ''
  }
  
  // 如果已经是完整URL，直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // 清理路径，移除开头的斜杠和可能的 images 目录前缀
  let finalPath = imagePath.replace(/^\/+/, '').replace(/^images\//, '')
  
  // 权益包图片保存在 /images/benefit-packages/ 路径下
  // 如果路径不包含 benefit-packages，则自动添加
  if (!finalPath.includes('benefit-packages')) {
    finalPath = `benefit-packages/${finalPath}`
  }
  
  const finalUrl = `http://localhost:8080/images/${finalPath}`
  return finalUrl
}

// 移除现有图片
const removeExistingImage = () => {
  packageForm.imagePath = ''
  // 清空文件上传组件
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

// 加载权益产品选项
const loadProductOptions = async () => {
  try {
    const { queryAllProduct } = await import('@/api/user')
    
    // 尝试不同的分页参数组合
    const requestParams = {
      pageNum: 1,
      pageSize: 100, // 获取所有产品
      status: 'ACTIVE' // 只获取启用的产品
    }
    
    const response = await queryAllProduct(requestParams)
    
    if (response.code === 200 && response.data) {
      const products = response.data.data || response.data.records || []
      productOptions.value = products
    } else {
      // 尝试不带分页参数的请求
      await tryLoadProductsWithoutPagination()
    }
  } catch (error) {
    // 尝试不带分页参数的请求
    await tryLoadProductsWithoutPagination()
  }
}

// 尝试不带分页参数加载产品
const tryLoadProductsWithoutPagination = async () => {
  try {
    const { queryAllProduct } = await import('@/api/user')
    const response = await queryAllProduct({
      status: 'ACTIVE'
    })
    
    if (response.code === 200 && response.data) {
      const products = response.data.data || response.data.records || []
      productOptions.value = products
    } else {
      productOptions.value = []
      ElMessage.error('获取权益产品列表失败')
    }
  } catch (error) {
    productOptions.value = []
    ElMessage.error('获取权益产品列表失败')
  }
}

// 产品搜索处理
const handleProductSearch = async (query) => {
  if (query !== '') {
    productLoading.value = true
    try {
      const { queryAllProduct } = await import('@/api/user')
      const response = await queryAllProduct({
        productName: query,
        status: 'ACTIVE',
        pageNum: 1,
        pageSize: 100 // 搜索时限制数量
      })
      
      if (response.code === 200 && response.data) {
        const products = response.data.data || response.data.records || []
        productOptions.value = products
      } else {
        productOptions.value = []
      }
    } catch (error) {
      productOptions.value = []
    } finally {
      productLoading.value = false
    }
  } else {
    // 如果搜索词为空，加载所有产品
    loadProductOptions()
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await packageFormRef.value.validate()
    
    if (packageForm.id) {
      // 编辑模式
      await handleUpdatePackage()
    } else {
      // 新增模式
      await handleSavePackage()
    }
    
    dialogVisible.value = false
    loadPackageList()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 保存权益包
const handleSavePackage = async () => {
  try {
    // 检查是否有图片（新上传的文件或现有图片）
    if (!packageForm.file && !packageForm.imagePath) {
      ElMessage.error('请选择权益包图片')
      return
    }
    
    // 构建FormData
    const formData = new FormData()
    
    // 如果有新上传的文件，使用新文件
    if (packageForm.file) {
      formData.append('file', packageForm.file)
    } else if (packageForm.imagePath) {
      // 如果没有新文件但有现有图片，需要重新下载并上传
      try {
        const imageUrl = getImageUrl(packageForm.imagePath)
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        const fileName = packageForm.imagePath.split('/').pop() || 'package-image.jpg'
        formData.append('file', blob, fileName)
      } catch (error) {
        console.error('下载现有图片失败:', error)
        ElMessage.error('处理现有图片失败，请重新选择图片')
        return
      }
    }
    
    // 构建请求参数
    const request = {
      packageName: packageForm.packageName,
      price: packageForm.price,
      productNames: packageForm.productNames,
      remark: packageForm.remark,
      quantity: packageForm.quantity,
      status: packageForm.status
    }
    
    // 将请求参数转换为Blob并添加到FormData
    const requestBlob = new Blob([JSON.stringify(request)], { type: 'application/json' })
    formData.append('request', requestBlob, 'request.json')
    
    // 调用后端接口
    const { savePackage } = await import('@/api/user')
    const response = await savePackage(formData)
    
    if (response.code === 200) {
      ElMessage.success('新增权益包成功')
    } else {
      ElMessage.error(response.message || '新增权益包失败')
    }
  } catch (error) {
    console.error('新增权益包失败:', error)
    ElMessage.error('新增权益包失败，请稍后重试')
  }
}

// 更新权益包
const handleUpdatePackage = async () => {
  try {
    // 检查是否有图片（新上传的文件或现有图片）
    if (!packageForm.file && !packageForm.imagePath) {
      ElMessage.error('请选择权益包图片')
      return
    }
    
    // 构建FormData
    const formData = new FormData()
    
    // 如果有新上传的文件，使用新文件
    if (packageForm.file) {
      formData.append('file', packageForm.file)
    } else if (packageForm.imagePath) {
      // 如果没有新文件但有现有图片，需要重新下载并上传
      try {
        const imageUrl = getImageUrl(packageForm.imagePath)
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        const fileName = packageForm.imagePath.split('/').pop() || 'package-image.jpg'
        formData.append('file', blob, fileName)
      } catch (error) {
        console.error('下载现有图片失败:', error)
        ElMessage.error('处理现有图片失败，请重新选择图片')
        return
      }
    }
    
    // 构建请求参数
    const request = {
      id: packageForm.id,
      packageName: packageForm.packageName,
      price: packageForm.price,
      productNames: packageForm.productNames,
      remark: packageForm.remark,
      quantity: packageForm.quantity,
      status: packageForm.status
    }
    
    // 将请求参数转换为Blob并添加到FormData
    const requestBlob = new Blob([JSON.stringify(request)], { type: 'application/json' })
    formData.append('request', requestBlob, 'request.json')
    
    // 调用后端接口
    const { updatePackage } = await import('@/api/user')
    const response = await updatePackage(formData)
    
    if (response.code === 200) {
      ElMessage.success('更新权益包成功')
    } else {
      ElMessage.error(response.message || '更新权益包失败')
    }
  } catch (error) {
    console.error('更新权益包失败:', error)
    ElMessage.error('更新权益包失败，请稍后重试')
  }
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadPackageList()
}

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.pageNum = page
  loadPackageList()
}

// 加载权益包列表
const loadPackageList = async () => {
  loading.value = true
  try {
          // 构建请求参数
      const request = {
        id: searchForm.id || undefined,
        packageName: searchForm.packageName || undefined,
        productNames: searchForm.productNames.length > 0 ? searchForm.productNames : undefined,
        status: searchForm.status,
        quantity: searchForm.quantity,
        price: searchForm.price,
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize
      }
      
      // 移除undefined的字段
      Object.keys(request).forEach(key => {
        if (request[key] === undefined || request[key] === null || request[key] === '') {
          delete request[key]
        }
      })
      
      // 调用后端接口
      const { queryPackage } = await import('@/api/user')
      const response = await queryPackage(request)
      
      if (response.code === 200 && response.data) {
        // 后端返回的数据结构是 data.data，需要适配
        const resultData = response.data.data || response.data.records || []
        const total = response.data.total || 0
        
        // 对数据进行分组处理，相同权益包ID的数据合并到同一行
        const groupedData = groupPackageData(resultData)
        
        packageList.value = groupedData
        pagination.total = total
      } else {
        ElMessage.error(response.message || '获取权益包列表失败')
        packageList.value = []
        pagination.total = 0
      }
    } catch (error) {
      ElMessage.error('获取权益包列表失败，请稍后重试')
      packageList.value = []
      pagination.total = 0
    } finally {
      loading.value = false
    }
  }

onMounted(() => {
  loadPackageList()
})
</script>

<style scoped>
.benefit-packages {
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

.points-amount {
  font-weight: bold;
  color: #67C23A;
}

.quantity-amount {
  font-weight: bold;
  color: #409EFF;
}

.price-amount {
  font-weight: bold;
  color: #E6A23C;
}

.text-muted {
  color: #909399;
  font-style: italic;
}

.product-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
}

.product-tag {
  margin: 0;
}

.product-count {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}

.el-upload__tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.2;
  margin-top: 5px;
}

.existing-image {
  margin-bottom: 15px;
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #fafafa;
}

.image-info {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.image-name {
  font-size: 12px;
  color: #606266;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.debug-info {
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 10px;
  font-family: monospace;
  word-break: break-all;
}
</style>
