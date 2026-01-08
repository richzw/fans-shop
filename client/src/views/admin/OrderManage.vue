<template>
  <div class="order-manage">
    <el-table :data="orders" v-loading="loading" stripe empty-text="暂无订单">
      <el-table-column label="订单号" width="220">
        <template #default="{ row }">
          <span class="order-id">{{ row._id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="用户" width="120">
        <template #default="{ row }">
          {{ row.userId?.username || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="下单时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="商品" min-width="200">
        <template #default="{ row }">
          <div class="order-items">
            <span v-for="(item, index) in row.items" :key="index" class="order-item">
              {{ item.name }} x {{ item.quantity }}
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="收件信息" min-width="200">
        <template #default="{ row }">
          <div class="shipping-info">
            <div>{{ row.recipient }} {{ row.phone }}</div>
            <div class="address">{{ row.address }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="总积分" width="100" align="center">
        <template #default="{ row }">
          <span class="total-points">{{ row.totalPoints }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="150" align="center">
        <template #default="{ row }">
          <el-select
            v-model="row.status"
            size="small"
            @change="handleStatusChange(row)"
          >
            <el-option value="pending" label="待发货" />
            <el-option value="shipped" label="已发货" />
            <el-option value="completed" label="已完成" />
          </el-select>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { orderApi } from '../../api'

const orders = ref([])
const loading = ref(false)

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('zh-CN')
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
    ElMessage.success('订单状态已更新')
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
