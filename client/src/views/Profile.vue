<template>
  <div class="profile-container">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>{{ t('profile.basicInfo') }}</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item :label="t('profile.username')">
              {{ userStore.user?.username }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('profile.currentPoints')">
              <el-tag type="warning" size="large">{{ userStore.points }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="t('profile.userRole')">
              <el-tag :type="userStore.isAdmin ? 'danger' : 'primary'">
                {{ userStore.isAdmin ? t('profile.roleAdmin') : t('profile.roleUser') }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card v-if="userStore.isAdmin" style="margin-top: 20px">
          <template #header>
            <span>{{ t('profile.emailSettings') }}</span>
          </template>
          <el-form label-width="100px">
            <el-form-item :label="t('profile.notificationEmail')">
              <el-input
                v-model="emailForm.email"
                :placeholder="t('profile.emailPlaceholder')"
                type="email"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleUpdateEmail" :loading="emailLoading">
                {{ t('profile.saveEmail') }}
              </el-button>
            </el-form-item>
          </el-form>
          <div class="email-tip">
            {{ t('profile.emailTip') }}
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>{{ t('profile.changePassword') }}</span>
          </template>
          <el-form
            ref="pwdFormRef"
            :model="pwdForm"
            :rules="pwdRules"
            label-width="100px"
          >
            <el-form-item :label="t('profile.oldPassword')" prop="oldPassword">
              <el-input
                v-model="pwdForm.oldPassword"
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item :label="t('profile.newPassword')" prop="newPassword">
              <el-input
                v-model="pwdForm.newPassword"
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item :label="t('profile.confirmPassword')" prop="confirmPassword">
              <el-input
                v-model="pwdForm.confirmPassword"
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleChangePassword" :loading="pwdLoading">
                {{ t('profile.changePasswordButton') }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>{{ t('profile.shippingInfo') }}</span>
      </template>
      <el-form
        ref="addressFormRef"
        :model="addressForm"
        :rules="addressRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="t('profile.recipient')" prop="recipient">
              <el-input v-model="addressForm.recipient" :placeholder="t('profile.recipientPlaceholder')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('profile.phone')" prop="phone">
              <el-input v-model="addressForm.phone" :placeholder="t('profile.phonePlaceholder')" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="t('profile.address')" prop="address">
          <el-input
            v-model="addressForm.address"
            type="textarea"
            :rows="3"
            :placeholder="t('profile.addressPlaceholder')"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleUpdateAddress" :loading="addressLoading">
            {{ t('profile.saveShippingInfo') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="!userStore.isAdmin" style="margin-top: 20px">
      <template #header>
        <span>{{ t('profile.orderHistory') }}</span>
      </template>
      <el-table :data="orders" v-loading="ordersLoading" :empty-text="t('profile.noOrders')">
        <el-table-column :label="t('profile.orderId')" width="220">
          <template #default="{ row }">
            <span class="order-id">{{ row._id }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('profile.orderTime')" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('profile.product')" min-width="250">
          <template #default="{ row }">
            <div class="order-items">
              <span v-for="(item, index) in row.items" :key="index" class="order-item">
                {{ item.name }} x {{ item.quantity }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('profile.totalPoints')" width="100" align="center">
          <template #default="{ row }">
            <span class="total-points">{{ row.totalPoints }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('profile.status')" width="100" align="center">
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/user'
import { orderApi } from '../api'

const userStore = useUserStore()
const { t, locale } = useI18n()

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
  return new Date(dateStr).toLocaleString(locale.value === 'en' ? 'en-US' : 'zh-CN')
}

const statusType = (status) => {
  const types = { pending: 'warning', shipped: 'primary', completed: 'success' }
  return types[status] || 'info'
}

const statusText = (status) => {
  return t(`status.${status}`)
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
    callback(new Error(t('profile.passwordMismatch')))
  } else {
    callback()
  }
}

const pwdRules = computed(() => ({
  oldPassword: [{ required: true, message: t('profile.oldPasswordRequired'), trigger: 'blur' }],
  newPassword: [
    { required: true, message: t('profile.newPasswordRequired'), trigger: 'blur' },
    { min: 6, message: t('profile.passwordMinLength'), trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: t('profile.confirmPasswordRequired'), trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}))

const addressRules = computed(() => ({
  recipient: [{ required: true, message: t('profile.recipientRequired'), trigger: 'blur' }],
  phone: [
    { required: true, message: t('profile.phoneRequired'), trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: t('profile.phoneInvalid'), trigger: 'blur' }
  ],
  address: [{ required: true, message: t('profile.addressRequired'), trigger: 'blur' }]
}))

const handleChangePassword = async () => {
  const valid = await pwdFormRef.value.validate().catch(() => false)
  if (!valid) return

  pwdLoading.value = true
  try {
    await userStore.changePassword(pwdForm.oldPassword, pwdForm.newPassword)
    ElMessage.success(t('profile.passwordChanged'))
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
    ElMessage.success(t('profile.shippingInfoSaved'))
  } finally {
    addressLoading.value = false
  }
}

const handleUpdateEmail = async () => {
  if (!emailForm.email) {
    ElMessage.warning(t('profile.emailRequired'))
    return
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(emailForm.email)) {
    ElMessage.warning(t('profile.emailInvalid'))
    return
  }

  emailLoading.value = true
  try {
    await userStore.updateProfile({ email: emailForm.email })
    ElMessage.success(t('profile.emailSaved'))
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
