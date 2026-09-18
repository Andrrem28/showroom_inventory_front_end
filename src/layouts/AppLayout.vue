<template>
    <div class="layout-wrapper">

        <!-- Overlay escuro no mobile quando sidebar aberta -->
        <Transition name="fade">
            <div
                v-if="sidebarOpen && isMobile"
                class="sidebar-overlay"
                @click="sidebarOpen = false"
            />
        </Transition>

        <!-- Sidebar -->
        <AppSidebar
            :collapsed="collapsed"
            :open="sidebarOpen"
            :is-mobile="isMobile"
            @close="sidebarOpen = false"
        />

        <!-- Main -->
        <div class="layout-main">

            <AppHeader
                @toggle-sidebar="toggleSidebar"
            />

            <AppBreadcrumb />

            <main class="layout-content">
                <RouterView />
            </main>

            <AppFooter />

        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AppSidebar    from '@/components/Layout/AppSidebar.vue'
import AppHeader     from '@/components/Layout/AppHeader.vue'
import AppBreadcrumb from '@/components/Layout/AppBreadcrumb.vue'
import AppFooter     from '@/components/Layout/AppFooter.vue'

const collapsed   = ref(false)
const sidebarOpen = ref(false)
const isMobile    = ref(false)

const checkMobile = () => {
    isMobile.value = window.innerWidth <= 768
    if (!isMobile.value) sidebarOpen.value = false
}

const toggleSidebar = () => {
    if (isMobile.value) {
        sidebarOpen.value = !sidebarOpen.value
    } else {
        collapsed.value = !collapsed.value
    }
}

onMounted(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.layout-wrapper {
    display: flex;
    min-height: 100vh;
    position: relative;
}

.layout-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.layout-content {
    flex: 1;
    padding: 1.5rem;
    background: var(--p-surface-ground);
}

/* Overlay mobile */
.sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 100;
}

.fade-enter-active,
.fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from,
.fade-leave-to     { opacity: 0; }

@media (max-width: 768px) {
    .layout-content {
        padding: 1rem;
    }
}
</style>