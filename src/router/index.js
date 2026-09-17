import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [

        // Pública
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/Auth/LoginView.vue'),
            meta: { guest: true },
        },

        // Protegidas
        {
            path: '/',
            component: () => import('@/layouts/AppLayout.vue'),
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    redirect: '/dashboard',
                },
                {
                    path: 'dashboard',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard/DashboardView.vue'),
                },
                {
                    path: 'users',
                    name: 'users',
                    component: () => import('@/views/Users/UsersView.vue'),
                    meta: { permission: 'users.manage' },
                },
                {
                    path: 'roles',
                    name: 'roles',
                    component: () => import('@/views/Roles/RolesView.vue'),
                    meta: { permission: 'users.manage' },
                },
                {
                    path: 'permissions',
                    name: 'permissions',
                    component: () => import('@/views/Permissions/PermissionsView.vue'),
                    meta: { permission: 'users.manage' },
                },
                {
                    path: 'categories',
                    name: 'categories',
                    component: () => import('@/views/Categories/CategoriesView.vue'),
                    meta: { permission: 'categories.manage' },
                },
                {
                    path: 'brands',
                    name: 'brands',
                    component: () => import('@/views/Brands/BrandsView.vue'),
                    meta: { permission: 'categories.manage' },
                },
                {
                    path: 'suppliers',
                    name: 'suppliers',
                    component: () => import('@/views/Suppliers/SuppliersView.vue'),
                    meta: { permission: 'suppliers.manage' },
                },
                {
                    path: 'storage-locations',
                    name: 'storage-locations',
                    component: () => import('@/views/StorageLocations/StorageLocationsView.vue'),
                    meta: { permission: 'storage-locations.manage' },
                },
                {
                    path: 'products',
                    name: 'products',
                    component: () => import('@/views/Products/ProductsView.vue'),
                    meta: { permission: 'products.manage' },
                },
                {
                    path: 'stock-movements',
                    name: 'stock-movements',
                    component: () => import('@/views/StockMovements/StockMovementsView.vue'),
                    meta: { permission: 'stock.manage' },
                },
                {
                    path: 'clients',
                    name: 'clients',
                    component: () => import('@/views/Clients/ClientsView.vue'),
                    meta: { permission: 'clients.manage' },
                },
                {
                    path: 'sales',
                    name: 'sales',
                    component: () => import('@/views/Sales/SalesView.vue'),
                    meta: { permission: 'sales.manage' },
                },
                {
                    path: 'sales/new',
                    name: 'sales.create',
                    component: () => import('@/views/Sales/SaleFormView.vue'),
                    meta: { permission: 'sales.manage' },
                },
            ],
        },

        // Erros
        // {
        //     path: '/forbidden',
        //     name: 'forbidden',
        //     component: () => import('@/views/Errors/ForbiddenView.vue'),
        // },
        // {
        //     path: '/:pathMatch(.*)*',
        //     name: 'not-found',
        //     component: () => import('@/views/Errors/NotFoundView.vue'),
        // },
    ],
})

// Guard global
router.beforeEach((to, from) => {
    const auth = useAuthStore()

    if (to.meta.guest && auth.isAuthenticated) {
        return { name: 'dashboard' }
    }

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
        return { name: 'login' }
    }

    if (to.meta.permission && !auth.hasPermission(to.meta.permission)) {
        return { name: 'forbidden' }
    }
})

export default router