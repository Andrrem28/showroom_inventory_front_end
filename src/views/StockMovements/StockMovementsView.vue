<template>
    <div class="page">

        <!-- Cabeçalho -->
        <div class="page-header">
            <div>
                <h2 class="page-title">Movimentações de Estoque</h2>
                <p class="page-subtitle">Registre entradas e saídas de produtos</p>
            </div>
            <Button
                label="Nova Movimentação"
                icon="pi pi-plus"
                @click="openDialog()"
            />
        </div>

        <!-- Cards resumo -->
        <div class="summary-cards">
            <div class="summary-card entrada">
                <i class="pi pi-arrow-down" />
                <div>
                    <span class="summary-label">Total de Entradas</span>
                    <span class="summary-value">{{ totalEntradas }}</span>
                </div>
            </div>
            <div class="summary-card saida">
                <i class="pi pi-arrow-up" />
                <div>
                    <span class="summary-label">Total de Saídas</span>
                    <span class="summary-value">{{ totalSaidas }}</span>
                </div>
            </div>
            <div class="summary-card automatica">
                <i class="pi pi-shopping-cart" />
                <div>
                    <span class="summary-label">Saídas por Venda</span>
                    <span class="summary-value">{{ totalAutomaticas }}</span>
                </div>
            </div>
        </div>

        <!-- Tabela -->
        <div class="card">
            <DataTable
                :value="movements"
                :loading="loading"
                paginator
                :rows="10"
                :rowsPerPageOptions="[10, 20, 50]"
                stripedRows
                removableSort
                filterDisplay="row"
                v-model:filters="filters"
            >
                <Column field="id" header="ID" sortable style="width: 5%" />

                <!-- Tipo -->
                <Column field="type" header="Tipo" sortable style="width: 10%">
                    <template #body="{ data }">
                        <Tag
                            :value="data.type === 'entrada' ? 'Entrada' : 'Saída'"
                            :severity="data.type === 'entrada' ? 'success' : 'danger'"
                        />
                    </template>
                    <template #filter="{ filterModel, filterCallback }">
                        <Select
                            v-model="filterModel.value"
                            @change="filterCallback()"
                            :options="typeOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Todos"
                            size="small"
                        />
                    </template>
                </Column>

                <!-- Origem -->
                <Column header="Origem" style="width: 12%">
                    <template #body="{ data }">
                        <Tag
                            v-if="isAutomatic(data.notes)"
                            :value="isEstorno(data.notes) ? 'Estorno' : 'Venda'"
                            :severity="isEstorno(data.notes) ? 'warn' : 'info'"
                            v-tooltip.top="data.notes"
                        />
                        <Tag
                            v-else
                            value="Manual"
                            severity="secondary"
                        />
                    </template>
                </Column>

                <!-- Produto -->
                <Column header="Produto">
                    <template #body="{ data }">
                        <div class="product-info">
                            <span class="product-name">{{ data.product?.name }}</span>
                            <small class="product-code">{{ data.product?.code }}</small>
                        </div>
                    </template>
                </Column>

                <!-- Quantidade -->
                <Column field="quantity" header="Qtd" sortable style="width: 8%" />

                <!-- Estoque atual -->
                <Column header="Estoque Atual" style="width: 10%">
                    <template #body="{ data }">
                        <span>{{ data.product?.current_stock }}</span>
                    </template>
                </Column>

                <!-- Registrado por -->
                <Column header="Registrado por" style="width: 12%">
                    <template #body="{ data }">
                        <span>{{ data.user?.name }}</span>
                    </template>
                </Column>

                <!-- Observações -->
                <Column header="Observações">
                    <template #body="{ data }">
                        <span class="notes-text">{{ data.notes || '—' }}</span>
                    </template>
                </Column>

                <!-- Data -->
                <Column field="moved_at" header="Data" sortable style="width: 14%" />

                <template #empty>
                    <div class="table-empty">
                        <i class="pi pi-arrows-v" />
                        <p>Nenhuma movimentação encontrada.</p>
                    </div>
                </template>

            </DataTable>
        </div>

        <!-- Dialog nova movimentação -->
        <Dialog
            v-model:visible="dialogVisible"
            header="Nova Movimentação"
            modal
            :style="{ width: '480px' }"
            @hide="resetForm"
        >
            <div class="dialog-form">

                <!-- Tipo -->
                <div class="field">
                    <label>Tipo *</label>
                    <div class="type-selector">
                        <div
                            class="type-option entrada"
                            :class="{ selected: form.type === 'entrada' }"
                            @click="form.type = 'entrada'"
                        >
                            <i class="pi pi-arrow-down" />
                            <span>Entrada</span>
                        </div>
                        <div
                            class="type-option saida"
                            :class="{ selected: form.type === 'saida' }"
                            @click="form.type = 'saida'"
                        >
                            <i class="pi pi-arrow-up" />
                            <span>Saída</span>
                        </div>
                    </div>
                    <small class="field-error" v-if="errors.type">{{ errors.type }}</small>
                </div>

                <!-- Produto -->
                <div class="field">
                    <label>Produto *</label>
                    <Select
                        v-model="form.product_id"
                        :options="products"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Selecione o produto"
                        :invalid="!!errors.product_id"
                        filter
                        fluid
                    >
                        <template #option="{ option }">
                            <div class="product-option">
                                <span>{{ option.name }}</span>
                                <small>Estoque: {{ option.current_stock }}</small>
                            </div>
                        </template>
                    </Select>
                    <small class="field-error" v-if="errors.product_id">{{ errors.product_id }}</small>
                </div>

                <!-- Quantidade -->
                <div class="field">
                    <label>Quantidade *</label>
                    <InputNumber
                        v-model="form.quantity"
                        placeholder="Ex: 10"
                        :min="1"
                        :invalid="!!errors.quantity"
                        fluid
                    />
                    <small class="field-error" v-if="errors.quantity">{{ errors.quantity }}</small>
                </div>

                <!-- Observações -->
                <div class="field">
                    <label>Observações</label>
                    <Textarea
                        v-model="form.notes"
                        placeholder="Ex: Reposição de estoque"
                        rows="3"
                        fluid
                    />
                </div>

            </div>

            <template #footer>
                <Button label="Cancelar" text severity="secondary" @click="dialogVisible = false" />
                <Button
                    label="Registrar"
                    icon="pi pi-check"
                    :loading="saving"
                    @click="handleSubmit"
                />
            </template>
        </Dialog>

    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import api from '@/api/axios'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Tag from 'primevue/tag'

