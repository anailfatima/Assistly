<template>
  <div class="min-h-screen bg-[#0f0f0f] font-sans text-gray-200 selection:bg-pink-500/30 relative overflow-hidden">
    <Background />
    <ToastContainer />
    <router-view class="relative z-10"></router-view>
  </div>
</template>

<script setup>
import Background from './components/Background.vue'
import ToastContainer from './components/ToastContainer.vue'
</script>

<style>
/* Global styles if any */
</style>
