<template>
    <aside class="app-sidebar" :class="{ collapsed }">

        <!-- Logo -->
        <div class="sidebar-brand">
            <span class="brand-icon">💈</span>
            <Transition name="fade">
                <span v-if="!collapsed" class="brand-name">Salão Estoque</span>
            </Transition>
        </div>

        <!-- Menu -->
        <nav class="sidebar-nav">
            <template v-for="item in menuItems" :key="item.label">

                <!-- Item com filhos -->
                <div v-if="item.children" class="menu-group">
                    <div class="menu-group-label" v-if="!collapsed">
                        {{ item.label }}
                    </div>
                    <RouterLink
                        v-for="child in item.children"
                        :key="child.to"
                        :to="child.to"
                        class="menu-item"
                        :class="{ active: isActive(child.to) }"
                        v-tooltip.right="collapsed ? child.label : ''"
                    >
                        <i :class="child.icon" class="menu-icon" />
                        <Transition name="fade">
                            <span v-if="!collapsed" class="menu-label">{{ child.label }}</span>
                        </Transition>
                    </RouterLink>
                </div>

                <!-- Item simples -->
                <RouterLink
                    v-else
                    :to="item.to"
                    class="menu-item"
                    :class="{ active: isActive(item.to) }"
                    v-tooltip.right="collapsed ? item.label : ''"
                >
                    <i :class="item.icon" class="menu-icon" />
                    <Transition name="fade">
                        <span v-if="!collapsed" class="menu-label">{{ item.label }}</span>
                    </Transition>
                </RouterLink>

            </template>
        </nav>

    </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePermission } from '@/composables/usePermission'

defineProps({ collapsed: Boolean })

const route = useRoute()
const { can } = usePermission()

const isActive = (path) => route.path.startsWith(path)

const menuItems = computed(() => {
    const items = []

    // Dashboard
    items.push({
        label: 'Dashboard',
        icon:  'pi pi-home',
        to:    '/dashboard',
    })

    // Estoque
    const estoqueChildren = []
    if (can('products.manage'))
        estoqueChildren.push({ label: 'Produtos',       icon: 'pi pi-box',         to: '/products' })
    if (can('stock.manage'))
        estoqueChildren.push({ label: 'Movimentações',  icon: 'pi pi-arrows-v',    to: '/stock-movements' })
    if (can('categories.manage'))
        estoqueChildren.push({ label: 'Categorias',     icon: 'pi pi-tags',        to: '/categories' })
    if (can('categories.manage'))
        estoqueChildren.push({ label: 'Marcas',         icon: 'pi pi-star',        to: '/brands' })
    if (can('suppliers.manage'))
        estoqueChildren.push({ label: 'Fornecedores',   icon: 'pi pi-truck',       to: '/suppliers' })
    if (can('storage-locations.manage'))
        estoqueChildren.push({ label: 'Locais',         icon: 'pi pi-map-marker',  to: '/storage-locations' })
    if (estoqueChildren.length)
        items.push({ label: 'Estoque', children: estoqueChildren })

    // Comercial
    const comercialChildren = []
    if (can('sales.manage'))
        comercialChildren.push({ label: 'Vendas',   icon: 'pi pi-shopping-cart', to: '/sales' })
    if (can('clients.manage'))
        comercialChildren.push({ label: 'Clientes', icon: 'pi pi-users',         to: '/clients' })
    if (comercialChildren.length)
        items.push({ label: 'Comercial', children: comercialChildren })

    // Administração
    const adminChildren = []
    if (can('users.manage')) {
        adminChildren.push({ label: 'Usuários',   icon: 'pi pi-user',   to: '/users' })
        adminChildren.push({ label: 'Papéis',     icon: 'pi pi-shield', to: '/roles' })
        adminChildren.push({ label: 'Permissões', icon: 'pi pi-lock',   to: '/permissions' })
    }
    if (adminChildren.length)
        items.push({ label: 'Administração', children: adminChildren })

    return items
})
</script>

<style scoped>
.app-sidebar {
    width: 240px;
    min-height: 100vh;
    background: var(--p-surface-card);
    border-right: 1px solid var(--p-surface-border);
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease;
    overflow: hidden;
    flex-shrink: 0;
}

.app-sidebar.collapsed {
    width: 64px;
}

/* Brand */
.sidebar-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.25rem 1rem;
    border-bottom: 1px solid var(--p-surface-border);
    min-height: 64px;
}

.brand-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
}

.brand-name {
    font-size: 1rem;
    font-weight: 700;
    white-space: nowrap;
    color: var(--p-text-color);
}

/* Nav */
.sidebar-nav {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0.75rem 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

/* Group */
.menu-group {
    margin-bottom: 0.5rem;
}

.menu-group-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--p-text-muted-color);
    padding: 0.5rem 0.75rem 0.25rem;
}

/* Item */
.menu-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.75rem;
    border-radius: 8px;
    text-decoration: none;
    color: var(--p-text-color);
    font-size: 0.875rem;
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;
    cursor: pointer;
}

.menu-item:hover {
    background: var(--p-surface-hover);
}

.menu-item.active {
    background: var(--p-primary-50);
    color: var(--p-primary-600);
    font-weight: 600;
}

.menu-icon {
    font-size: 1rem;
    flex-shrink: 0;
    width: 20px;
    text-align: center;
}

.menu-label {
    white-space: nowrap;
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>