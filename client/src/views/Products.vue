<template>
  <div class="products-container">
    <el-row :gutter="20">
      <el-col
        v-for="product in products"
        :key="product._id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
      >
        <el-card class="product-card" :body-style="{ padding: '0' }">
          <img :src="product.image" class="product-image" :alt="product.name" />
          <div class="product-info">
            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-desc">{{ product.description || '暂无描述' }}</p>
            <div class="product-meta">
              <span class="product-points">{{ product.points }} 积分</span>
              <span class="product-stock" :class="{ 'out-of-stock': product.stock === 0 }">
                库存: {{ product.stock }}
              </span>
            </div>
            <div class="product-footer">
              <el-button
                type="primary"
                size="small"
                :icon="ShoppingCart"
                @click="addToCart(product)"
                :loading="addingId === product._id"
                :disabled="product.stock === 0"
              >
                {{ product.stock === 0 ? '暂无库存' : '加入购物车' }}
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-empty v-if="!loading && products.length === 0" description="暂无商品" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ShoppingCart } from '@element-plus/icons-vue'
import { productApi } from '../api'
import { useCartStore } from '../stores/cart'

const cartStore = useCartStore()

const products = ref([])
const loading = ref(true)
const addingId = ref(null)

const fetchProducts = async () => {
  loading.value = true
  try {
    products.value = await productApi.getAll()
  } finally {
    loading.value = false
  }
}

const addToCart = async (product) => {
  addingId.value = product._id
  try {
    await cartStore.addItem(product._id)
    ElMessage.success('已添加到购物车')
  } finally {
    addingId.value = null
  }
}

onMounted(fetchProducts)
</script>

<style scoped>
.products-container {
  max-width: 1400px;
  margin: 0 auto;
}

.product-card {
  margin-bottom: 20px;
  transition: transform 0.3s;
}

.product-card:hover {
  transform: translateY(-5px);
}

.product-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.product-info {
  padding: 16px;
}

.product-name {
  margin: 0 0 8px;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-desc {
  color: #909399;
  font-size: 14px;
  margin: 0 0 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.product-footer {
  display: flex;
  justify-content: flex-end;
}

.product-points {
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
}

.product-stock {
  font-size: 13px;
  color: #67c23a;
}

.product-stock.out-of-stock {
  color: #909399;
}
</style>
