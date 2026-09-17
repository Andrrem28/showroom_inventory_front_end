<template>
    <div class="layout-wrapper">

        <AppSidebar :collapsed="collapsed" />

        <div class="layout-main">
            <AppHeader @toggle-sidebar="collapsed = !collapsed" />
            <AppBreadcrumb />

            <main class="layout-content">
                <RouterView />
            </main>

            <!-- Rodapé -->
            <AppFooter />

        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import AppSidebar from '@/components/Layout/AppSidebar.vue'
import AppHeader from '@/components/Layout/AppHeader.vue'
import AppBreadcrumb from '@/components/Layout/AppBreadcrumb.vue'
import AppFooter from '@/components/Layout/AppFooter.vue'

const collapsed = ref(false)
</script>

<style scoped>
.layout-wrapper {
    display: flex;
    min-height: 100vh;
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
</style>