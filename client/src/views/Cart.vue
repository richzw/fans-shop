<template>
  <div class="cart-container">
    <el-card>
      <template #header>
        <div class="cart-header">
          <span>{{ t('cart.myCart') }}</span>
          <el-tag type="info">{{ t('cart.itemCount', { n: cartStore.itemCount }) }}</el-tag>
        </div>
      </template>

      <el-table :data="cartStore.items" v-loading="cartStore.loading" :empty-text="t('cart.emptyCart')">
        <el-table-column :label="t('cart.product')" min-width="300">
          <template #default="{ row }">
            <div class="product-cell">
              <img :src="row.image" class="product-thumb" :alt="row.name" />
              <span class="product-name">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('cart.points')" prop="points" width="120" align="center">
          <template #default="{ row }">
            <span class="points">{{ row.points }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('cart.quantity')" width="180" align="center">
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
        <el-table-column :label="t('cart.subtotal')" width="120" align="center">
          <template #default="{ row }">
            <span class="subtotal">{{ row.points * row.quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('cart.action')" width="100" align="center">
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
          <span>{{ t('cart.currentPoints') }}<strong>{{ userStore.points }}</strong></span>
          <span>{{ t('cart.totalPoints') }}<strong class="total-points">{{ cartStore.totalPoints }}</strong></span>
          <span v-if="cartStore.totalPoints > userStore.points" class="insufficient">
            {{ t('cart.insufficientPoints', { n: cartStore.totalPoints - userStore.points }) }}
          </span>
        </div>
        <el-button
          type="primary"
          size="large"
          :disabled="!canCheckout"
          :loading="ordering"
          @click="handleCheckout"
        >
          {{ t('cart.placeOrder') }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '../stores/cart'
import { useUserStore } from '../stores/user'
import { orderApi } from '../api'

const cartStore = useCartStore()
const userStore = useUserStore()
const { t } = useI18n()

const ordering = ref(false)

const canCheckout = computed(() => {
  return cartStore.items.length > 0 &&
         cartStore.totalPoints <= userStore.points
})

const updateQuantity = async (item) => {
  try {
    await cartStore.updateQuantity(item.productId, item.quantity)
  } catch (error) {
    // error handled by interceptor
  }
}

const removeItem = async (item) => {
  try {
    await ElMessageBox.confirm(t('cart.confirmRemove'), t('common.hint'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    })
    await cartStore.removeItem(item.productId)
    ElMessage.success(t('cart.removed'))
  } catch (error) {
    // cancelled
  }
}

const handleCheckout = async () => {
  if (!userStore.user?.recipient || !userStore.user?.phone || !userStore.user?.address) {
    ElMessage.warning(t('cart.completeShippingInfo'))
    return
  }

  try {
    await ElMessageBox.confirm(
      t('cart.confirmOrder', { n: cartStore.totalPoints }),
      t('cart.confirmOrderTitle'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'info'
      }
    )

    ordering.value = true
    const result = await orderApi.create()
    userStore.updatePoints(result.remainingPoints)
    cartStore.clearCart()
    ElMessage.success(t('cart.orderSuccess'))
  } catch (error) {
    // cancelled or error
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
