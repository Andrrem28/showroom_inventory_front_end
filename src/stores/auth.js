import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/axios'

export const useAuthStore = defineStore('auth', () => {

    // ─────────────────────────────────────
    // State
    // ─────────────────────────────────────
    const token = ref(localStorage.getItem('token') || null)
    const user  = ref(JSON.parse(localStorage.getItem('user') || 'null'))

    // ─────────────────────────────────────
    // Getters
    // ─────────────────────────────────────
    const isAuthenticated = computed(() => !!token.value)
    const userName        = computed(() => user.value?.name || '')
    const userEmail       = computed(() => user.value?.email || '')
    const userRoles       = computed(() => user.value?.roles || [])
    const userPermissions = computed(() => user.value?.permissions || [])

    const hasPermission = (permission) => {
        return userPermissions.value.includes(permission)
    }

    const hasRole = (role) => {
        return userRoles.value.includes(role)
    }

    // ─────────────────────────────────────
    // Actions
    // ─────────────────────────────────────
    const login = async (email, password) => {
        const response = await api.post('/login', { email, password })

        token.value = response.data.token
        user.value  = response.data.user

        localStorage.setItem('token', token.value)
        localStorage.setItem('user', JSON.stringify(user.value))
    }

    const logout = async () => {
        try {
            await api.post('/logout')
        } finally {
            token.value = null
            user.value  = null
            localStorage.removeItem('token')
            localStorage.removeItem('user')
        }
    }

    const fetchMe = async () => {
        const response = await api.get('/me')
        user.value = response.data
        localStorage.setItem('user', JSON.stringify(user.value))
    }

    return {
        token,
        user,
        isAuthenticated,
        userName,
        userEmail,
        userRoles,
        userPermissions,
        hasPermission,
        hasRole,
        login,
        logout,
        fetchMe,
    }
})