<template>
    <div class="empty-view">
        <i class="pi pi-wrench" />
        <h2>Em construção</h2>
        <p>Esta página ainda está sendo desenvolvida.</p>
    </div>
</template>

<style scoped>
.empty-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 60vh;
    gap: 1rem;
    color: var(--p-text-muted-color);
}

.empty-view i {
    font-size: 3rem;
}

.empty-view h2 {
    font-size: 1.5rem;
    font-weight: 600;
}
</style>