const toast = useToast()

// ─────────────────────────────────────
// State
// ─────────────────────────────────────
const movements     = ref([])
const products      = ref([])
const loading       = ref(false)
const saving        = ref(false)
const dialogVisible = ref(false)
const errors        = ref({})

const defaultForm = {
    type:       'entrada',
    product_id: null,
    quantity:   null,
    notes:      '',
}

const form = ref({ ...defaultForm })

const typeOptions = [
    { label: 'Entrada', value: 'entrada' },
    { label: 'Saída',   value: 'saida'   },
]

const filters = ref({
    type: { value: null, matchMode: FilterMatchMode.EQUALS },
})

// ─────────────────────────────────────
// Helpers — identificar origem
// ─────────────────────────────────────
const isAutomatic = (notes) => {
    return notes?.startsWith('Saída automática') || notes?.startsWith('Estorno automático')
}

const isEstorno = (notes) => {
    return notes?.startsWith('Estorno automático')
}

// ─────────────────────────────────────
// Computed
// ─────────────────────────────────────
const totalEntradas = computed(() =>
    movements.value
        .filter(m => m.type === 'entrada')
        .reduce((acc, m) => acc + m.quantity, 0)
)

const totalSaidas = computed(() =>
    movements.value
        .filter(m => m.type === 'saida')
        .reduce((acc, m) => acc + m.quantity, 0)
)

