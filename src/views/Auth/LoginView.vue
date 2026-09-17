<template>
    <div class="login-wrapper">
        <div class="login-card">

            <!-- Logo -->
            <div class="login-header">
                <div class="login-logo">💈</div>
                <h1 class="login-title">Salão Estoque</h1>
                <p class="login-subtitle">Entre com suas credenciais para continuar</p>
            </div>

            <!-- Formulário -->
            <form @submit.prevent="handleLogin" class="login-form">

                <div class="field">
                    <label for="email">E-mail</label>
                    <InputText
                        id="email"
                        v-model="form.email"
                        type="email"
                        placeholder="admin@salao.com"
                        :invalid="!!errors.email"
                        fluid
                        autocomplete="email"
                    />
                    <small class="field-error" v-if="errors.email">
                        {{ errors.email }}
                    </small>
                </div>

                <div class="field">
                    <label for="password">Senha</label>
                    <Password
                        id="password"
                        v-model="form.password"
                        placeholder="••••••••"
                        :feedback="false"
                        :invalid="!!errors.password"
                        toggleMask
                        fluid
                    />
                    <small class="field-error" v-if="errors.password">
                        {{ errors.password }}
                    </small>
                </div>

                <Button
                    type="submit"
                    label="Entrar"
                    icon="pi pi-sign-in"
                    :loading="loading"
                    fluid
                    class="mt-2"
                />

            </form>

        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'

const router  = useRouter()
const auth    = useAuthStore()
const toast   = useToast()
const loading = ref(false)
const errors  = ref({})

const form = ref({
    email:    '',
    password: '',
})

const handleLogin = async () => {
    loading.value = true
    errors.value  = {}

    try {
        await auth.login(form.value.email, form.value.password)
        router.push('/dashboard')
    } catch (error) {
        const data = error.response?.data

        if (error.response?.status === 422 && data?.errors) {
            errors.value = Object.fromEntries(
                Object.entries(data.errors).map(([k, v]) => [k, v[0]])
            )
        } else if (error.response?.status === 403) {
            toast.add({
                severity: 'warn',
                summary:  'Acesso negado',
                detail:   'Sua conta está desativada. Entre em contato com o administrador.',
                life:     5000,
            })
        } else {
            toast.add({
                severity: 'error',
                summary:  'Erro ao entrar',
                detail:   data?.message || 'Verifique suas credenciais e tente novamente.',
                life:     4000,
            })
        }
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.login-wrapper {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--p-surface-ground);
    padding: 1rem;
}

.login-card {
    width: 100%;
    max-width: 420px;
    background: var(--p-surface-card);
    border: 1px solid var(--p-surface-border);
    border-radius: 12px;
    padding: 2.5rem 2rem;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.login-header {
    text-align: center;
    margin-bottom: 2rem;
}

.login-logo {
    font-size: 3.5rem;
    margin-bottom: 0.75rem;
}

.login-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.35rem;
    color: var(--p-text-color);
}

.login-subtitle {
    color: var(--p-text-muted-color);
    font-size: 0.9rem;
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.field label {
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--p-text-color);
}

.field-error {
    color: var(--p-red-500);
    font-size: 0.8rem;
}

.mt-2 {
    margin-top: 0.5rem;
}
</style>