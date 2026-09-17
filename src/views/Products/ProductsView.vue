<template>
    <div class="page">

        <!-- Cabeçalho -->
        <div class="page-header">
            <div>
                <h2 class="page-title">Produtos</h2>
                <p class="page-subtitle">Gerencie os produtos do estoque</p>
            </div>
            <Button
                label="Novo Produto"
                icon="pi pi-plus"
                @click="openDialog()"
            />
        </div>

        <!-- Cards resumo -->
        <div class="summary-cards">
            <div class="summary-card">
                <div class="summary-icon blue">
                    <i class="pi pi-box" />
                </div>
                <div>
                    <span class="summary-label">Total de Produtos</span>
                    <span class="summary-value">{{ products.length }}</span>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-icon orange">
                    <i class="pi pi-exclamation-triangle" />
                </div>
                <div>
                    <span class="summary-label">Estoque Crítico</span>
                    <span class="summary-value">{{ lowStockCount }}</span>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-icon green">
                    <i class="pi pi-check-circle" />
                </div>
                <div>
                    <span class="summary-label">Produtos Ativos</span>
                    <span class="summary-value">{{ activeCount }}</span>
                </div>
            </div>
        </div>

        <!-- Tabela -->
        <div class="card">
            <DataTable
                :value="products"
                :loading="loading"
                paginator
                :rows="10"
                :rowsPerPageOptions="[10, 20, 50]"
                stripedRows
                removableSort
                filterDisplay="row"
                v-model:filters="filters"
            >
                <Column field="code" header="Código" sortable style="width: 10%">
                    <template #filter="{ filterModel, filterCallback }">
                        <InputText
                            v-model="filterModel.value"
                            @input="filterCallback()"
                            placeholder="Buscar"
                            size="small"
                        />
                    </template>
                </Column>

                <Column field="name" header="Nome" sortable>
                    <template #filter="{ filterModel, filterCallback }">
                        <InputText
                            v-model="filterModel.value"
                            @input="filterCallback()"
                            placeholder="Buscar"
                            size="small"
                        />
                    </template>
                </Column>

                <Column header="Categoria">
                    <template #body="{ data }">
                        <Tag
                            v-if="data.category"
                            :value="data.category.name"
                            severity="secondary"
                        />
                        <span v-else class="no-data">—</span>
                    </template>
                </Column>

                <Column header="Marca">
                    <template #body="{ data }">
                        <span>{{ data.brand?.name || '—' }}</span>
                    </template>
                </Column>

                <Column field="sale_price" header="Preço Venda" sortable style="width: 12%">
                    <template #body="{ data }">
                        <span>R$ {{ data.sale_price }}</span>
                    </template>
                </Column>

                <Column header="Estoque" sortable style="width: 10%">
                    <template #body="{ data }">
                        <div class="stock-info">
                            <span
                                :class="data.below_minimum ? 'stock-low' : 'stock-ok'"
                            >
                                {{ data.current_stock }}
                            </span>
                            <small class="stock-min">mín: {{ data.minimum_stock }}</small>
                        </div>
                    </template>
                </Column>

                <Column header="Status" style="width: 8%">
                    <template #body="{ data }">
                        <Tag
                            :value="data.is_active ? 'Ativo' : 'Inativo'"
                            :severity="data.is_active ? 'success' : 'danger'"
                        />
                    </template>
                </Column>

                <Column header="Ações" style="width: 10%">
                    <template #body="{ data }">
                        <div class="actions">
                            <Button
                                icon="pi pi-pencil"
                                text rounded severity="secondary"
                                v-tooltip.top="'Editar'"
                                @click="openDialog(data)"
                            />
                            <Button
                                icon="pi pi-trash"
                                text rounded severity="danger"
                                v-tooltip.top="'Desativar'"
                                @click="confirmDelete(data)"
                            />
                        </div>
                    </template>
                </Column>

                <template #empty>
                    <div class="table-empty">
                        <i class="pi pi-box" />
                        <p>Nenhum produto encontrado.</p>
                    </div>
                </template>

            </DataTable>
        </div>

        <!-- Dialog criar/editar -->
        <Dialog
            v-model:visible="dialogVisible"
            :header="editingProduct ? 'Editar Produto' : 'Novo Produto'"
            modal
            :style="{ width: '600px' }"
            @hide="resetForm"
        >
            <div class="dialog-form">

                <!-- Código e Nome -->
                <div class="form-row">
                    <div class="field">
                        <label>Código *</label>
                        <InputText
                            v-model="form.code"
                            placeholder="Ex: PROD-001"
                            :invalid="!!errors.code"
                            fluid
                        />
                        <small class="field-error" v-if="errors.code">{{ errors.code }}</small>
                    </div>
                    <div class="field">
                        <label>Nome *</label>
                        <InputText
                            v-model="form.name"
                            placeholder="Nome do produto"
                            :invalid="!!errors.name"
                            fluid
                        />
                        <small class="field-error" v-if="errors.name">{{ errors.name }}</small>
                    </div>
                </div>

                <!-- Cor/Tonalidade -->
                <div class="field">
                    <label>Cor / Tonalidade</label>
                    <InputText
                        v-model="form.color_shade"
                        placeholder="Ex: Preto, Loiro, Neutro"
                        fluid
                    />
                </div>

                <!-- Preços -->
                <div class="form-row">
                    <div class="field">
                        <label>Preço de Custo *</label>
                        <InputNumber
                            v-model="form.cost_price"
                            mode="currency"
                            currency="BRL"
                            locale="pt-BR"
                            :invalid="!!errors.cost_price"
                            fluid
                        />
                        <small class="field-error" v-if="errors.cost_price">{{ errors.cost_price }}</small>
                    </div>
                    <div class="field">
                        <label>Preço de Venda *</label>
                        <InputNumber
                            v-model="form.sale_price"
                            mode="currency"
                            currency="BRL"
                            locale="pt-BR"
                            :invalid="!!errors.sale_price"
                            fluid
                        />
                        <small class="field-error" v-if="errors.sale_price">{{ errors.sale_price }}</small>
                    </div>
                </div>

                <!-- Estoque -->
                <div class="form-row">
                    <div class="field">
                        <label>Estoque Atual *</label>
                        <InputNumber
                            v-model="form.current_stock"
                            :min="0"
                            :invalid="!!errors.current_stock"
                            fluid
                        />
                        <small class="field-error" v-if="errors.current_stock">{{ errors.current_stock }}</small>
                    </div>
                    <div class="field">
                        <label>Estoque Mínimo *</label>
                        <InputNumber
                            v-model="form.minimum_stock"
                            :min="0"
                            :invalid="!!errors.minimum_stock"
                            fluid
                        />
                        <small class="field-error" v-if="errors.minimum_stock">{{ errors.minimum_stock }}</small>
                    </div>
                </div>

                <!-- Categoria e Marca -->
                <div class="form-row">
                    <div class="field">
                        <label>Categoria</label>
                        <Select
                            v-model="form.category_id"
                            :options="categories"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Selecione"
                            showClear
                            fluid
                        />
                    </div>
                    <div class="field">
                        <label>Marca</label>
                        <Select
                            v-model="form.brand_id"
                            :options="brands"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Selecione"
                            showClear
                            fluid
                        />
                    </div>
                </div>

                <!-- Fornecedor e Local -->
                <div class="form-row">
                    <div class="field">
                        <label>Fornecedor</label>
                        <Select
                            v-model="form.supplier_id"
                            :options="suppliers"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Selecione"
                            showClear
                            fluid
                        />
                    </div>
                    <div class="field">
                        <label>Local de Armazenamento</label>
                        <Select
                            v-model="form.location_id"
                            :options="locations"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Selecione"
                            showClear
                            fluid
                        />
                    </div>
                </div>

                <!-- Observações -->
                <div class="field">
                    <label>Observações</label>
                    <Textarea
                        v-model="form.notes"
                        placeholder="Observações sobre o produto"
                        rows="3"
                        fluid
                    />
                </div>

                <!-- Status -->
                <div class="field">
                    <label>Status</label>
                    <div class="flex align-items-center gap-2">
                        <ToggleSwitch v-model="form.is_active" />
                        <span>{{ form.is_active ? 'Ativo' : 'Inativo' }}</span>
                    </div>
                </div>

            </div>

            <template #footer>
                <Button label="Cancelar" text severity="secondary" @click="dialogVisible = false" />
                <Button
                    :label="editingProduct ? 'Salvar' : 'Criar'"
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
import { useConfirm } from 'primevue/useconfirm'
import api from '@/api/axios'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'

