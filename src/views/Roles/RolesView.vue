<template>
    <div class="page">

        <!-- Cabeçalho -->
        <div class="page-header">
            <div>
                <h2 class="page-title">Papéis</h2>
                <p class="page-subtitle">Gerencie os papéis e suas permissões</p>
            </div>
            <Button
                label="Novo Papel"
                icon="pi pi-plus"
                @click="openDialog()"
            />
        </div>

        <!-- Tabela -->
        <div class="card">
            <DataTable
                :value="roles"
                :loading="loading"
                paginator
                :rows="10"
                :rowsPerPageOptions="[10, 20, 50]"
                stripedRows
                removableSort
            >
                <Column field="id" header="ID" sortable style="width: 5%" />

                <Column field="name" header="Nome" sortable />

                <Column field="description" header="Descrição" />

                <Column header="Permissões">
                    <template #body="{ data }">
                        <div class="permissions-tags">
                            <Tag
                                v-for="perm in data.permissions"
                                :key="perm"
                                :value="perm"
                                severity="secondary"
                                class="perm-tag"
                            />
                            <span v-if="!data.permissions?.length" class="no-data">
                                Sem permissões
                            </span>
                        </div>
                    </template>
                </Column>

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
                        <i class="pi pi-shield" />
                        <p>Nenhum papel encontrado.</p>
                    </div>
                </template>

            </DataTable>
        </div>

        <!-- Dialog criar/editar -->
        <Dialog
            v-model:visible="dialogVisible"
            :header="editingRole ? 'Editar Papel' : 'Novo Papel'"
            modal
            :style="{ width: '520px' }"
            @hide="resetForm"
        >
            <div class="dialog-form">

                <div class="field">
                    <label>Nome *</label>
                    <InputText
                        v-model="form.name"
                        placeholder="Ex: gerente"
                        :invalid="!!errors.name"
                        fluid
                    />
                    <small class="field-error" v-if="errors.name">{{ errors.name }}</small>
                </div>

                <div class="field">
                    <label>Descrição</label>
                    <InputText
                        v-model="form.description"
                        placeholder="Descrição do papel"
                        fluid
                    />
                </div>

                <!-- Permissões -->
                <div class="field">
                    <label>Permissões</label>
                    <div class="permissions-grid">
                        <div
                            v-for="group in permissionGroups"
                            :key="group.label"
                            class="permission-group"
                        >
                            <div class="group-header">
                                <Checkbox
                                    :modelValue="isGroupSelected(group)"
                                    binary
                                    @change="toggleGroup(group)"
                                />
                                <span class="group-label">{{ group.label }}</span>
                            </div>
                            <div class="group-items">
                                <div
                                    v-for="perm in group.permissions"
                                    :key="perm.id"
                                    class="permission-item"
                                >
                                    <Checkbox
                                        v-model="selectedPermissions"
                                        :value="perm.id"
                                        binary
                                        :inputId="'perm-' + perm.id"
                                    />
                                    <label :for="'perm-' + perm.id" class="perm-label">
                                        {{ perm.name }}
                                        <small>{{ perm.description }}</small>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <template #footer>
                <Button label="Cancelar" text severity="secondary" @click="dialogVisible = false" />
                <Button
                    :label="editingRole ? 'Salvar' : 'Criar'"
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
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import api from '@/api/axios'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Tag from 'primevue/tag'

const toast   = useToast()
const confirm = useConfirm()

// ─────────────────────────────────────
// State
// ─────────────────────────────────────
const roles               = ref([])
const allPermissions      = ref([])
const selectedPermissions = ref([])
const loading             = ref(false)
const saving              = ref(false)
const dialogVisible       = ref(false)
const editingRole         = ref(null)
const errors              = ref({})

const defaultForm = { name: '', description: '' }
const form        = ref({ ...defaultForm })

// ─────────────────────────────────────
// Agrupar permissões por módulo
// ─────────────────────────────────────
const permissionGroups = computed(() => {
    const groups = {}

    allPermissions.value.forEach(perm => {
        const module = perm.name.split('.')[0]

        const labelMap = {
            products:         'Produtos',
            stock:            'Estoque',
            sales:            'Vendas',
            categories:       'Categorias',
            suppliers:        'Fornecedores',
            'storage-locations': 'Locais',
            clients:          'Clientes',
            users:            'Usuários',
            reports:          'Relatórios',
        }

        if (!groups[module]) {
            groups[module] = {
                label:       labelMap[module] || module,
                permissions: [],
            }
        }

        groups[module].permissions.push(perm)
    })

    return Object.values(groups)
})

