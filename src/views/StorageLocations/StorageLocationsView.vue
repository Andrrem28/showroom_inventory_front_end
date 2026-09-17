<template>
    <div class="page">

        <!-- Cabeçalho -->
        <div class="page-header">
            <div>
                <h2 class="page-title">Locais de Armazenamento</h2>
                <p class="page-subtitle">Gerencie os locais onde os produtos são armazenados</p>
            </div>
            <Button
                label="Novo Local"
                icon="pi pi-plus"
                @click="openDialog()"
            />
        </div>

        <!-- Tabela -->
        <div class="card">
            <DataTable
                :value="locations"
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

                <Column field="description" header="Descrição" />

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
                        <i class="pi pi-map-marker" />
                        <p>Nenhum local encontrado.</p>
                    </div>
                </template>

            </DataTable>
        </div>

        <!-- Dialog criar/editar -->
        <Dialog
            v-model:visible="dialogVisible"
            :header="editingLocation ? 'Editar Local' : 'Novo Local'"
            modal
            :style="{ width: '480px' }"
            @hide="resetForm"
        >
            <div class="dialog-form">

                <div class="field">
                    <label>Nome *</label>
                    <InputText
                        v-model="form.name"
                        placeholder="Ex: Prateleira A"
                        :invalid="!!errors.name"
                        fluid
                    />
                    <small class="field-error" v-if="errors.name">{{ errors.name }}</small>
                </div>

                <div class="field">
                    <label>Descrição</label>
                    <Textarea
                        v-model="form.description"
                        placeholder="Descrição do local de armazenamento"
                        rows="3"
                        fluid
                    />
                </div>

            </div>

            <template #footer>
                <Button label="Cancelar" text severity="secondary" @click="dialogVisible = false" />
                <Button
                    :label="editingLocation ? 'Salvar' : 'Criar'"
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
import Textarea from 'primevue/textarea'

const toast   = useToast()
const confirm = useConfirm()

// ─────────────────────────────────────
// State
// ─────────────────────────────────────
const locations       = ref([])
const loading         = ref(false)
const saving          = ref(false)
const dialogVisible   = ref(false)
const editingLocation = ref(null)
const errors          = ref({})

const defaultForm = { name: '', description: '' }
const form        = ref({ ...defaultForm })

const filters = ref({
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

// ─────────────────────────────────────
// Carregar
// ─────────────────────────────────────
const fetchLocations = async () => {
    loading.value = true
    try {
        const response = await api.get('/storage-locations')
        locations.value = response.data.data ?? response.data
    } catch {
        toast.add({
            severity: 'error',
            summary:  'Erro',
            detail:   'Não foi possível carregar os locais.',
            life:     3000,
        })
    } finally {
        loading.value = false
    }
}

// ─────────────────────────────────────
// Dialog
// ─────────────────────────────────────
const openDialog = (location = null) => {
    editingLocation.value = location
    errors.value          = {}

    form.value = location
        ? { name: location.name, description: location.description || '' }
        : { ...defaultForm }

    dialogVisible.value = true
}

const resetForm = () => {
    form.value            = { ...defaultForm }
    editingLocation.value = null
    errors.value          = {}
}

// ─────────────────────────────────────
// Criar / Editar
// ─────────────────────────────────────
const handleSubmit = async () => {
    saving.value = true
    errors.value = {}

    try {
        if (editingLocation.value) {
            await api.put(`/storage-locations/${editingLocation.value.id}`, form.value)
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Local atualizado.', life: 3000 })
        } else {
            await api.post('/storage-locations', form.value)
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Local criado.', life: 3000 })
        }

        dialogVisible.value = false
        fetchLocations()

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
const confirmDelete = (location) => {
    confirm.require({
        message:     `Deseja remover o local "${location.name}"?`,
        header:      'Confirmar remoção',
        icon:        'pi pi-exclamation-triangle',
        acceptLabel: 'Sim, remover',
        rejectLabel: 'Cancelar',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await api.delete(`/storage-locations/${location.id}`)
                toast.add({ severity: 'success', summary: 'Removido', detail: 'Local removido.', life: 3000 })
                fetchLocations()
            } catch {
                toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível remover.', life: 3000 })
            }
        },
    })
}

onMounted(fetchLocations)
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