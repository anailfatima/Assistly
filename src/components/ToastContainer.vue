<template>
  <div class="fixed top-6 right-6 z-[100] flex flex-col space-y-4 items-end pointer-events-none">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="pointer-events-auto min-w-[320px] max-w-md p-5 rounded-2xl border backdrop-blur-3xl shadow-2xl flex items-center space-x-4 animate-in slide-in-from-right-4 duration-500"
        :class="[
          toast.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400' 
            : 'bg-red-950/60 border-red-500/30 text-red-400'
        ]"
      >
        <div class="flex-shrink-0">
          <CheckCircle v-if="toast.type === 'success'" class="h-6 w-6" />
          <AlertCircle v-else class="h-6 w-6" />
        </div>
        <div class="flex-1">
          <p class="text-xs font-black uppercase tracking-widest">{{ toast.type === 'success' ? 'Success' : 'Error' }}</p>
          <p class="text-[13px] font-medium mt-1 leading-snug">{{ toast.message }}</p>
        </div>
        <button @click="removeToast(toast.id)" class="opacity-40 hover:opacity-100 transition-opacity p-1">
          <X class="h-4 w-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToast } from '../composables/useToast'
import { CheckCircle, AlertCircle, X } from 'lucide-vue-next'

const { toasts, removeToast } = useToast()
</script>

<style scoped>
.toast-enter-active, .toast-leave-active {
  transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.9);
}
.toast-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.toast-move {
  transition: transform 0.4s ease;
}
</style>
