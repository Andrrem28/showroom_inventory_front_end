<template>
    <div class="page">

        <!-- Cabeçalho -->
        <div class="page-header">
            <div>
                <h2 class="page-title">Fornecedores</h2>
                <p class="page-subtitle">Gerencie os fornecedores do sistema</p>
            </div>
            <Button
                label="Novo Fornecedor"
                icon="pi pi-plus"
                @click="openDialog()"
            />
        </div>

        <!-- Tabela -->
        <div class="card">
            <DataTable
                :value="suppliers"
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

                <Column field="name" header="Nome" sortable>
                    <template #filter="{ filterModel, filterCallback }">
                        <InputText
                            v-model="filterModel.value"
                            @input="filterCallback()"
                            placeholder="Buscar por nome"
                            size="small"
                        />
                    </template>
                </Column>

                <Column field="contact_person" header="Responsável" />

                <Column field="phone" header="Telefone" style="width: 14%" />

                <Column field="email" header="E-mail" />

                <Column field="created_at" header="Criado em" sortable style="width: 14%" />

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
                                v-tooltip.top="'Remover'"
                                @click="confirmDelete(data)"
                            />
                        </div>
                    </template>
                </Column>

                <template #empty>
                    <div class="table-empty">
                        <i class="pi pi-truck" />
                        <p>Nenhum fornecedor encontrado.</p>
                    </div>
                </template>

            </DataTable>
        </div>

        <!-- Dialog criar/editar -->
        <Dialog
            v-model:visible="dialogVisible"
            :header="editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'"
            modal
            :style="{ width: '520px' }"
            @hide="resetForm"
        >
            <div class="dialog-form">

                <div class="field">
                    <label>Nome *</label>
                    <InputText
                        v-model="form.name"
                        placeholder="Nome do fornecedor"
                        :invalid="!!errors.name"
                        fluid
                    />
                    <small class="field-error" v-if="errors.name">{{ errors.name }}</small>
                </div>

                <div class="field">
                    <label>Responsável</label>
                    <InputText
                        v-model="form.contact_person"
                        placeholder="Nome do responsável"
                        fluid
                    />
                </div>

                <div class="form-row">
                    <div class="field">
                        <label>Telefone</label>
                        <InputText
                            v-model="form.phone"
                            placeholder="Ex: 84999998888"
                            fluid
                        />
                    </div>

                    <div class="field">
                        <label>E-mail</label>
                        <InputText
                            v-model="form.email"
                            type="email"
                            placeholder="contato@fornecedor.com"
                            :invalid="!!errors.email"
                            fluid
                        />
                        <small class="field-error" v-if="errors.email">{{ errors.email }}</small>
                    </div>
                </div>

            </div>

            <template #footer>
                <Button label="Cancelar" text severity="secondary" @click="dialogVisible = false" />
                <Button
                    :label="editingSupplier ? 'Salvar' : 'Criar'"
                    icon="pi pi-check"
                    :loading="saving"
                    @click="handleSubmit"
                />
            </template>
        </Dialog>

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import api from '@/api/axios'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'

const toast   = useToast()
const confirm = useConfirm()

// ─────────────────────────────────────
// State
// ─────────────────────────────────────
const suppliers       = ref([])
const loading         = ref(false)
const saving          = ref(false)
const dialogVisible   = ref(false)
const editingSupplier = ref(null)
const errors          = ref({})

const defaultForm = {
    name:           '',
    contact_person: '',
    phone:          '',
    email:          '',
}

const form = ref({ ...defaultForm })

const filters = ref({
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

// ─────────────────────────────────────
// Carregar
// ─────────────────────────────────────
const fetchSuppliers = async () => {
    loading.value = true
    try {
        const response = await api.get('/suppliers')
        suppliers.value = response.data.data ?? response.data
    } catch {
        toast.add({
            severity: 'error',
            summary:  'Erro',
            detail:   'Não foi possível carregar os fornecedores.',
            life:     3000,
        })
    } finally {
        loading.value = false
    }
}

// ─────────────────────────────────────
// Dialog
// ─────────────────────────────────────
const openDialog = (supplier = null) => {
    editingSupplier.value = supplier
    errors.value          = {}

    form.value = supplier ? {
        name:           supplier.name,
        contact_person: supplier.contact_person || '',
        phone:          supplier.phone          || '',
        email:          supplier.email          || '',
    } : { ...defaultForm }

    dialogVisible.value = true
}

const resetForm = () => {
    form.value            = { ...defaultForm }
    editingSupplier.value = null
    errors.value          = {}
}

// ─────────────────────────────────────
// Criar / Editar
// ─────────────────────────────────────
const handleSubmit = async () => {
    saving.value = true
    errors.value = {}

    try {
        if (editingSupplier.value) {
            await api.put(`/suppliers/${editingSupplier.value.id}`, form.value)
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Fornecedor atualizado.', life: 3000 })
        } else {
            await api.post('/suppliers', form.value)
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Fornecedor criado.', life: 3000 })
        }

        dialogVisible.value = false
        fetchSuppliers()

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
// Deletar
// ─────────────────────────────────────
const confirmDelete = (supplier) => {
    confirm.require({
        message:     `Deseja remover o fornecedor "${supplier.name}"?`,
        header:      'Confirmar remoção',
        icon:        'pi pi-exclamation-triangle',
        acceptLabel: 'Sim, remover',
        rejectLabel: 'Cancelar',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await api.delete(`/suppliers/${supplier.id}`)
                toast.add({ severity: 'success', summary: 'Removido', detail: 'Fornecedor removido.', life: 3000 })
                fetchSuppliers()
            } catch {
                toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível remover.', life: 3000 })
            }
        },
    })
}

onMounted(fetchSuppliers)
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

.card {
    background: var(--p-surface-card);
    border: 1px solid var(--p-surface-border);
    border-radius: 10px;
    padding: 1.25rem;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.actions { display: flex; gap: 0.25rem; }

.table-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    gap: 0.5rem;
    color: var(--p-text-muted-color);
}

.table-empty i { font-size: 2rem; }

.dialog-form { display: flex; flex-direction: column; gap: 1.25rem; padding: 0.5rem 0; }
.field       { display: flex; flex-direction: column; gap: 0.4rem; }
.field label { font-weight: 500; font-size: 0.875rem; }
.field-error { color: var(--p-red-500); font-size: 0.8rem; }
</style>