const isGroupSelected = (group) => {
    return group.permissions.every(p => selectedPermissions.value.includes(p.id))
}

const toggleGroup = (group) => {
    const ids = group.permissions.map(p => p.id)
    if (isGroupSelected(group)) {
        selectedPermissions.value = selectedPermissions.value.filter(id => !ids.includes(id))
    } else {
        ids.forEach(id => {
            if (!selectedPermissions.value.includes(id)) {
                selectedPermissions.value.push(id)
            }
        })
    }
}

// ─────────────────────────────────────
// Carregar dados
// ─────────────────────────────────────
const fetchRoles = async () => {
    loading.value = true
    try {
        const response = await api.get('/roles')
        roles.value = response.data.data ?? response.data
    } catch {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar os papéis.', life: 3000 })
    } finally {
        loading.value = false
    }
}

const fetchPermissions = async () => {
    try {
        const response = await api.get('/permissions')
        allPermissions.value = response.data.data ?? response.data
    } catch {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar as permissões.', life: 3000 })
    }
}

// ─────────────────────────────────────
// Dialog
// ─────────────────────────────────────
const openDialog = (role = null) => {
    editingRole.value       = role
    errors.value            = {}
    selectedPermissions.value = []

    if (role) {
        form.value = { name: role.name, description: role.description || '' }
        selectedPermissions.value = allPermissions.value
            .filter(p => role.permissions?.includes(p.name))
            .map(p => p.id)
    } else {
        form.value = { ...defaultForm }
    }

    dialogVisible.value = true
}

const resetForm = () => {
    form.value              = { ...defaultForm }
    editingRole.value       = null
    errors.value            = {}
    selectedPermissions.value = []
}

// ─────────────────────────────────────
// Criar / Editar
// ─────────────────────────────────────
const handleSubmit = async () => {
    saving.value = true
    errors.value = {}

    try {
        if (editingRole.value) {
            await api.put(`/roles/${editingRole.value.id}`, form.value)
            await api.put(`/roles/${editingRole.value.id}/permissions`, {
                permissions: selectedPermissions.value,
            })
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Papel atualizado.', life: 3000 })
        } else {
            const response = await api.post('/roles', form.value)
            if (selectedPermissions.value.length) {
                await api.post(`/roles/${response.data.id}/permissions`, {
                    permissions: selectedPermissions.value,
                })
            }
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Papel criado.', life: 3000 })
        }

        dialogVisible.value = false
        fetchRoles()

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
const confirmDelete = (role) => {
    confirm.require({
        message:     `Deseja remover o papel "${role.name}"?`,
        header:      'Confirmar remoção',
        icon:        'pi pi-exclamation-triangle',
        acceptLabel: 'Sim, remover',
        rejectLabel: 'Cancelar',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await api.delete(`/roles/${role.id}`)
                toast.add({ severity: 'success', summary: 'Removido', detail: 'Papel removido.', life: 3000 })
                fetchRoles()
            } catch {
                toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível remover.', life: 3000 })
            }
        },
    })
}

onMounted(() => {
    fetchRoles()
    fetchPermissions()
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

.card {
    background: var(--p-surface-card);
    border: 1px solid var(--p-surface-border);
    border-radius: 10px;
    padding: 1.25rem;
}

.permissions-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
}

.perm-tag { font-size: 0.7rem; }
.no-data  { font-size: 0.8rem; color: var(--p-text-muted-color); }
.actions  { display: flex; gap: 0.25rem; }

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

/* Permissões */
.permissions-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 300px;
    overflow-y: auto;
    padding: 0.75rem;
    border: 1px solid var(--p-surface-border);
    border-radius: 8px;
    background: var(--p-surface-ground);
}

.permission-group { display: flex; flex-direction: column; gap: 0.5rem; }

.group-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.group-label {
    font-weight: 600;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--p-text-muted-color);
}

.group-items {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding-left: 1.5rem;
}

.permission-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.perm-label {
    display: flex;
    flex-direction: column;
    font-size: 0.85rem;
    cursor: pointer;
}

.perm-label small {
    color: var(--p-text-muted-color);
    font-size: 0.75rem;
}
</style>