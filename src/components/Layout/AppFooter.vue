<template>
    <footer class="app-footer">
        <span class="footer-company">
            <i class="pi pi-shop" /> Jack Penteados Shop
        </span>
        <span class="footer-divider">·</span>
        <span class="footer-dev">
            Desenvolvido por <strong>Barquinhos Software</strong>
        </span>
        <span class="footer-divider">·</span>
        <span class="footer-year">
            © {{ currentYear }}
        </span>
    </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>

<style scoped>
.app-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background: var(--p-surface-card);
    border-top: 1px solid var(--p-surface-border);
    font-size: 0.8rem;
    color: var(--p-text-muted-color);
    flex-wrap: wrap;
}

.footer-company {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-weight: 500;
}

.footer-dev strong {
    color: var(--p-text-color);
    font-weight: 600;
}

.footer-divider {
    opacity: 0.4;
}
</style>