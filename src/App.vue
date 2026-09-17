<template>
    <RouterView />
    <Toast position="top-right" />
    <ConfirmDialog />
</template>

<script setup>
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
</script>

<style>
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'Inter', sans-serif;
    background: var(--p-surface-ground);
    color: var(--p-text-color);
}

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--p-surface-ground); }
::-webkit-scrollbar-thumb { background: var(--p-surface-400); border-radius: 3px; }
</style>