<template>
  <div class="profile-container">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>基本信息</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="用户名">
              {{ userStore.user?.username }}
            </el-descriptions-item>
            <el-descriptions-item label="当前积分">
              <el-tag type="warning" size="large">{{ userStore.points }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="用户角色">
              <el-tag :type="userStore.isAdmin ? 'danger' : 'primary'">
                {{ userStore.isAdmin ? '管理员' : '普通用户' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card v-if="userStore.isAdmin" style="margin-top: 20px">
          <template #header>
            <span>通知邮箱设置</span>
          </template>
          <el-form label-width="100px">
            <el-form-item label="通知邮箱">
              <el-input
                v-model="emailForm.email"
                placeholder="请输入接收订单通知的邮箱"
                type="email"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleUpdateEmail" :loading="emailLoading">
                保存邮箱
              </el-button>
            </el-form-item>
          </el-form>
          <div class="email-tip">
            设置后，新订单将发送通知到此邮箱
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>修改密码</span>
          </template>
          <el-form
            ref="pwdFormRef"
            :model="pwdForm"
            :rules="pwdRules"
            label-width="100px"
          >
            <el-form-item label="旧密码" prop="oldPassword">
              <el-input
                v-model="pwdForm.oldPassword"
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="pwdForm.newPassword"
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="pwdForm.confirmPassword"
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleChangePassword" :loading="pwdLoading">
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>收件信息</span>
      </template>
      <el-form
        ref="addressFormRef"
        :model="addressForm"
        :rules="addressRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="收件人" prop="recipient">
              <el-input v-model="addressForm.recipient" placeholder="请输入收件人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="addressForm.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="收件地址" prop="address">
          <el-input
            v-model="addressForm.address"
            type="textarea"
            :rows="3"
            placeholder="请输入详细收件地址"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleUpdateAddress" :loading="addressLoading">
            保存收件信息
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="!userStore.isAdmin" style="margin-top: 20px">
      <template #header>
        <span>历史订单</span>
      </template>
      <el-table :data="orders" v-loading="ordersLoading" empty-text="暂无订单">
        <el-table-column label="订单号" width="220">
          <template #default="{ row }">
            <span class="order-id">{{ row._id }}</span>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="商品" min-width="250">
          <template #default="{ row }">
            <div class="order-items">
              <span v-for="(item, index) in row.items" :key="index" class="order-item">
                {{ item.name }} x {{ item.quantity }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="总积分" width="100" align="center">
          <template #default="{ row }">
            <span class="total-points">{{ row.totalPoints }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'
import { orderApi } from '../api'

const userStore = useUserStore()

const pwdFormRef = ref(null)
const addressFormRef = ref(null)
const pwdLoading = ref(false)
const addressLoading = ref(false)
const emailLoading = ref(false)
const orders = ref([])
const ordersLoading = ref(false)

const emailForm = reactive({
  email: ''
})

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const statusType = (status) => {
  const types = { pending: 'warning', shipped: 'primary', completed: 'success' }
  return types[status] || 'info'
}

const statusText = (status) => {
  const texts = { pending: '待发货', shipped: '已发货', completed: '已完成' }
  return texts[status] || status
}

const fetchOrders = async () => {
  if (userStore.isAdmin) return
  ordersLoading.value = true
  try {
    orders.value = await orderApi.getAll()
  } finally {
    ordersLoading.value = false
  }
}

const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const addressForm = reactive({
  recipient: '',
  phone: '',
  address: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const pwdRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const addressRules = {
  recipient: [{ required: true, message: '请输入收件人', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  address: [{ required: true, message: '请输入收件地址', trigger: 'blur' }]
}

const handleChangePassword = async () => {
  const valid = await pwdFormRef.value.validate().catch(() => false)
  if (!valid) return

  pwdLoading.value = true
  try {
    await userStore.changePassword(pwdForm.oldPassword, pwdForm.newPassword)
    ElMessage.success('密码修改成功')
    pwdFormRef.value.resetFields()
  } finally {
    pwdLoading.value = false
  }
}

const handleUpdateAddress = async () => {
  const valid = await addressFormRef.value.validate().catch(() => false)
  if (!valid) return

  addressLoading.value = true
  try {
    await userStore.updateProfile(addressForm)
    ElMessage.success('收件信息已保存')
  } finally {
    addressLoading.value = false
  }
}

const handleUpdateEmail = async () => {
  if (!emailForm.email) {
    ElMessage.warning('请输入邮箱地址')
    return
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(emailForm.email)) {
    ElMessage.warning('请输入正确的邮箱格式')
    return
  }

  emailLoading.value = true
  try {
    await userStore.updateProfile({ email: emailForm.email })
    ElMessage.success('通知邮箱已保存')
  } finally {
    emailLoading.value = false
  }
}

onMounted(async () => {
  await userStore.fetchUser()
  addressForm.recipient = userStore.user?.recipient || ''
  addressForm.phone = userStore.user?.phone || ''
  addressForm.address = userStore.user?.address || ''
  emailForm.email = userStore.user?.email || ''
  fetchOrders()
})
</script>

<style scoped>
.profile-container {
  max-width: 1000px;
  margin: 0 auto;
}

.order-id {
  font-family: monospace;
  font-size: 12px;
  color: #909399;
}

.order-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.order-item {
  background: #f4f4f5;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.total-points {
  color: #f56c6c;
  font-weight: bold;
}

.shipping-info {
  font-size: 13px;
  line-height: 1.5;
}

.shipping-info .address {
  color: #909399;
  font-size: 12px;
}

.email-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}
</style>
