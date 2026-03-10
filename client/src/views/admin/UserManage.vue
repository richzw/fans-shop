<template>
  <div class="user-manage">
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="showAddDialog">
        {{ t('admin.addUser') }}
      </el-button>
    </div>

    <el-table :data="users" v-loading="loading" stripe>
      <el-table-column prop="username" :label="t('admin.username')" width="150" />
      <el-table-column prop="points" :label="t('admin.points')" width="120" align="center">
        <template #default="{ row }">
          <el-tag type="warning">{{ row.points }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('admin.recipientCol')" prop="recipient" min-width="120" />
      <el-table-column :label="t('admin.phoneCol')" prop="phone" width="130" />
      <el-table-column :label="t('admin.addressCol')" prop="address" min-width="200" show-overflow-tooltip />
      <el-table-column :label="t('admin.firstLogin')" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.isFirstLogin ? 'warning' : 'success'" size="small">
            {{ row.isFirstLogin ? t('common.yes') : t('common.no') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('admin.action')" width="240" align="center">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="showEditDialog(row)">
            {{ t('common.edit') }}
          </el-button>
          <el-button type="warning" size="small" @click="showPointsDialog(row)">
            {{ t('admin.setPoints') }}
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(row)">
            {{ t('common.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? t('admin.editUser') : t('admin.addUser')"
      width="400"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item :label="t('admin.username')" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" :placeholder="t('admin.usernamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('admin.password')" :prop="isEdit ? '' : 'password'">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            :placeholder="isEdit ? t('admin.passwordPlaceholderEdit') : t('admin.passwordPlaceholderAdd')"
          />
        </el-form-item>
        <el-form-item :label="t('admin.initialPoints')" prop="points">
          <el-input-number v-model="form.points" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="pointsDialogVisible" :title="t('admin.setPoints')" width="400">
      <el-form label-width="100px">
        <el-form-item :label="t('admin.username')">
          <el-input :model-value="selectedUser?.username" disabled />
        </el-form-item>
        <el-form-item :label="t('admin.currentPoints')">
          <el-tag type="info">{{ selectedUser?.points }}</el-tag>
        </el-form-item>
        <el-form-item :label="t('admin.newPoints')">
          <el-input-number v-model="newPoints" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pointsDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleUpdatePoints" :loading="updatingPoints">
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
import { userApi } from '../../api'

const { t } = useI18n()

const users = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const editingId = ref(null)

const pointsDialogVisible = ref(false)
const selectedUser = ref(null)
const newPoints = ref(0)
const updatingPoints = ref(false)

const form = reactive({
  username: '',
  password: '',
  points: 0
})

const rules = computed(() => ({
  username: [{ required: true, message: t('admin.usernameRequired'), trigger: 'blur' }],
  password: [{ required: true, message: t('admin.passwordRequired'), trigger: 'blur' }]
}))

const fetchUsers = async () => {
  loading.value = true
  try {
    users.value = await userApi.getAll()
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.username = ''
  form.password = ''
  form.points = 0
  editingId.value = null
}

const showAddDialog = () => {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

const showEditDialog = (user) => {
  resetForm()
  isEdit.value = true
  editingId.value = user._id
  form.username = user.username
  form.points = user.points
  dialogVisible.value = true
}

const showPointsDialog = (user) => {
  selectedUser.value = user
  newPoints.value = user.points
  pointsDialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEdit.value) {
      const data = { points: form.points }
      if (form.password) {
        data.password = form.password
      }
      await userApi.update(editingId.value, data)
      ElMessage.success(t('admin.userUpdated'))
    } else {
      await userApi.create({
        username: form.username,
        password: form.password,
        points: form.points
      })
      ElMessage.success(t('admin.userCreated'))
    }
    dialogVisible.value = false
    fetchUsers()
  } finally {
    submitting.value = false
  }
}

const handleUpdatePoints = async () => {
  if (!selectedUser.value) return

  updatingPoints.value = true
  try {
    await userApi.update(selectedUser.value._id, { points: newPoints.value })
    ElMessage.success(t('admin.pointsUpdated'))
    pointsDialogVisible.value = false
    fetchUsers()
  } finally {
    updatingPoints.value = false
  }
}

const handleDelete = async (user) => {
  try {
    await ElMessageBox.confirm(
      t('admin.confirmDeleteUser', { name: user.username }),
      t('common.deleteConfirm'),
      { confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel'), type: 'warning' }
    )
    await userApi.delete(user._id)
    ElMessage.success(t('admin.userDeleted'))
    fetchUsers()
  } catch (error) {
    // cancelled
  }
}

onMounted(fetchUsers)
</script>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}
</style>
