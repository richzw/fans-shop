<template>
  <div class="order-manage">
    <el-table :data="orders" v-loading="loading" stripe :empty-text="t('admin.noOrders')">
      <el-table-column :label="t('admin.orderId')" width="220">
        <template #default="{ row }">
          <span class="order-id">{{ row._id }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('admin.user')" width="120">
        <template #default="{ row }">
          {{ row.userId?.username || '-' }}
        </template>
      </el-table-column>
      <el-table-column :label="t('admin.orderTime')" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column :label="t('admin.product')" min-width="200">
        <template #default="{ row }">
          <div class="order-items">
            <span v-for="(item, index) in row.items" :key="index" class="order-item">
              {{ item.name }} x {{ item.quantity }}
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="t('admin.shippingInfo')" min-width="200">
        <template #default="{ row }">
          <div class="shipping-info">
            <div>{{ row.recipient }} {{ row.phone }}</div>
            <div class="address">{{ row.address }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="t('admin.totalPoints')" width="100" align="center">
        <template #default="{ row }">
          <span class="total-points">{{ row.totalPoints }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('admin.orderStatus')" width="150" align="center">
        <template #default="{ row }">
          <el-select
            v-model="row.status"
            size="small"
            @change="handleStatusChange(row)"
          >
            <el-option value="pending" :label="t('status.pending')" />
            <el-option value="shipped" :label="t('status.shipped')" />
            <el-option value="completed" :label="t('status.completed')" />
          </el-select>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { orderApi } from '../../api'

const { t, locale } = useI18n()

const orders = ref([])
const loading = ref(false)

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString(locale.value === 'en' ? 'en-US' : 'zh-CN')
}

const fetchOrders = async () => {
  loading.value = true
  try {
    orders.value = await orderApi.getAllAdmin()
  } finally {
    loading.value = false
  }
}

const handleStatusChange = async (order) => {
  try {
    await orderApi.updateStatus(order._id, order.status)
    ElMessage.success(t('admin.orderStatusUpdated'))
  } catch (error) {
    fetchOrders()
  }
}

onMounted(fetchOrders)
</script>

<style scoped>
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
</style>
