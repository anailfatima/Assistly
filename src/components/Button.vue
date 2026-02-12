<template>
  <button 
    :type="type"
    :disabled="loading || disabled"
    class="relative w-full py-4 group/btn disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden rounded-2xl transition-all duration-300"
  >
    <!-- Background Gradient and Glow -->
    <div class="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 opacity-80 group-hover/btn:opacity-100 transition-opacity"></div>
    <div class="absolute inset-0 opacity-0 group-hover/btn:opacity-40 bg-white/20 transition-opacity duration-500"></div>
    
    <!-- Neon Pulse Border (Simulated) -->
    <div class="absolute inset-0 border border-white/20 rounded-2xl group-hover/btn:border-white/40 transition-colors"></div>

    <!-- Content -->
    <span class="relative z-10 flex items-center justify-center font-black tracking-[0.2em] text-[11px] uppercase text-white">
      <Loader2 v-if="loading" class="h-4 w-4 mr-3 animate-spin" />
      <slot v-else></slot>
    </span>

    <!-- Hover Glow Pulse -->
    <div class="absolute -inset-1 bg-pink-500/20 blur-xl opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none"></div>
  </button>
</template>

<script setup>
import { Loader2 } from 'lucide-vue-next'

defineProps({
  type: {
    type: String,
    default: 'button'
  },
  loading: Boolean,
  disabled: Boolean
})
</script>

<style scoped>
button {
  box-shadow: 0 0 20px rgba(255, 20, 147, 0.2);
}
button:not(:disabled):hover {
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.5);
  transform: translateY(-1px);
}
button:active:not(:disabled) {
  transform: translateY(1px) scale(0.98);
}
</style>
