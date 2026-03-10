<template>
  <div class="product-manage">
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="showAddDialog">
        {{ t('admin.addProduct') }}
      </el-button>
    </div>

    <el-table :data="products" v-loading="loading" stripe>
      <el-table-column :label="t('admin.image')" width="100">
        <template #default="{ row }">
          <el-image
            :src="row.image"
            :preview-src-list="[row.image]"
            style="width: 60px; height: 60px"
            fit="cover"
          />
        </template>
      </el-table-column>
      <el-table-column prop="name" :label="t('admin.productName')" min-width="150" />
      <el-table-column prop="points" :label="t('admin.pointsPrice')" width="120" align="center">
        <template #default="{ row }">
          <el-tag type="danger">{{ row.points }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="stock" :label="t('admin.stock')" width="100" align="center" />
      <el-table-column prop="description" :label="t('admin.description')" min-width="200" show-overflow-tooltip />
      <el-table-column :label="t('admin.action')" width="180" align="center">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="showEditDialog(row)">
            {{ t('common.edit') }}
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(row)">
            {{ t('common.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? t('admin.editProduct') : t('admin.addProduct')"
      width="500"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item :label="t('admin.productName')" prop="name">
          <el-input v-model="form.name" :placeholder="t('admin.productNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('admin.pointsPrice')" prop="points">
          <el-input-number v-model="form.points" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('admin.stockQuantity')" prop="stock">
          <el-input-number v-model="form.stock" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('admin.productDescription')">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item :label="t('admin.productImage')" prop="image">
          <el-upload
            class="image-uploader"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleImageChange"
            accept="image/*"
          >
            <img v-if="imagePreview" :src="imagePreview" class="preview-image" />
            <el-icon v-else class="uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">{{ t('admin.uploadTip') }}</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { productApi } from '../../api'

const { t } = useI18n()

const products = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const imageFile = ref(null)
const imagePreview = ref('')
const editingId = ref(null)

const form = reactive({
  name: '',
  points: 100,
  stock: 0,
  description: ''
})

const rules = computed(() => ({
  name: [{ required: true, message: t('admin.productNameRequired'), trigger: 'blur' }],
  points: [{ required: true, message: t('admin.pointsPriceRequired'), trigger: 'blur' }]
}))

const fetchProducts = async () => {
  loading.value = true
  try {
    products.value = await productApi.getAll()
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.name = ''
  form.points = 100
  form.stock = 0
  form.description = ''
  imageFile.value = null
  imagePreview.value = ''
  editingId.value = null
}

const showAddDialog = () => {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

const showEditDialog = (product) => {
  resetForm()
  isEdit.value = true
  editingId.value = product._id
  form.name = product.name
  form.points = product.points
  form.stock = product.stock
  form.description = product.description
  imagePreview.value = product.image
  dialogVisible.value = true
}

const handleImageChange = (file) => {
  imageFile.value = file.raw
  imagePreview.value = URL.createObjectURL(file.raw)
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (!isEdit.value && !imageFile.value) {
    ElMessage.warning(t('admin.pleaseUploadImage'))
    return
  }

  const formData = new FormData()
  formData.append('name', form.name)
  formData.append('points', form.points)
  formData.append('stock', form.stock)
  formData.append('description', form.description)
  if (imageFile.value) {
    formData.append('image', imageFile.value)
  }

  submitting.value = true
  try {
    if (isEdit.value) {
      await productApi.update(editingId.value, formData)
      ElMessage.success(t('admin.productUpdated'))
    } else {
      await productApi.create(formData)
      ElMessage.success(t('admin.productAdded'))
    }
    dialogVisible.value = false
    fetchProducts()
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (product) => {
  try {
    await ElMessageBox.confirm(
      t('admin.confirmDeleteProduct', { name: product.name }),
      t('common.deleteConfirm'),
      { confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel'), type: 'warning' }
    )
    await productApi.delete(product._id)
    ElMessage.success(t('admin.productDeleted'))
    fetchProducts()
  } catch (error) {
    // cancelled
  }
}

onMounted(fetchProducts)
</script>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.image-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  width: 150px;
  height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-uploader:hover {
  border-color: #409eff;
}

.preview-image {
  width: 148px;
  height: 148px;
  object-fit: cover;
}

.uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}
</style>
