<template>
    <div class="page">

        <!-- Cabeçalho -->
        <div class="page-header">
            <div>
                <h2 class="page-title">Vendas</h2>
                <p class="page-subtitle">Histórico e gerenciamento de vendas</p>
            </div>
            <Button
                label="Nova Venda"
                icon="pi pi-plus"
                @click="$router.push('/sales/new')"
            />
        </div>

        <!-- Cards resumo -->
        <div class="summary-cards">
            <div class="summary-card">
                <div class="summary-icon blue">
                    <i class="pi pi-shopping-cart" />
                </div>
                <div>
                    <span class="summary-label">Total de Vendas</span>
                    <span class="summary-value">{{ sales.length }}</span>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-icon green">
                    <i class="pi pi-dollar" />
                </div>
                <div>
                    <span class="summary-label">Valor Total</span>
                    <span class="summary-value">R$ {{ totalAmount }}</span>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-icon purple">
                    <i class="pi pi-credit-card" />
                </div>
                <div>
                    <span class="summary-label">Vendas Parceladas</span>
                    <span class="summary-value">{{ installmentCount }}</span>
                </div>
            </div>
        </div>

        <!-- Tabela -->
        <div class="card">
            <DataTable
                :value="sales"
                :loading="loading"
                paginator
                :rows="10"
                :rowsPerPageOptions="[10, 20, 50]"
                stripedRows
                removableSort
                v-model:expandedRows="expandedRows"
            >
                <!-- Expandir -->
                <Column expander style="width: 3%" />

                <Column field="id" header="ID" sortable style="width: 5%" />

                <!-- Cliente -->
                <Column header="Cliente">
                    <template #body="{ data }">
                        <span>{{ data.client?.name || 'Avulso' }}</span>
                    </template>
                </Column>

                <!-- Forma de pagamento -->
                <Column header="Pagamento" style="width: 14%">
                    <template #body="{ data }">
                        <Tag
                            :value="paymentLabel(data.payment_method)"
                            :severity="paymentSeverity(data.payment_method)"
                        />
                    </template>
                </Column>

                <!-- Parcelamento -->
                <Column header="Parcelas" style="width: 10%">
                    <template #body="{ data }">
                        <span v-if="data.installments > 1">
                            {{ data.installments }}x de R$ {{ data.installment_value }}
                        </span>
                        <span v-else class="no-data">À vista</span>
                    </template>
                </Column>

                <!-- Total -->
                <Column field="total_amount" header="Total" sortable style="width: 12%">
                    <template #body="{ data }">
                        <strong>R$ {{ data.total_amount }}</strong>
                    </template>
                </Column>

                <!-- Vendedor -->
                <Column header="Vendedor" style="width: 12%">
                    <template #body="{ data }">
                        <span>{{ data.user?.name }}</span>
                    </template>
                </Column>

                <!-- Data -->
                <Column field="sold_at" header="Data" sortable style="width: 14%" />

                <!-- Ações -->
                <Column header="Ações" style="width: 8%">
                    <template #body="{ data }">
                        <Button
                            icon="pi pi-times"
                            text rounded severity="danger"
                            v-tooltip.top="'Cancelar venda'"
                            @click="confirmCancel(data)"
                        />
                    </template>
                </Column>

                <!-- Expansão com itens da venda -->
                <template #expansion="{ data }">
                    <div class="sale-items">
                        <h4 class="items-title">Itens da venda #{{ data.id }}</h4>
                        <DataTable :value="data.items" size="small">
                            <Column header="Produto">
                                <template #body="{ data: item }">
                                    <div class="product-info">
                                        <span>{{ item.product?.name }}</span>
                                        <small>{{ item.product?.code }}</small>
                                    </div>
                                </template>
                            </Column>
                            <Column field="quantity"   header="Qtd"           style="width: 8%"  />
                            <Column field="unit_price" header="Preço Unit."    style="width: 12%">
                                <template #body="{ data: item }">
                                    R$ {{ item.unit_price }}
                                </template>
                            </Column>
                            <Column field="subtotal"   header="Subtotal"       style="width: 12%">
                                <template #body="{ data: item }">
                                    <strong>R$ {{ item.subtotal }}</strong>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </template>

                <template #empty>
                    <div class="table-empty">
                        <i class="pi pi-shopping-cart" />
                        <p>Nenhuma venda encontrada.</p>
                    </div>
                </template>

            </DataTable>
        </div>

    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import api from '@/api/axios'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const toast        = useToast()