const totalAutomaticas = computed(() =>
    movements.value
        .filter(m => isAutomatic(m.notes))
        .reduce((acc, m) => acc + m.quantity, 0)
)

// ─────────────────────────────────────
// Carregar
// ─────────────────────────────────────
const fetchMovements = async () => {
    loading.value = true
    try {
        const response = await api.get('/stock-movements')
        movements.value = response.data.data ?? response.data
    } catch {
        toast.add({
            severity: 'error',
            summary:  'Erro',
            detail:   'Não foi possível carregar as movimentações.',
            life:     3000,
        })
    } finally {
        loading.value = false
    }
}

const fetchProducts = async () => {
    try {
        const response = await api.get('/products')
        products.value = response.data.data ?? response.data
    } catch {
        toast.add({
            severity: 'error',
            summary:  'Erro',
            detail:   'Não foi possível carregar os produtos.',
            life:     3000,
        })
    }
}

// ─────────────────────────────────────
// Dialog
// ─────────────────────────────────────
const openDialog = () => {
    errors.value        = {}
    form.value          = { ...defaultForm }
    dialogVisible.value = true
}

const resetForm = () => {
    form.value   = { ...defaultForm }
    errors.value = {}
}

// ─────────────────────────────────────
// Registrar
// ─────────────────────────────────────
const handleSubmit = async () => {
    saving.value = true
    errors.value = {}

    try {
        await api.post('/stock-movements', form.value)
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Movimentação registrada.', life: 3000 })
        dialogVisible.value = false
        fetchMovements()
        fetchProducts()
    } catch (error) {
        const data = error.response?.data
        if (error.response?.status === 422 && data?.errors) {
            errors.value = Object.fromEntries(
                Object.entries(data.errors).map(([k, v]) => [k, v[0]])
            )
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: data?.message || 'Erro ao registrar.', life: 3000 })
        }
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    fetchMovements()
    fetchProducts()
})
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

/* Cards resumo */
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

.summary-card i {
    font-size: 1.5rem;
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;
}

.summary-card.entrada    i { background: #22c55e; }
.summary-card.saida      i { background: #ef4444; }
.summary-card.automatica i { background: #3b82f6; }

.summary-card div { display: flex; flex-direction: column; gap: 0.2rem; }
.summary-label    { font-size: 0.8rem; color: var(--p-text-muted-color); }
.summary-value    { font-size: 1.5rem; font-weight: 700; }

/* Tabela */
.card {
    background: var(--p-surface-card);
    border: 1px solid var(--p-surface-border);
    border-radius: 10px;
    padding: 1.25rem;
}

.product-info { display: flex; flex-direction: column; gap: 0.15rem; }
.product-name { font-weight: 500; }
.product-code { color: var(--p-text-muted-color); font-size: 0.78rem; }

.notes-text {
    font-size: 0.85rem;
    color: var(--p-text-muted-color);
}

.table-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    gap: 0.5rem;
    color: var(--p-text-muted-color);
}

.table-empty i { font-size: 2rem; }

/* Dialog */
.dialog-form { display: flex; flex-direction: column; gap: 1.25rem; padding: 0.5rem 0; }
.field       { display: flex; flex-direction: column; gap: 0.4rem; }
.field label { font-weight: 500; font-size: 0.875rem; }
.field-error { color: var(--p-red-500); font-size: 0.8rem; }

/* Seletor de tipo */
.type-selector {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
}

.type-option {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border-radius: 8px;
    border: 2px solid var(--p-surface-border);
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
}

.type-option.entrada:hover,
.type-option.entrada.selected {
    border-color: #22c55e;
    background: #f0fdf4;
    color: #16a34a;
}

.type-option.saida:hover,
.type-option.saida.selected {
    border-color: #ef4444;
    background: #fef2f2;
    color: #dc2626;
}

.product-option {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.product-option small {
    color: var(--p-text-muted-color);
    font-size: 0.78rem;
}
</style>