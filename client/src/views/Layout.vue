<template>
  <el-container class="layout-container">
    <el-header class="header">
      <div class="logo">{{ $t('nav.logo') }}</div>
      <el-menu
        mode="horizontal"
        :default-active="activeMenu"
        :ellipsis="false"
        router
        class="nav-menu"
      >
        <el-menu-item index="/products">
          <el-icon><Goods /></el-icon>
          <span>{{ $t('nav.products') }}</span>
        </el-menu-item>
        <el-menu-item index="/cart">
          <el-badge :value="cartStore.itemCount" :hidden="cartStore.itemCount === 0">
            <el-icon><ShoppingCart /></el-icon>
          </el-badge>
          <span style="margin-left: 4px">{{ $t('nav.cart') }}</span>
        </el-menu-item>
        <el-menu-item index="/profile">
          <el-icon><User /></el-icon>
          <span>{{ $t('nav.profile') }}</span>
        </el-menu-item>
        <el-menu-item v-if="userStore.isAdmin" index="/admin">
          <el-icon><Setting /></el-icon>
          <span>{{ $t('nav.admin') }}</span>
        </el-menu-item>
      </el-menu>
      <div class="user-info">
        <el-button text size="small" @click="toggleLang" class="lang-btn">
          {{ locale === 'zh-CN' ? 'EN' : '中文' }}
        </el-button>
        <el-tag type="warning" effect="plain">
          {{ $t('nav.points', { n: userStore.points }) }}
        </el-tag>
        <el-dropdown @command="handleCommand">
          <span class="user-name">
            {{ userStore.user?.username }}
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">{{ $t('nav.logout') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-main class="main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Goods, ShoppingCart, User, Setting, ArrowDown } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { setLocale } from '../i18n'
import { useUserStore } from '../stores/user'
import { useCartStore } from '../stores/cart'

const route = useRoute()
const userStore = useUserStore()
const cartStore = useCartStore()
const { locale } = useI18n()

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/admin')) return '/admin'
  return path
})

const toggleLang = () => {
  setLocale(locale.value === 'zh-CN' ? 'en' : 'zh-CN')
}

onMounted(() => {
  userStore.fetchUser()
  cartStore.fetchCart()
})

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout()
  }
}
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0 20px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  margin-right: 40px;
}

.nav-menu {
  flex: 1;
  border: none;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.lang-btn {
  font-size: 13px;
}

.user-name {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.main {
  background: #f5f7fa;
  padding: 20px;
}
</style>
