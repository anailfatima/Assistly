<template>
  <div class="group relative space-y-2 w-full">
    <div class="flex justify-between items-center px-1">
      <label :for="id" class="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] group-focus-within:text-pink-400 transition-colors">
        {{ label }}
      </label>
      <span v-if="error" class="text-[9px] font-black text-pink-500 uppercase tracking-widest animate-pulse">Required_Field</span>
    </div>
    
    <div class="relative">
      <div v-if="icon" class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <component :is="icon" class="h-5 w-5 text-gray-500 group-focus-within:text-pink-400 transition-colors" />
      </div>
      
      <input 
        :id="id"
        :type="inputType"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :placeholder="placeholder"
        :required="required"
        :class="[
          'block w-full pr-4 py-3 bg-black/40 border rounded-2xl text-white placeholder-gray-700 focus:outline-none focus:ring-2 transition-all font-medium tracking-tight shadow-inner',
          icon ? 'pl-12' : 'pl-4',
          error 
            ? 'border-pink-500/50 focus:ring-pink-500/20 focus:border-pink-500' 
            : 'border-white/10 focus:ring-purple-500/20 focus:border-purple-500/50'
        ]"
      />

      <!-- Password Toggle -->
      <button 
        v-if="type === 'password'" 
        type="button"
        @click="showPassword = !showPassword"
        class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-600 hover:text-pink-400 transition-colors"
      >
        <Eye v-if="!showPassword" class="h-4 w-4" />
        <EyeOff v-else class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'

const props = defineProps({
  modelValue: String,
  label: String,
  placeholder: String,
  id: String,
  type: {
    type: String,
    default: 'text'
  },
  icon: Object,
  required: Boolean,
  error: Boolean
})

defineEmits(['update:modelValue'])

const showPassword = ref(false)
const inputType = computed(() => {
  if (props.type === 'password') {
    return showPassword.value ? 'text' : 'password'
  }
  return props.type
})
</script>
