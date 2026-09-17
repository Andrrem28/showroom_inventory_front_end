<template>
    <div class="page">

        <!-- Cabeçalho -->
        <div class="page-header">
            <div class="header-left">
                <Button
                    icon="pi pi-arrow-left"
                    text severity="secondary"
                    @click="$router.push('/sales')"
                />
                <div>
                    <h2 class="page-title">Nova Venda</h2>
                    <p class="page-subtitle">Registre uma nova venda</p>
                </div>
            </div>
        </div>

        <div class="sale-layout">

            <!-- Coluna esquerda: produtos -->
            <div class="sale-left">
                <div class="card">
                    <h3 class="section-title">
                        <i class="pi pi-box" /> Adicionar Produtos
                    </h3>

                    <!-- Buscar produto -->
                    <div class="field">
                        <Select
                            v-model="selectedProduct"
                            :options="products"
                            optionLabel="name"
                            placeholder="Buscar produto..."
                            filter
                            fluid
                            @change="addItem"
                        >
                            <template #option="{ option }">
                                <div class="product-option">
                                    <span>{{ option.name }}</span>
                                    <div class="product-option-details">
                                        <small>{{ option.code }}</small>
                                        <small>Estoque: {{ option.current_stock }}</small>
                                        <small>R$ {{ option.sale_price }}</small>
                                    </div>
                                </div>
                            </template>
                        </Select>
                    </div>

                    <!-- Lista de itens -->
                    <div class="items-list" v-if="items.length">
                        <div
                            v-for="(item, index) in items"
                            :key="index"
                            class="item-row"
                        >
                            <div class="item-info">
                                <span class="item-name">{{ item.name }}</span>
                                <small class="item-code">{{ item.code }}</small>
                            </div>

                            <div class="item-controls">
                                <Button
                                    icon="pi pi-minus"
                                    text rounded size="small"
                                    @click="decrementQty(index)"
                                />
                                <span class="item-qty">{{ item.quantity }}</span>
                                <Button
                                    icon="pi pi-plus"
                                    text rounded size="small"
                                    @click="incrementQty(index)"
                                    :disabled="item.quantity >= item.current_stock"
                                />
                            </div>

                            <div class="item-subtotal">
                                R$ {{ itemSubtotal(item) }}
                            </div>

                            <Button
                                icon="pi pi-times"
                                text rounded severity="danger" size="small"
                                @click="removeItem(index)"
                            />
                        </div>
                    </div>

                    <!-- Sem itens -->
                    <div class="items-empty" v-else>
                        <i class="pi pi-shopping-cart" />
                        <p>Nenhum produto adicionado</p>
                    </div>
                </div>
            </div>

            <!-- Coluna direita: resumo e pagamento -->
            <div class="sale-right">
                <div class="card">
                    <h3 class="section-title">
                        <i class="pi pi-user" /> Cliente
                    </h3>
                    <Select
                        v-model="form.client_id"
                        :options="clients"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Cliente (opcional)"
                        showClear
                        filter
                        fluid
                    />
                </div>

                <div class="card">
                    <h3 class="section-title">
                        <i class="pi pi-credit-card" /> Pagamento
                    </h3>

                    <div class="field">
                        <label>Forma de Pagamento *</label>
                        <div class="payment-grid">
                            <div
                                v-for="method in paymentMethods"
                                :key="method.value"
                                class="payment-option"
                                :class="{ selected: form.payment_method === method.value }"
                                @click="form.payment_method = method.value; form.installments = 1"
                            >
                                <i :class="method.icon" />
                                <span>{{ method.label }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Parcelamento -->
                    <div class="field" v-if="form.payment_method === 'cartao_credito'">
                        <label>Parcelas</label>
                        <Select
                            v-model="form.installments"
                            :options="installmentOptions"
                            optionLabel="label"
                            optionValue="value"
                            fluid
                        />
                        <small class="installment-info" v-if="form.installments > 1">
                            {{ form.installments }}x de R$ {{ installmentValue }}
                        </small>
                    </div>

                    <!-- Observações -->
                    <div class="field">
                        <label>Observações</label>
                        <Textarea
                            v-model="form.notes"
                            placeholder="Observações da venda"
                            rows="2"
                            fluid
                        />
                    </div>
                </div>

                <!-- Resumo total -->
                <div class="card total-card">
                    <div class="total-row">
                        <span>Itens</span>
                        <span>{{ items.length }}</span>
                    </div>
                    <div class="total-row">
                        <span>Qtd total</span>
                        <span>{{ totalQty }}</span>
                    </div>
                    <Divider />
                    <div class="total-row total-main">
                        <span>Total</span>
                        <strong>R$ {{ totalAmount }}</strong>
                    </div>

                    <Button
                        label="Finalizar Venda"
                        icon="pi pi-check"
                        :loading="saving"
                        :disabled="!items.length || !form.payment_method"
                        fluid
                        class="mt-1"
                        @click="handleSubmit"
                    />
                </div>
            </div>

        </div>

    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import api from '@/api/axios'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Divider from 'primevue/divider'

const router  = useRouter()
const toast   = useToast()
const saving  = ref(false)
const products = ref([])
const clients  = ref([])
const selectedProduct = ref(null)
const items = ref([])

const form = ref({
    client_id:      null,
    payment_method: '',
    installments:   1,
    notes:          '',
})

const paymentMethods = [
    { value: 'dinheiro',       label: 'Dinheiro', icon: 'pi pi-money-bill'  },
    { value: 'pix',            label: 'PIX',      icon: 'pi pi-qrcode'      },
    { value: 'cartao_credito', label: 'Crédito',  icon: 'pi pi-credit-card' },
    { value: 'cartao_debito',  label: 'Débito',   icon: 'pi pi-credit-card' },
    { value: 'fiado',          label: 'Fiado',    icon: 'pi pi-clock'       },
]

const installmentOptions = Array.from({ length: 12 }, (_, i) => ({
    label: i === 0 ? 'À vista' : `${i + 1}x`,
    value: i + 1,
}))

// ─────────────────────────────────────
// Computed
// ─────────────────────────────────────
const itemSubtotal = (item) => {
    const price = parseFloat(item.sale_price?.replace?.('.', '').replace?.(',', '.')) || item.sale_price || 0
    return (price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

const totalAmount = computed(() => {
    return items.value.reduce((acc, item) => {
        const price = parseFloat(item.sale_price?.replace?.('.', '').replace?.(',', '.')) || item.sale_price || 0
        return acc + price * item.quantity
    }, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
})

const totalQty = computed(() =>
    items.value.reduce((acc, item) => acc + item.quantity, 0)
)

const installmentValue = computed(() => {
    if (!form.value.installments || form.value.installments <= 1) return null
    const total = items.value.reduce((acc, item) => {
        const price = parseFloat(item.sale_price?.replace?.('.', '').replace?.(',', '.')) || item.sale_price || 0
        return acc + price * item.quantity
    }, 0)
    return (total / form.value.installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
})

// ─────────────────────────────────────
// Itens
// ─────────────────────────────────────
const addItem = () => {
    if (!selectedProduct.value) return

    const existing = items.value.find(i => i.id === selectedProduct.value.id)
    if (existing) {
        if (existing.quantity < existing.current_stock) {
            existing.quantity++
        } else {
            toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Estoque insuficiente.', life: 3000 })
        }
    } else {
        items.value.push({ ...selectedProduct.value, quantity: 1 })
    }

    selectedProduct.value = null
}

const incrementQty = (index) => {
    const item = items.value[index]
    if (item.quantity < item.current_stock) item.quantity++
    else toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Estoque insuficiente.', life: 3000 })
}

const decrementQty = (index) => {
    if (items.value[index].quantity > 1) items.value[index].quantity--
    else removeItem(index)
}

const removeItem = (index) => {
    items.value.splice(index, 1)
}

// ─────────────────────────────────────
// Carregar
// ─────────────────────────────────────
const fetchData = async () => {
    try {
        const [prod, cli] = await Promise.all([
            api.get('/products'),
            api.get('/clients'),
        ])
        products.value = (prod.data.data ?? prod.data).filter(p => p.is_active && p.current_stock > 0)
        clients.value  = cli.data.data ?? cli.data
    } catch {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar os dados.', life: 3000 })
    }
}

// ─────────────────────────────────────
// Finalizar venda
// ─────────────────────────────────────
const handleSubmit = async () => {
    if (!items.value.length) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Adicione ao menos um produto.', life: 3000 })
        return
    }

    if (!form.value.payment_method) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione a forma de pagamento.', life: 3000 })
        return
    }

    saving.value = true

    try {
        await api.post('/sales', {
            client_id:      form.value.client_id,
            payment_method: form.value.payment_method,
            installments:   form.value.installments,
            notes:          form.value.notes,
            items: items.value.map(item => ({
                product_id: item.id,
                quantity:   item.quantity,
            })),
        })

        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Venda registrada com sucesso.', life: 3000 })
        router.push('/sales')

    } catch (error) {
        const data = error.response?.data
        toast.add({ severity: 'error', summary: 'Erro', detail: data?.message || 'Erro ao registrar venda.', life: 3000 })
    } finally {
        saving.value = false
    }
}

onMounted(fetchData)
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1.5rem; }

.page-header { display: flex; align-items: center; justify-content: space-between; }
.header-left { display: flex; align-items: center; gap: 0.75rem; }
.page-title  { font-size: 1.5rem; font-weight: 700; }
.page-subtitle { color: var(--p-text-muted-color); margin-top: 0.25rem; font-size: 0.875rem; }

/* Layout duas colunas */
.sale-layout {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 1.5rem;
    align-items: start;
}

.sale-left, .sale-right {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.card {
    background: var(--p-surface-card);
    border: 1px solid var(--p-surface-border);
    border-radius: 10px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.section-title {
    font-size: 0.9rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--p-text-muted-color);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/* Itens */
.items-list { display: flex; flex-direction: column; gap: 0.75rem; }

.item-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    border: 1px solid var(--p-surface-border);
    border-radius: 8px;
    background: var(--p-surface-ground);
}

.item-info   { flex: 1; display: flex; flex-direction: column; }
.item-name   { font-weight: 500; font-size: 0.9rem; }
.item-code   { color: var(--p-text-muted-color); font-size: 0.75rem; }

.item-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.item-qty { font-weight: 700; min-width: 24px; text-align: center; }

.item-subtotal {
    font-weight: 600;
    min-width: 80px;
    text-align: right;
    font-size: 0.9rem;
}

.items-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    gap: 0.5rem;
    color: var(--p-text-muted-color);
}

.items-empty i { font-size: 2rem; }

/* Pagamento */
.payment-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
}

.payment-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    border: 2px solid var(--p-surface-border);
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.15s;
}

.payment-option:hover,
.payment-option.selected {
    border-color: var(--p-primary-500);
    background: var(--p-primary-50);
    color: var(--p-primary-700);
    font-weight: 600;
}

.installment-info {
    color: var(--p-primary-600);
    font-weight: 500;
}

/* Total */
.total-card { gap: 0.75rem; }

.total-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    color: var(--p-text-muted-color);
}

.total-main {
    font-size: 1.1rem;
    color: var(--p-text-color);
    font-weight: 600;
}

.field       { display: flex; flex-direction: column; gap: 0.4rem; }
.field label { font-weight: 500; font-size: 0.875rem; }

.product-option { display: flex; flex-direction: column; gap: 0.2rem; }
.product-option-details {
    display: flex;
    gap: 0.75rem;
    color: var(--p-text-muted-color);
}

.mt-1 { margin-top: 0.5rem; }
</style>