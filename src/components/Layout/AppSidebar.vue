<template>
    <aside
        class="app-sidebar"
        :class="{
            collapsed: collapsed && !isMobile,
            'mobile-open': isMobile && open,
        }"
    >
        <!-- Brand -->
        <div class="sidebar-brand">
            <span class="brand-icon">💈</span>
            <Transition name="fade">
                <span v-if="!collapsed || isMobile" class="brand-name">
                    Salão Estoque
                </span>
            </Transition>

            <!-- Fechar no mobile -->
            <Button
                v-if="isMobile"
                icon="pi pi-times"
                text
                rounded
                severity="secondary"
                class="close-btn"
                @click="closeSidebar"
            />
        </div>

        <!-- Menu -->
        <nav class="sidebar-nav">
            <template v-for="item in menuItems" :key="item.label">

                <!-- Grupo com filhos -->
                <div v-if="item.children" class="menu-group">
                    <div class="menu-group-label" v-if="!collapsed || isMobile">
                        {{ item.label }}
                    </div>
                    <RouterLink
                        v-for="child in item.children"
                        :key="child.to"
                        :to="child.to"
                        class="menu-item"
                        :class="{ active: isActive(child.to) }"
                        v-tooltip.right="(collapsed && !isMobile) ? child.label : ''"
                        @click="() => { if (isMobile) closeSidebar() }"
                    >
                        <i :class="child.icon" class="menu-icon" />
                        <Transition name="fade">
                            <span v-if="!collapsed || isMobile" class="menu-label">
                                {{ child.label }}
                            </span>
                        </Transition>
                    </RouterLink>
                </div>

                <!-- Item simples -->
                <RouterLink
                    v-else
                    :to="item.to"
                    class="menu-item"
                    :class="{ active: isActive(item.to) }"
                    v-tooltip.right="(collapsed && !isMobile) ? item.label : ''"
                    @click="() => { if (isMobile) closeSidebar() }"
                >
                    <i :class="item.icon" class="menu-icon" />
                    <Transition name="fade">
                        <span v-if="!collapsed || isMobile" class="menu-label">
                            {{ item.label }}
                        </span>
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
import Button from 'primevue/button'

const props = defineProps({
    collapsed: Boolean,
    open:      Boolean,
    isMobile:  Boolean,
})

const emit = defineEmits(['close'])

const closeSidebar = () => {
    emit('close')
}

const route = useRoute()
const { can } = usePermission()

const isActive = (path) => route.path.startsWith(path)

const menuItems = computed(() => {
    const items = []

    items.push({
        label: 'Dashboard',
        icon:  'pi pi-home',
        to:    '/dashboard',
    })

    const estoqueChildren = []
    if (can('products.manage'))
        estoqueChildren.push({ label: 'Produtos',      icon: 'pi pi-box',        to: '/products' })
    if (can('stock.manage'))
        estoqueChildren.push({ label: 'Movimentações', icon: 'pi pi-arrows-v',   to: '/stock-movements' })
    if (can('categories.manage'))
        estoqueChildren.push({ label: 'Categorias',    icon: 'pi pi-tags',       to: '/categories' })
    if (can('categories.manage'))
        estoqueChildren.push({ label: 'Marcas',        icon: 'pi pi-star',       to: '/brands' })
    if (can('suppliers.manage'))
        estoqueChildren.push({ label: 'Fornecedores',  icon: 'pi pi-truck',      to: '/suppliers' })
    if (can('storage-locations.manage'))
        estoqueChildren.push({ label: 'Locais',        icon: 'pi pi-map-marker', to: '/storage-locations' })
    if (estoqueChildren.length)
        items.push({ label: 'Estoque', children: estoqueChildren })

    const comercialChildren = []
    if (can('sales.manage'))
        comercialChildren.push({ label: 'Vendas',   icon: 'pi pi-shopping-cart', to: '/sales' })
    if (can('clients.manage'))
        comercialChildren.push({ label: 'Clientes', icon: 'pi pi-users',         to: '/clients' })
    if (comercialChildren.length)
        items.push({ label: 'Comercial', children: comercialChildren })

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

<style>
.app-sidebar {
    width: 240px;
    min-height: 100vh;
    background-color: #ffffff;
    border-right: 1px solid var(--p-surface-border);
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease;
    overflow: hidden;
    flex-shrink: 0;
    z-index: 100;
}

.dark-mode .app-sidebar {
    background-color: #1a1a1a;
}

.app-sidebar.collapsed {
    width: 64px;
}

/* Mobile */
@media (max-width: 768px) {
    .app-sidebar {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: 280px;

        transform: translateX(-100%);
        transition: transform 0.3s ease;

        box-shadow: 4px 0 24px rgba(0, 0, 0, 0.25);

        z-index: 1100;
    }

    .app-sidebar.mobile-open {
        transform: translateX(0);
    }
}

/* Brand */
.app-sidebar .sidebar-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.25rem 1rem;
    border-bottom: 1px solid var(--p-surface-border);
    min-height: 64px;
}

.app-sidebar .brand-icon { font-size: 1.5rem; flex-shrink: 0; }
.app-sidebar .brand-name { font-size: 1rem; font-weight: 700; white-space: nowrap; flex: 1; color: var(--p-text-color); }
.app-sidebar .close-btn  { margin-left: auto; }

/* Nav */
.app-sidebar .sidebar-nav {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0.75rem 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.app-sidebar .menu-group       { margin-bottom: 0.5rem; }
.app-sidebar .menu-group-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--p-text-muted-color);
    padding: 0.5rem 0.75rem 0.25rem;
}

.app-sidebar .menu-item {
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

.app-sidebar .menu-item:hover  { background: var(--p-surface-hover); }
.app-sidebar .menu-item.active { background: var(--p-primary-50); color: var(--p-primary-600); font-weight: 600; }

.app-sidebar .menu-icon  { font-size: 1rem; flex-shrink: 0; width: 20px; text-align: center; }
.app-sidebar .menu-label { white-space: nowrap; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from,   .fade-leave-to     { opacity: 0; }
</style>