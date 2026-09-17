<template>
    <div class="dashboard">

        <!-- Cabeçalho -->
        <div class="page-header">
            <h2 class="page-title">Dashboard</h2>
            <p class="page-subtitle">Bem-vindo, {{ userName }}!</p>
        </div>

        <!-- Cards de indicadores -->
        <div class="dashboard-cards">

            <div class="indicator-card" v-for="card in cards" :key="card.label">
                <div class="indicator-icon" :style="{ background: card.color }">
                    <i :class="card.icon" />
                </div>
                <div class="indicator-info">
                    <span class="indicator-label">{{ card.label }}</span>
                    <span class="indicator-value">
                        <template v-if="loading">
                            <i class="pi pi-spin pi-spinner" />
                        </template>
                        <template v-else>{{ card.value }}</template>
                    </span>
                    <small class="indicator-sub" v-if="card.sub">{{ card.sub }}</small>
                </div>
            </div>

        </div>

        <!-- Gráficos -->
        <div class="charts-grid">

            <!-- Movimentações dos últimos 7 dias -->
            <div class="chart-card">
                <h3 class="chart-title">
                    <i class="pi pi-arrows-v" />
                    Movimentações — Últimos 7 dias
                </h3>
                <Chart
                    v-if="!loading"
                    type="bar"
                    :data="movementsChartData"
                    :options="movementsChartOptions"
                    style="height: 280px"
                />
                <div class="chart-loading" v-else>
                    <i class="pi pi-spin pi-spinner" />
                </div>
            </div>

            <!-- Formas de pagamento -->
            <div class="chart-card">
                <h3 class="chart-title">
                    <i class="pi pi-credit-card" />
                    Formas de Pagamento
                </h3>
                <div class="donut-wrapper">
                    <Chart
                        v-if="!loading && sales.length"
                        type="doughnut"
                        :data="paymentChartData"
                        :options="paymentChartOptions"
                        style="height: 280px"
                    />
                    <div class="chart-empty" v-else-if="!loading">
                        <i class="pi pi-shopping-cart" />
                        <p>Nenhuma venda registrada</p>
                    </div>
                    <div class="chart-loading" v-else>
                        <i class="pi pi-spin pi-spinner" />
                    </div>
                </div>
            </div>

        </div>

        <!-- Produtos com estoque crítico -->
        <div class="chart-card" v-if="lowStockProducts.length">
            <h3 class="chart-title alert">
                <i class="pi pi-exclamation-triangle" />
                Produtos com Estoque Crítico
            </h3>
            <DataTable
                :value="lowStockProducts"
                size="small"
                stripedRows
            >
                <Column field="code" header="Código" style="width: 12%" />
                <Column field="name" header="Produto" />
                <Column header="Categoria">
                    <template #body="{ data }">
                        {{ data.category?.name || '—' }}
                    </template>
                </Column>
                <Column header="Estoque Atual" style="width: 14%">
                    <template #body="{ data }">
                        <span class="stock-low">{{ data.current_stock }}</span>
                    </template>
                </Column>
                <Column field="minimum_stock" header="Mínimo" style="width: 10%" />
            </DataTable>
        </div>

    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/api/axios'
import Chart from 'primevue/chart'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const auth     = useAuthStore()
const userName = auth.userName
const loading  = ref(false)

// ─────────────────────────────────────
// State
// ─────────────────────────────────────
const products         = ref([])
const lowStockProducts = ref([])
const clients          = ref([])
const sales            = ref([])
const movements        = ref([])

// ─────────────────────────────────────
// Cards
// ─────────────────────────────────────
const cards = computed(() => [
    {
        label: 'Total de Produtos',
        value: products.value.length,
        icon:  'pi pi-box',
        color: '#3b82f6',
        sub:   `${products.value.filter(p => p.is_active).length} ativos`,
    },
    {
        label: 'Estoque Crítico',
        value: lowStockProducts.value.length,
        icon:  'pi pi-exclamation-triangle',
        color: '#f97316',
        sub:   lowStockProducts.value.length
            ? 'Reposição necessária'
            : 'Tudo em ordem',
    },
    {
        label: 'Vendas Hoje',
        value: vendasHoje.value,
        icon:  'pi pi-shopping-cart',
        color: '#22c55e',
        sub:   `R$ ${totalHoje.value}`,
    },
    {
        label: 'Total de Clientes',
        value: clients.value.length,
        icon:  'pi pi-users',
        color: '#a855f7',
        sub:   'Cadastrados no sistema',
    },
])

// ─────────────────────────────────────
// Vendas hoje
// ─────────────────────────────────────
const vendasHoje = computed(() => {
    const hoje = new Date().toLocaleDateString('pt-BR')
    return sales.value.filter(s => {
        const data = s.sold_at?.split(' ')[0]
        return data === hoje
    }).length
})