const toast   = useToast()
const confirm = useConfirm()

// ─────────────────────────────────────
// State
// ─────────────────────────────────────
const products       = ref([])
const categories     = ref([])
const brands         = ref([])
const suppliers      = ref([])
const locations      = ref([])
const loading        = ref(false)
const saving         = ref(false)
const dialogVisible  = ref(false)
const editingProduct = ref(null)
const errors         = ref({})

const defaultForm = {
    code:          '',
    name:          '',
    color_shade:   '',
    cost_price:    null,
    sale_price:    null,
    current_stock: null,
    minimum_stock: null,
    category_id:   null,
    brand_id:      null,
    supplier_id:   null,
    location_id:   null,
    notes:         '',
    is_active:     true,
}

const form = ref({ ...defaultForm })

const filters = ref({
    code: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

// ─────────────────────────────────────
// Computed
// ─────────────────────────────────────
const lowStockCount = computed(() =>
    products.value.filter(p => p.below_minimum).length
)

const activeCount = computed(() =>
    products.value.filter(p => p.is_active).length
)

// ─────────────────────────────────────
// Carregar dados
// ─────────────────────────────────────
const fetchProducts = async () => {
    loading.value = true
    try {
        const response = await api.get('/products')
        products.value = response.data.data ?? response.data
    } catch {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar os produtos.', life: 3000 })
    } finally {
        loading.value = false
    }
}

const fetchAuxData = async () => {
    try {
        const [cat, bra, sup, loc] = await Promise.all([
            api.get('/categories'),
            api.get('/brands'),
            api.get('/suppliers'),
            api.get('/storage-locations'),
        ])
        categories.value = cat.data.data ?? cat.data
        brands.value     = bra.data.data ?? bra.data
        suppliers.value  = sup.data.data ?? sup.data
        locations.value  = loc.data.data ?? loc.data
    } catch {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar os dados auxiliares.', life: 3000 })
    }
}

// ─────────────────────────────────────
// Dialog
// ─────────────────────────────────────
const openDialog = (product = null) => {
    editingProduct.value = product
    errors.value         = {}

    form.value = product ? {
        code:          product.code,
        name:          product.name,
        color_shade:   product.color_shade   || '',
        cost_price:    parseFloat(product.cost_price?.replace('.', '').replace(',', '.')) || null,
        sale_price:    parseFloat(product.sale_price?.replace('.', '').replace(',', '.')) || null,
        current_stock: product.current_stock,
        minimum_stock: product.minimum_stock,
        category_id:   product.category?.id  || null,
        brand_id:      product.brand?.id     || null,
        supplier_id:   product.supplier?.id  || null,
        location_id:   product.location?.id  || null,
        notes:         product.notes         || '',
        is_active:     product.is_active,
    } : { ...defaultForm }

    dialogVisible.value = true
}

const resetForm = () => {
    form.value           = { ...defaultForm }
    editingProduct.value = null
    errors.value         = {}
}

// ─────────────────────────────────────
// Criar / Editar
// ─────────────────────────────────────
const handleSubmit = async () => {
    saving.value = true
    errors.value = {}

    try {
        if (editingProduct.value) {
            await api.put(`/products/${editingProduct.value.id}`, form.value)
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto atualizado.', life: 3000 })
        } else {
            await api.post('/products', form.value)
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto criado.', life: 3000 })
        }

        dialogVisible.value = false
        fetchProducts()

    } catch (error) {
        const data = error.response?.data
        if (error.response?.status === 422 && data?.errors) {
            errors.value = Object.fromEntries(
                Object.entries(data.errors).map(([k, v]) => [k, v[0]])
            )
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: data?.message || 'Erro ao salvar.', life: 3000 })
        }
    } finally {
        saving.value = false
    }
}

