<template>
  <div :class="['flex w-full group animate-in slide-in-from-bottom-2 duration-500', role === 'user' ? 'justify-end' : 'justify-start']">
    <div :class="['flex items-end max-w-[85%] sm:max-w-[75%]', role === 'user' ? 'flex-row-reverse' : 'flex-row']">
      
      <!-- Avatar Section -->
      <div v-if="role !== 'user'" class="flex-shrink-0 mb-2 mx-3">
        <div class="h-10 w-10 rounded-2xl bg-black border border-purple-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(138,43,226,0.2)] group-hover:shadow-[0_0_20px_rgba(138,43,226,0.4)] group-hover:scale-110 transition-all duration-300 relative group/avatar">
          <!-- Pulse ring -->
          <div class="absolute inset-0 rounded-2xl border border-pink-400/30 animate-pulse"></div>
          <Bot class="h-5 w-5 text-purple-400" />
        </div>
      </div>

      <!-- Bubble Container -->
      <div class="relative group/bubble">
        <div 
          :class="[
            'px-6 py-4 rounded-[2rem] transition-all duration-500 transform border',
            role === 'user' 
              ? 'bg-gradient-to-br from-pink-700/80 to-purple-900/80 text-white border-pink-500/50 rounded-br-none shadow-[0_0_20px_rgba(255,20,147,0.1)] group-hover/bubble:shadow-[0_0_30px_rgba(255,20,147,0.2)]' 
              : 'bg-white/5 backdrop-blur-md text-gray-200 border-white/10 rounded-bl-none shadow-[inset_0_0_15px_rgba(255,255,255,0.02)] group-hover/bubble:border-purple-500/30'
          ]"
        >
          <p class="text-[15px] font-medium leading-relaxed tracking-tight group-hover/bubble:translate-y-[-1px] transition-transform">
            {{ content }}
          </p>
        </div>
        
        <!-- Timestamp -->
        <div :class="['flex items-center mt-2 px-2 opacity-30 group-hover:opacity-60 transition-opacity', role === 'user' ? 'justify-end' : 'justify-start']">
            <span class="text-[9px] font-black uppercase tracking-widest text-gray-400">{{ time }}</span>
            <div v-if="role === 'user'" class="flex ml-2 space-x-0.5">
                <Check class="h-2.5 w-2.5 text-pink-400" />
                <Check class="h-2.5 w-2.5 text-pink-400" />
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Bot, Check } from 'lucide-vue-next'

defineProps({
  role: String,
  content: String,
  time: String
})
</script>
