<template>
    <div class="app-breadcrumb" v-if="breadcrumbItems.length > 1">
        <Breadcrumb :home="home" :model="breadcrumbItems.slice(1)" />
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Breadcrumb from 'primevue/breadcrumb'

const route = useRoute()

const home = {
    icon:  'pi pi-home',
    route: '/dashboard',
}

const labelMap = {
    dashboard:          'Dashboard',
    users:              'Usuários',
    roles:              'Papéis',
    permissions:        'Permissões',
    categories:         'Categorias',
    brands:             'Marcas',
    suppliers:          'Fornecedores',
    'storage-locations': 'Locais de Armazenamento',
    products:           'Produtos',
    'stock-movements':  'Movimentações de Estoque',
    clients:            'Clientes',
    sales:              'Vendas',
    new:                'Nova Venda',
}

const breadcrumbItems = computed(() => {
    return route.path
        .split('/')
        .filter(Boolean)
        .map((segment) => ({
            label: labelMap[segment] || segment,
            route: '/' + segment,
        }))
})
</script>

<style scoped>
.app-breadcrumb {
    padding: 0.6rem 1.5rem;
    background: var(--p-surface-card);
    border-bottom: 1px solid var(--p-surface-border);
}
</style>