// ─────────────────────────────────────
// Desativar
// ─────────────────────────────────────
const confirmDelete = (product) => {
    confirm.require({
        message:     `Deseja desativar o produto "${product.name}"?`,
        header:      'Confirmar desativação',
        icon:        'pi pi-exclamation-triangle',
        acceptLabel: 'Sim, desativar',
        rejectLabel: 'Cancelar',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await api.delete(`/products/${product.id}`)
                toast.add({ severity: 'success', summary: 'Desativado', detail: 'Produto desativado.', life: 3000 })
                fetchProducts()
            } catch {
                toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível desativar.', life: 3000 })
            }
        },
    })
}

onMounted(() => {
    fetchProducts()
    fetchAuxData()
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

/* Cards */
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
.summary-icon.orange { background: #f97316; }
.summary-icon.green  { background: #22c55e; }

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

.stock-info  { display: flex; flex-direction: column; gap: 0.1rem; }
.stock-ok    { font-weight: 600; color: #22c55e; }
.stock-low   { font-weight: 600; color: #ef4444; }
.stock-min   { font-size: 0.75rem; color: var(--p-text-muted-color); }
.no-data     { color: var(--p-text-muted-color); }
.actions     { display: flex; gap: 0.25rem; }

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

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.field       { display: flex; flex-direction: column; gap: 0.4rem; }
.field label { font-weight: 500; font-size: 0.875rem; }
.field-error { color: var(--p-red-500); font-size: 0.8rem; }
</style>