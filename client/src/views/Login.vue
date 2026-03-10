<template>
  <div class="login-container">
    <div class="lang-switch-login">
      <el-button text size="small" @click="toggleLang">
        {{ locale === 'zh-CN' ? 'EN' : '中文' }}
      </el-button>
    </div>
    <el-card class="login-card">
      <template #header>
        <h2 class="login-title">{{ t('login.title') }}</h2>
      </template>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        @submit.prevent="handleLogin"
      >
        <el-form-item :label="t('login.username')" prop="username">
          <el-input
            v-model="form.username"
            :placeholder="t('login.usernamePlaceholder')"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item :label="t('login.password')" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            :placeholder="t('login.passwordPlaceholder')"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            :loading="loading"
            class="login-btn"
          >
            {{ t('login.loginButton') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { setLocale } from '../i18n'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const { t, locale } = useI18n()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = computed(() => ({
  username: [{ required: true, message: t('login.usernameRequired'), trigger: 'blur' }],
  password: [{ required: true, message: t('login.passwordRequired'), trigger: 'blur' }]
}))

const toggleLang = () => {
  setLocale(locale.value === 'zh-CN' ? 'en' : 'zh-CN')
}

const handleLogin = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await userStore.login(form.username, form.password)
    ElMessage.success(t('login.loginSuccess'))
    router.push('/')
  } catch (error) {
    // error handled by interceptor
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

.lang-switch-login {
  position: absolute;
  top: 16px;
  right: 24px;
}

.lang-switch-login .el-button {
  color: #fff;
  font-size: 14px;
}

.login-card {
  width: 400px;
}

.login-title {
  text-align: center;
  margin: 0;
  color: #303133;
}

.login-btn {
  width: 100%;
}
</style>