const confirm      = useConfirm()
const sales        = ref([])
const loading      = ref(false)
const expandedRows = ref([])

// ─────────────────────────────────────
// Helpers
// ─────────────────────────────────────
const paymentLabels = {
    dinheiro:       'Dinheiro',
    pix:            'PIX',
    cartao_credito: 'Crédito',
    cartao_debito:  'Débito',
    fiado:          'Fiado',
}

const paymentSeverities = {
    dinheiro:       'success',
    pix:            'info',
    cartao_credito: 'warn',
    cartao_debito:  'secondary',
    fiado:          'danger',
}

const paymentLabel    = (method) => paymentLabels[method]    || method
const paymentSeverity = (method) => paymentSeverities[method] || 'secondary'

// ─────────────────────────────────────
// Computed
// ─────────────────────────────────────
const totalAmount = computed(() => {
    const total = sales.value.reduce((acc, s) => {
        const val = parseFloat(s.total_amount?.replace('.', '').replace(',', '.')) || 0
        return acc + val
    }, 0)
    return total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
})

const installmentCount = computed(() =>
    sales.value.filter(s => s.installments > 1).length
)

// ─────────────────────────────────────
// Carregar
// ─────────────────────────────────────
const fetchSales = async () => {
    loading.value = true
    try {
        const response = await api.get('/sales')
        sales.value = response.data.data ?? response.data
    } catch {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar as vendas.', life: 3000 })
    } finally {
        loading.value = false
    }
}

// ─────────────────────────────────────
// Cancelar venda
// ─────────────────────────────────────
const confirmCancel = (sale) => {
    confirm.require({
        message:     `Deseja cancelar a venda #${sale.id}? O estoque será restaurado.`,
        header:      'Confirmar cancelamento',
        icon:        'pi pi-exclamation-triangle',
        acceptLabel: 'Sim, cancelar',
        rejectLabel: 'Não',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await api.delete(`/sales/${sale.id}`)
                toast.add({ severity: 'success', summary: 'Cancelado', detail: 'Venda cancelada e estoque restaurado.', life: 3000 })
                fetchSales()
            } catch {
                toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível cancelar a venda.', life: 3000 })
            }
        },
    })
}

onMounted(fetchSales)
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1.5rem; }

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.page-title    { font-size: 1.5rem; font-weight: 700; }
.page-subtitle { color: var(--p-text-muted-color); margin-top: 0.25rem; font-size: 0.875rem; }

.summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
}

.summary-card {
    background: var(--p-surface-card);
    border: 1px solid var(--p-surface-border);
    border-radius: 10px;
    padding: 1.25rem;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.summary-icon {
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

.summary-icon.blue   { background: #3b82f6; }
.summary-icon.green  { background: #22c55e; }
.summary-icon.purple { background: #a855f7; }

.summary-card div { display: flex; flex-direction: column; gap: 0.2rem; }
.summary-label    { font-size: 0.8rem; color: var(--p-text-muted-color); }
.summary-value    { font-size: 1.5rem; font-weight: 700; }

.card {
    background: var(--p-surface-card);
    border: 1px solid var(--p-surface-border);
    border-radius: 10px;
    padding: 1.25rem;
}

.no-data { color: var(--p-text-muted-color); font-size: 0.85rem; }

.table-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    gap: 0.5rem;
    color: var(--p-text-muted-color);
}

.table-empty i { font-size: 2rem; }

/* Expansão */
.sale-items   { padding: 1rem 2rem; }
.items-title  { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--p-text-muted-color); }

.product-info { display: flex; flex-direction: column; }
.product-info small { color: var(--p-text-muted-color); font-size: 0.75rem; }
</style>