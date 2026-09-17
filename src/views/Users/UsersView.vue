<template>
    <div class="page">

        <!-- Cabeçalho -->
        <div class="page-header">
            <div>
                <h2 class="page-title">Usuários</h2>
                <p class="page-subtitle">Gerencie os usuários do sistema</p>
            </div>
            <Button
                label="Novo Usuário"
                icon="pi pi-plus"
                @click="openDialog()"
            />
        </div>

        <!-- Tabela -->
        <div class="card">
            <DataTable
                :value="users"
                :loading="loading"
                paginator
                :rows="10"
                :rowsPerPageOptions="[10, 20, 50]"
                tableStyle="min-width: 50rem"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                currentPageReportTemplate="{first} a {last} de {totalRecords}"
                stripedRows
                removableSort
            >
                <!-- ID -->
                <Column field="id" header="ID" sortable style="width: 5%" />

                <!-- Nome -->
                <Column field="name" header="Nome" sortable />

                <!-- Email -->
                <Column field="email" header="E-mail" sortable />

                <!-- Papéis -->
                <Column header="Papéis">
                    <template #body="{ data }">
                        <div class="roles-tags">
                            <Tag
                                v-for="role in data.roles"
                                :key="role.id"
                                :value="role.name"
                                severity="secondary"
                            />
                            <span v-if="!data.roles?.length" class="no-roles">
                                Sem papel
                            </span>
                        </div>
                    </template>
                </Column>

                <!-- Status -->
                <Column header="Status" style="width: 10%">
                    <template #body="{ data }">
                        <Tag
                            :value="data.is_active ? 'Ativo' : 'Inativo'"
                            :severity="data.is_active ? 'success' : 'danger'"
                        />
                    </template>
                </Column>

                <!-- Criado em -->
                <Column field="created_at" header="Criado em" sortable style="width: 14%" />

                <!-- Ações -->
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

                <!-- Empty -->
                <template #empty>
                    <div class="table-empty">
                        <i class="pi pi-users" />
                        <p>Nenhum usuário encontrado.</p>
                    </div>
                </template>

            </DataTable>
        </div>

        <!-- Dialog criar/editar -->
        <Dialog
            v-model:visible="dialogVisible"
            :header="editingUser ? 'Editar Usuário' : 'Novo Usuário'"
            modal
            :style="{ width: '480px' }"
            @hide="resetForm"
        >
            <div class="dialog-form">

                <div class="field">
                    <label>Nome *</label>
                    <InputText
                        v-model="form.name"
                        placeholder="Nome completo"
                        :invalid="!!errors.name"
                        fluid
                    />
                    <small class="field-error" v-if="errors.name">{{ errors.name }}</small>
                </div>

                <div class="field">
                    <label>E-mail *</label>
                    <InputText
                        v-model="form.email"
                        type="email"
                        placeholder="email@exemplo.com"
                        :invalid="!!errors.email"
                        fluid
                    />
                    <small class="field-error" v-if="errors.email">{{ errors.email }}</small>
                </div>

                <div class="field">
                    <label>{{ editingUser ? 'Nova senha (deixe em branco para manter)' : 'Senha *' }}</label>
                    <Password
                        v-model="form.password"
                        :placeholder="editingUser ? 'Nova senha' : 'Mínimo 8 caracteres'"
                        :feedback="false"
                        :invalid="!!errors.password"
                        toggleMask
                        fluid
                    />
                    <small class="field-error" v-if="errors.password">{{ errors.password }}</small>
                </div>

                <div class="field" v-if="form.password">
                    <label>Confirmar senha *</label>
                    <Password
                        v-model="form.password_confirmation"
                        placeholder="Repita a senha"
                        :feedback="false"
                        :invalid="!!errors.password_confirmation"
                        toggleMask
                        fluid
                    />
                    <small class="field-error" v-if="errors.password_confirmation">
                        {{ errors.password_confirmation }}
                    </small>
                </div>

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
                    :label="editingUser ? 'Salvar' : 'Criar'"
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
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import api from '@/api/axios'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'

const toast   = useToast()
const confirm = useConfirm()

// ─────────────────────────────────────
// State
// ─────────────────────────────────────
const users         = ref([])
const loading       = ref(false)
const saving        = ref(false)
const dialogVisible = ref(false)
const editingUser   = ref(null)
const errors        = ref({})

const defaultForm = {
    name:                  '',
    email:                 '',
    password:              '',
    password_confirmation: '',
    is_active:             true,
}

const form = ref({ ...defaultForm })

// ─────────────────────────────────────
// Carregar usuários
// ─────────────────────────────────────
const fetchUsers = async () => {
    loading.value = true
    try {
        const response = await api.get('/users')
        users.value = response.data.data ?? response.data
    } catch {
        toast.add({
            severity: 'error',
            summary:  'Erro',
            detail:   'Não foi possível carregar os usuários.',
            life:     3000,
        })
    } finally {
        loading.value = false
    }
}

// ─────────────────────────────────────
// Dialog
// ─────────────────────────────────────
const openDialog = (user = null) => {
    editingUser.value = user
    errors.value      = {}

    if (user) {
        form.value = {
            name:                  user.name,
            email:                 user.email,
            password:              '',
            password_confirmation: '',
            is_active:             user.is_active,
        }
    } else {
        form.value = { ...defaultForm }
    }

    dialogVisible.value = true
}

const resetForm = () => {
    form.value        = { ...defaultForm }
    editingUser.value = null
    errors.value      = {}
}

// ─────────────────────────────────────
// Criar / Editar
// ─────────────────────────────────────
const handleSubmit = async () => {
    saving.value = true
    errors.value = {}

    try {
        const payload = { ...form.value }

        // Remove campos de senha se estiver editando e não preencheu
        if (editingUser.value && !payload.password) {
            delete payload.password
            delete payload.password_confirmation
        }

        if (editingUser.value) {
            await api.put(`/users/${editingUser.value.id}`, payload)
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Usuário atualizado.', life: 3000 })
        } else {
            await api.post('/users', payload)
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Usuário criado.', life: 3000 })
        }

        dialogVisible.value = false
        fetchUsers()

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
const confirmDelete = (user) => {
    confirm.require({
        message: `Deseja remover o usuário "${user.name}"?`,
        header:  'Confirmar remoção',
        icon:    'pi pi-exclamation-triangle',
        acceptLabel: 'Sim, remover',
        rejectLabel: 'Cancelar',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await api.delete(`/users/${user.id}`)
                toast.add({ severity: 'success', summary: 'Removido', detail: 'Usuário removido.', life: 3000 })
                fetchUsers()
            } catch {
                toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível remover.', life: 3000 })
            }
        },
    })
}

onMounted(fetchUsers)
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1.5rem; }

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.page-title  { font-size: 1.5rem; font-weight: 700; }
.page-subtitle { color: var(--p-text-muted-color); margin-top: 0.25rem; font-size: 0.875rem; }

.card {
    background: var(--p-surface-card);
    border: 1px solid var(--p-surface-border);
    border-radius: 10px;
    padding: 1.25rem;
}

.roles-tags { display: flex; gap: 0.35rem; flex-wrap: wrap; }
.no-roles   { font-size: 0.8rem; color: var(--p-text-muted-color); }
.actions    { display: flex; gap: 0.25rem; }

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

.field { display: flex; flex-direction: column; gap: 0.4rem; }
.field label { font-weight: 500; font-size: 0.875rem; }
.field-error { color: var(--p-red-500); font-size: 0.8rem; }
</style>