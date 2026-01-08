<template>
  <div class="cart-container">
    <el-card>
      <template #header>
        <div class="cart-header">
          <span>我的购物车</span>
          <el-tag type="info">共 {{ cartStore.itemCount }} 件商品</el-tag>
        </div>
      </template>

      <el-table :data="cartStore.items" v-loading="cartStore.loading" empty-text="购物车为空">
        <el-table-column label="商品" min-width="300">
          <template #default="{ row }">
            <div class="product-cell">
              <img :src="row.image" class="product-thumb" :alt="row.name" />
              <span class="product-name">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="积分" prop="points" width="120" align="center">
          <template #default="{ row }">
            <span class="points">{{ row.points }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="180" align="center">
          <template #default="{ row }">
            <el-input-number
              v-model="row.quantity"
              :min="1"
              :max="99"
              size="small"
              @change="updateQuantity(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="小计" width="120" align="center">
          <template #default="{ row }">
            <span class="subtotal">{{ row.points * row.quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              circle
              @click="removeItem(row)"
            />
          </template>
        </el-table-column>
      </el-table>

      <div class="cart-footer" v-if="cartStore.items.length > 0">
        <div class="total-info">
          <span>当前积分: <strong>{{ userStore.points }}</strong></span>
          <span>商品总积分: <strong class="total-points">{{ cartStore.totalPoints }}</strong></span>
          <span v-if="cartStore.totalPoints > userStore.points" class="insufficient">
            积分不足，还差 {{ cartStore.totalPoints - userStore.points }} 积分
          </span>
        </div>
        <el-button
          type="primary"
          size="large"
          :disabled="!canCheckout"
          :loading="ordering"
          @click="handleCheckout"
        >
          立即下单
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { useCartStore } from '../stores/cart'
import { useUserStore } from '../stores/user'
import { orderApi } from '../api'

const cartStore = useCartStore()
const userStore = useUserStore()

const ordering = ref(false)

const canCheckout = computed(() => {
  return cartStore.items.length > 0 &&
         cartStore.totalPoints <= userStore.points
})

const updateQuantity = async (item) => {
  try {
    await cartStore.updateQuantity(item.productId, item.quantity)
  } catch (error) {
    // 错误已处理
  }
}

const removeItem = async (item) => {
  try {
    await ElMessageBox.confirm('确定从购物车中移除该商品?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await cartStore.removeItem(item.productId)
    ElMessage.success('已移除')
  } catch (error) {
    // 取消操作
  }
}

const handleCheckout = async () => {
  if (!userStore.user?.recipient || !userStore.user?.phone || !userStore.user?.address) {
    ElMessage.warning('请先在"我的"页面完善收件信息')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认下单？将消耗 ${cartStore.totalPoints} 积分`,
      '确认下单',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    ordering.value = true
    const result = await orderApi.create()
    userStore.updatePoints(result.remainingPoints)
    cartStore.clearCart()
    ElMessage.success('下单成功！管理员会尽快处理发货')
  } catch (error) {
    // 取消或错误
  } finally {
    ordering.value = false
  }
}
</script>

<style scoped>
.cart-container {
  max-width: 1000px;
  margin: 0 auto;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.product-name {
  font-weight: 500;
}

.points, .subtotal {
  color: #f56c6c;
  font-weight: bold;
}

.cart-footer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-info {
  display: flex;
  gap: 24px;
  font-size: 14px;
}

.total-points {
  color: #f56c6c;
  font-size: 20px;
}

.insufficient {
  color: #f56c6c;
}
</style>
