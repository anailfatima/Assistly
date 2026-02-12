<template>
  <aside 
    class="fixed inset-y-0 left-0 bg-black/60 border-r border-white/5 w-72 transform transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-40 lg:relative lg:translate-x-0 backdrop-blur-3xl"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <!-- Accent line -->
    <div class="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-pink-500/30 to-transparent"></div>

    <div class="flex flex-col h-full relative z-10 px-6 py-10">
      <!-- Brand Section -->
      <div class="mb-12 group cursor-pointer">
        <div class="flex items-center space-x-4 mb-2">
          <div class="bg-gradient-to-br from-pink-600 to-purple-700 p-3 rounded-2xl shadow-[0_0_20px_rgba(255,20,147,0.4)] group-hover:shadow-[0_0_30px_rgba(255,20,147,0.6)] group-hover:scale-110 transition-all duration-500">
            <Cpu class="h-6 w-6 text-pink-400" />
          </div>
          <span class="text-2xl font-black tracking-tighter text-white">
            Assistly<span class="text-pink-500"> Support</span>
          </span>
        </div>
        <div class="h-0.5 w-12 bg-purple-400/50 rounded-full group-hover:w-20 transition-all duration-500"></div>
      </div>

      <!-- Navigation -->
      <div class="flex-1 space-y-8">
        <div>
          <p class="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em] mb-6 px-4">Main Menu</p>
          <nav class="space-y-3">
            <button 
              v-for="item in navItems" 
              :key="item.id"
              @click="$emit('update:activeTab', item.id); if (isMobile) $emit('close')"
              :class="[
                'flex items-center w-full px-5 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all duration-500 group relative overflow-hidden',
                activeTab === item.id 
                  ? 'text-pink-400 bg-white/5 border border-white/10 shadow-[inset_0_0_20px_rgba(255,20,147,0.05)]' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              ]"
            >
              <!-- Indicator for active tab -->
              <div v-if="activeTab === item.id" class="absolute left-0 top-0 bottom-0 w-1 bg-pink-400 shadow-[0_0_15px_rgba(255,20,147,0.8)]"></div>
              
              <component :is="item.icon" 
                class="h-5 w-5 mr-4 transition-all duration-500 group-hover:scale-125" 
                :class="activeTab === item.id ? 'text-pink-400 glow-pink' : 'text-gray-600 group-hover:text-purple-400'" 
              />
              {{ item.name }}
            </button>
          </nav>
        </div>


      </div>

      <!-- User footer -->
      <div class="pt-8 border-t border-white/5">
        <div class="bg-gradient-to-br from-white/5 to-transparent p-4 rounded-3xl border border-white/5 mb-6 group cursor-pointer hover:border-pink-500/30 transition-all">
          <div class="flex items-center space-x-3">
            <div class="h-10 w-10 rounded-xl bg-pink-900/40 border border-pink-500/30 flex items-center justify-center shadow-inner group-hover:glow-pink transition-all">
                <ShieldCheck class="h-5 w-5 text-pink-400" />
            </div>
            <div class="min-w-0">
                <p class="text-xs font-black text-white truncate tracking-tight uppercase">Administrator</p>
                <div class="flex items-center">
                    <div class="h-1.5 w-1.5 bg-green-500 rounded-full mr-2 shadow-[0_0_5px_rgba(0,255,0,0.8)]"></div>
                    <p class="text-[9px] font-bold text-gray-500 uppercase">Online</p>
                </div>
            </div>
          </div>
        </div>

        <button @click="$emit('logout')" class="flex items-center w-full px-5 py-3 text-[10px] font-black text-red-500 hover:text-red-400 transition-all uppercase tracking-[0.2em] group">
          <Power class="h-4 w-4 mr-3 group-hover:glow-pink group-hover:scale-110 transition-all" />
          Logout
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { Cpu, BarChart3, Files, History, Power, ShieldCheck } from 'lucide-vue-next'

defineProps({
  isOpen: Boolean,
  activeTab: String,
  isMobile: Boolean,
  navItems: Array
})

defineEmits(['update:activeTab', 'close', 'logout'])
</script>
