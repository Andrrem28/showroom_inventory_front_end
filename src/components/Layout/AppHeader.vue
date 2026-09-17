<template>
    <header class="app-header">

        <Button
            icon="pi pi-bars"
            text rounded severity="secondary"
            @click="$emit('toggle-sidebar')"
        />

        <div class="header-spacer" />

        <div class="header-actions">

            <!-- Toggle tema -->
            <Button
                :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
                text rounded severity="secondary"
                @click="toggleTheme"
                v-tooltip.bottom="isDark ? 'Tema claro' : 'Tema escuro'"
            />

            <!-- Notificações -->
            <Button
                icon="pi pi-bell"
                text rounded severity="secondary"
                v-tooltip.bottom="'Notificações'"
            />

            <Divider layout="vertical" />

            <!-- Usuário -->
            <Button
                text severity="secondary"
                class="user-button"
                @click="toggleUserMenu"
            >
                <Avatar :label="userInitials" shape="circle" class="user-avatar" />
                <span class="user-name">{{ userName }}</span>
                <i class="pi pi-angle-down" />
            </Button>

            <Menu ref="userMenu" :model="userMenuItems" :popup="true" />

        </div>
    </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import Menu from 'primevue/menu'
import Divider from 'primevue/divider'

defineEmits(['toggle-sidebar'])

const router   = useRouter()
const auth     = useAuthStore()
const toast    = useToast()
const userMenu = ref()
const isDark   = ref(localStorage.getItem('theme') === 'dark')

const userName     = auth.userName
const userInitials = computed(() =>
    userName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
)

// Aplica o tema ao carregar
if (isDark.value) {
    document.documentElement.classList.add('dark-mode')
}

const toggleTheme = () => {
    isDark.value = !isDark.value
    if (isDark.value) {
        document.documentElement.classList.add('dark-mode')
        localStorage.setItem('theme', 'dark')
    } else {
        document.documentElement.classList.remove('dark-mode')
        localStorage.setItem('theme', 'light')
    }
}

const toggleUserMenu = (event) => userMenu.value.toggle(event)

const userMenuItems = [
    {
        label: userName,
        items: [
            {
                label:   'Meu perfil',
                icon:    'pi pi-user',
                command: () => router.push('/profile'),
            },
            { separator: true },
            {
                label:   'Sair',
                icon:    'pi pi-sign-out',
                command: async () => {
                    try {
                        await auth.logout()
                        router.push('/login')
                    } catch {
                        toast.add({
                            severity: 'error',
                            summary:  'Erro',
                            detail:   'Não foi possível sair.',
                            life:     3000,
                        })
                    }
                },
            },
        ],
    },
]
</script>

<style scoped>
.app-header {
    display: flex;
    align-items: center;
    padding: 0 1rem;
    height: 64px;
    background: var(--p-surface-card);
    border-bottom: 1px solid var(--p-surface-border);
    gap: 0.5rem;
    position: sticky;
    top: 0;
    z-index: 100;
}

.header-spacer { flex: 1; }

.header-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.user-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.75rem;
}

.user-avatar {
    width: 32px;
    height: 32px;
    font-size: 0.75rem;
    background: var(--p-primary-100);
    color: var(--p-primary-700);
    font-weight: 700;
}

.user-name {
    font-size: 0.875rem;
    font-weight: 500;
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>