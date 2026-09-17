import { useAuthStore } from '@/stores/auth'

export function usePermission() {
    const auth = useAuthStore()

    const can = (permission) => auth.hasPermission(permission)
    const is  = (role)       => auth.hasRole(role)

    return { can, is }
}