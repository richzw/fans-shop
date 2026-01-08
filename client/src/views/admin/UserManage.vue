<template>
  <div class="user-manage">
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="showAddDialog">
        添加用户
      </el-button>
    </div>

    <el-table :data="users" v-loading="loading" stripe>
      <el-table-column prop="username" label="用户名" width="150" />
      <el-table-column prop="points" label="积分" width="120" align="center">
        <template #default="{ row }">
          <el-tag type="warning">{{ row.points }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="收件人" prop="recipient" min-width="120" />
      <el-table-column label="手机号" prop="phone" width="130" />
      <el-table-column label="收件地址" prop="address" min-width="200" show-overflow-tooltip />
      <el-table-column label="首次登录" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.isFirstLogin ? 'warning' : 'success'" size="small">
            {{ row.isFirstLogin ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" align="center">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="showEditDialog(row)">
            编辑
          </el-button>
          <el-button type="warning" size="small" @click="showPointsDialog(row)">
            设置积分
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '添加用户'"
      width="400"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" :prop="isEdit ? '' : 'password'">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            :placeholder="isEdit ? '留空则不修改密码' : '请输入初始密码'"
          />
        </el-form-item>
        <el-form-item label="初始积分" prop="points">
          <el-input-number v-model="form.points" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 设置积分对话框 -->
    <el-dialog v-model="pointsDialogVisible" title="设置积分" width="400">
      <el-form label-width="100px">
        <el-form-item label="用户名">
          <el-input :model-value="selectedUser?.username" disabled />
        </el-form-item>
        <el-form-item label="当前积分">
          <el-tag type="info">{{ selectedUser?.points }}</el-tag>
        </el-form-item>
        <el-form-item label="新积分">
          <el-input-number v-model="newPoints" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pointsDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdatePoints" :loading="updatingPoints">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { userApi } from '../../api'

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

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

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
      ElMessage.success('用户已更新')
    } else {
      await userApi.create({
        username: form.username,
        password: form.password,
        points: form.points
      })
      ElMessage.success('用户已创建')
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
    ElMessage.success('积分已更新')
    pointsDialogVisible.value = false
    fetchUsers()
  } finally {
    updatingPoints.value = false
  }
}

const handleDelete = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定删除用户 "${user.username}" 吗？`,
      '删除确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    await userApi.delete(user._id)
    ElMessage.success('用户已删除')
    fetchUsers()
  } catch (error) {
    // 取消删除
  }
}

onMounted(fetchUsers)
</script>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}
</style>
