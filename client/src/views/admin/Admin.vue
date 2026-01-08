<template>
  <div class="admin-container">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="商品管理" name="products">
        <router-view v-if="activeTab === 'products'" />
      </el-tab-pane>
      <el-tab-pane label="用户管理" name="users">
        <router-view v-if="activeTab === 'users'" />
      </el-tab-pane>
      <el-tab-pane label="订单管理" name="orders">
        <router-view v-if="activeTab === 'orders'" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeTab = ref('products')

watch(() => route.path, (path) => {
  if (path.includes('/admin/users')) {
    activeTab.value = 'users'
  } else if (path.includes('/admin/orders')) {
    activeTab.value = 'orders'
  } else {
    activeTab.value = 'products'
  }
}, { immediate: true })

watch(activeTab, (tab) => {
  router.push(`/admin/${tab}`)
})
</script>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
