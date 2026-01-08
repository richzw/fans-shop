import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cartApi } from '../api'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const loading = ref(false)

  const totalPoints = computed(() => {
    return items.value.reduce((sum, item) => sum + item.points * item.quantity, 0)
  })

  const itemCount = computed(() => {
    return items.value.reduce((sum, item) => sum + item.quantity, 0)
  })

  async function fetchCart() {
    loading.value = true
    try {
      const data = await cartApi.get()
      items.value = data.items
    } finally {
      loading.value = false
    }
  }

  async function addItem(productId, quantity = 1) {
    await cartApi.add({ productId, quantity })
    await fetchCart()
  }

  async function updateQuantity(productId, quantity) {
    await cartApi.update({ productId, quantity })
    await fetchCart()
  }

  async function removeItem(productId) {
    await cartApi.remove(productId)
    await fetchCart()
  }

  function clearCart() {
    items.value = []
  }

  return {
    items,
    loading,
    totalPoints,
    itemCount,
    fetchCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart
  }
})