const totalHoje = computed(() => {
    const hoje = new Date().toLocaleDateString('pt-BR')
    const total = sales.value
        .filter(s => s.sold_at?.split(' ')[0] === hoje)
        .reduce((acc, s) => {
            const val = parseFloat(s.total_amount?.replace?.('.', '').replace?.(',', '.')) || 0
            return acc + val
        }, 0)
    return total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
})

// ─────────────────────────────────────
// Gráfico — Movimentações 7 dias
// ─────────────────────────────────────
const last7Days = computed(() => {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return d.toLocaleDateString('pt-BR')
    })
})

const movementsChartData = computed(() => {
    const entradas = last7Days.value.map(day =>
        movements.value
            .filter(m => {
                if (m.type !== 'entrada') return false
                // moved_at vem como "17/09/2026 00:19" — pega só a data
                const date = m.moved_at?.split(' ')[0]
                return date === day
            })
            .reduce((acc, m) => acc + m.quantity, 0)
    )

    const saidas = last7Days.value.map(day =>
        movements.value
            .filter(m => {
                if (m.type !== 'saida') return false
                const date = m.moved_at?.split(' ')[0]
                return date === day
            })
            .reduce((acc, m) => acc + m.quantity, 0)
    )

    return {
        labels: last7Days.value,
        datasets: [
            {
                label:           'Entradas',
                data:            entradas,
                backgroundColor: '#22c55e',
                borderRadius:    6,
            },
            {
                label:           'Saídas',
                data:            saidas,
                backgroundColor: '#ef4444',
                borderRadius:    6,
            },
        ],
    }
})

const movementsChartOptions = {
    responsive:          true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'top' },
    },
    scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
}

// ─────────────────────────────────────
// Gráfico — Formas de pagamento
// ─────────────────────────────────────
const paymentChartData = computed(() => {
    const labels = {
        dinheiro:       'Dinheiro',
        pix:            'PIX',
        cartao_credito: 'Crédito',
        cartao_debito:  'Débito',
        fiado:          'Fiado',
    }

    const counts = {}
    sales.value.forEach(s => {
        counts[s.payment_method] = (counts[s.payment_method] || 0) + 1
    })

    return {
        labels: Object.keys(counts).map(k => labels[k] || k),
        datasets: [{
            data:            Object.values(counts),
            backgroundColor: ['#22c55e', '#3b82f6', '#f97316', '#a855f7', '#ef4444'],
            hoverOffset:     4,
        }],
    }
})

const paymentChartOptions = {
    responsive:          true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'right' },
    },
}

// ─────────────────────────────────────
// Carregar dados
// ─────────────────────────────────────
const fetchAll = async () => {
    loading.value = true
    try {
        const [prod, lowStock, cli, sal, mov] = await Promise.all([
            api.get('/products'),
            api.get('/products/low-stock'),
            api.get('/clients'),
            api.get('/sales'),
            api.get('/stock-movements'),
        ])

        products.value         = prod.data.data     ?? prod.data
        lowStockProducts.value = lowStock.data.data ?? lowStock.data
        clients.value          = cli.data.data      ?? cli.data
        sales.value            = sal.data.data      ?? sal.data
        movements.value        = mov.data.data      ?? mov.data

    } catch {
        // falha silenciosa — cards mostram 0
    } finally {
        loading.value = false
    }
}

onMounted(fetchAll)
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 1.5rem; }

.page-header   { margin-bottom: 0.5rem; }
.page-title    { font-size: 1.5rem; font-weight: 700; }
.page-subtitle { color: var(--p-text-muted-color); margin-top: 0.25rem; }

/* Cards */
.dashboard-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
}

.indicator-card {
    background: var(--p-surface-card);
    border: 1px solid var(--p-surface-border);
    border-radius: 10px;
    padding: 1.25rem;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.indicator-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    color: #fff;
    flex-shrink: 0;
}

.indicator-info  { display: flex; flex-direction: column; gap: 0.15rem; }
.indicator-label { font-size: 0.8rem; color: var(--p-text-muted-color); }
.indicator-value { font-size: 1.5rem; font-weight: 700; }
.indicator-sub   { font-size: 0.75rem; color: var(--p-text-muted-color); }

/* Gráficos */
.charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.chart-card {
    background: var(--p-surface-card);
    border: 1px solid var(--p-surface-border);
    border-radius: 10px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.chart-title {
    font-size: 0.9rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--p-text-muted-color);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.chart-title.alert { color: #f97316; }

.chart-loading, .chart-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 280px;
    gap: 0.75rem;
    color: var(--p-text-muted-color);
}

.chart-loading i { font-size: 2rem; }
.chart-empty   i { font-size: 2.5rem; }

.donut-wrapper { position: relative; }

/* Estoque crítico */
.stock-low { color: #ef4444; font-weight: 700; }

@media (max-width: 768px) {
    .charts-grid { grid-template-columns: 1fr; }
}
</style>