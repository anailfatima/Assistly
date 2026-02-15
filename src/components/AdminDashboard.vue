<template>
  <div class="flex h-screen bg-transparent overflow-hidden font-sans selection:bg-pink-500/30">
    
    <Sidebar 
      :is-open="sidebarOpen" 
      :active-tab="activeTab" 
      :is-mobile="windowWidth < 1024"
      :nav-items="navItems"
      @update:activeTab="activeTab = $event"
      @close="sidebarOpen = false"
      @logout="handleLogout"
    />

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
      <!-- Glow ambient -->
      <div class="absolute top-0 right-1/4 w-[400px] h-[400px] bg-pink-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <!-- Header -->
      <header class="h-20 bg-black/40 backdrop-blur-xl px-10 flex items-center justify-between border-b border-white/5 sticky top-0 z-30">
        <div class="flex items-center">
          <button @click="sidebarOpen = true" class="lg:hidden mr-6 p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-pink-400 transition-all">
            <Menu class="h-6 w-6" />
          </button>
          <div>
            <h1 class="text-3xl font-black text-white tracking-tighter uppercase">{{ currentNav.name }}</h1>
            <div class="flex items-center mt-1">
                <span class="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em]">Operations Center</span>
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-6">
          <div class="hidden md:flex items-center px-4 py-2 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
            <Radio class="h-4 w-4 text-purple-400 mr-3 animate-pulse" />
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Administrator: {{ adminName }}</span>
          </div>

        </div>
      </header>

      <!-- Scrollable content -->
      <div class="flex-1 overflow-y-auto p-6 md:p-12 scrollbar-hide relative">
        <transition name="page-transition" mode="out-in">
          <!-- DASHBOARD -->
          <div v-if="activeTab === 'dashboard'" key="dashboard" class="max-w-6xl mx-auto space-y-12 pb-20">
            <!-- Neo Stat Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div v-for="stat in dynamicStats" :key="stat.label" class="bg-black/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all duration-700 group relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div class="flex justify-between items-start mb-8 relative z-10">
                  <div :class="['p-4 rounded-3xl border shadow-inner transition-all duration-500 group-hover:scale-110 group-hover:rotate-3', stat.bg]">
                    <component :is="stat.icon" :class="['h-7 w-7 transition-all duration-500', stat.color]" />
                  </div>

                </div>
                
                <div class="relative z-10">
                    <h4 class="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">{{ stat.label }}</h4>
                    <div class="flex items-baseline space-x-3">
                        <p class="text-4xl font-black text-white tracking-tighter group-hover:glow-pink transition-all duration-500">{{ stat.value }}</p>
                        <span v-if="stat.adminSuffix" class="text-[10px] font-black text-pink-500/60 uppercase tracking-widest">{{ stat.adminSuffix }}</span>
                    </div>
                    <p class="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">{{ stat.description }}</p>
                </div>

                <!-- Decorative corner glow -->
                <div :class="['absolute -bottom-10 -right-10 h-24 w-24 rounded-full blur-2xl opacity-10 group-hover:opacity-30 transition-opacity', stat.glowColor]"></div>
              </div>
            </div>

            <!-- Dashboard Highlights -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <!-- AI Performance Card -->
              <div class="lg:col-span-12 bg-gradient-to-br from-pink-900/40 to-purple-900/60 p-10 rounded-[3rem] border border-white/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between group">
                <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150"></div>
                
                <div class="relative z-10 mb-8 md:mb-0">
                    <div class="inline-flex items-center space-x-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md mb-6">
                        <div class="h-2 w-2 rounded-full bg-pink-400 shadow-[0_0_10px_rgba(255,20,147,1)]"></div>
                        <span class="text-[9px] font-black text-white uppercase tracking-widest">Knowledge Management Center</span>
                    </div>
                    <h3 class="text-3xl font-black text-white tracking-tighter mb-4 leading-none uppercase">Add information to improve<br>chatbot answers</h3>
                    <p class="text-gray-400 text-sm font-medium leading-relaxed max-w-xl mb-0 opacity-80">Keep your AI chatbot updated with the latest information. Upload company policies, product manuals, or common questions to ensure customers get accurate answers instantly.</p>
                </div>

                <div class="relative z-10 w-full md:w-auto">
                    <button 
                        @click="activeTab = 'upload'" 
                        class="btn-neon-pink px-12 py-5 text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center space-x-4 shadow-[0_0_40px_rgba(255,20,147,0.3)] min-w-[280px]"
                    >
                        <span>Manage Assets</span>
                        <ArrowUpRight class="h-4 w-4" />
                    </button>
                </div>
              </div>
            </div>
          </div>


          <!-- UPLOAD -->
          <div v-else-if="activeTab === 'upload'" key="upload" class="max-w-4xl mx-auto py-10">
            <DocumentUpload />
          </div>

          <!-- SUPPORT HISTORY -->
          <div v-else-if="activeTab === 'history'" key="history" class="max-w-5xl mx-auto space-y-8">
             <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div class="flex items-center space-x-6">
        <!-- Select All & Bulk Actions -->
        <div class="flex items-center space-x-4">
            <label class="flex items-center space-x-2 cursor-pointer group">
                <div class="relative">
                    <input type="checkbox" 
                        :checked="isAllSelected" 
                        @change="toggleSelectAll"
                        class="peer appearance-none h-4 w-4 border border-white/20 rounded bg-white/5 checked:bg-pink-500 checked:border-pink-500 transition-all cursor-pointer"
                    />
                    <Check class="h-3 w-3 text-black absolute top-0.5 left-0.5 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                </div>
                <span class="text-[9px] font-black text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">Select All</span>
            </label>

            <transition name="fade">
                <div v-if="selectedChats.length > 0" class="flex items-center space-x-2">
                    <button 
                        v-if="!isTrashView"
                        @click="promptBulkDelete"
                        class="flex items-center space-x-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-all"
                    >
                        <Trash2 class="h-3 w-3" />
                        <span class="text-[9px] font-black uppercase tracking-widest">Delete ({{ selectedChats.length }})</span>
                    </button>
                    
                    <template v-else>
                         <button 
                            @click="restoreSelectedChats"
                            class="flex items-center space-x-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 hover:bg-green-500 hover:text-white transition-all"
                        >
                            <RotateCcw class="h-3 w-3" />
                            <span class="text-[9px] font-black uppercase tracking-widest">Restore ({{ selectedChats.length }})</span>
                        </button>

                         <button 
                            @click="promptBulkDeletePermanent"
                            class="flex items-center space-x-2 px-3 py-1.5 bg-red-600/10 border border-red-600/20 rounded-lg text-red-500 hover:bg-red-600 hover:text-white transition-all"
                        >
                            <X class="h-3 w-3" />
                            <span class="text-[9px] font-black uppercase tracking-widest">Destroy ({{ selectedChats.length }})</span>
                        </button>
                    </template>
                </div>
            </transition>
        </div>

        <div class="h-8 w-[1px] bg-white/5 mx-4 hidden md:block"></div>

        <div class="relative group flex-1">
            <div class="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search class="h-4 w-4 text-gray-600 group-focus-within:text-pink-400 transition-colors" />
            </div>
            <input v-model="searchQuery" type="text" placeholder="Search logs..." class="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-pink-500/30 transition-all uppercase tracking-[0.2em]" />
        </div>
    </div>
    
    <div class="flex items-center space-x-4">
        <button 
            @click="toggleTrashView" 
            :class="['px-6 py-3 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all', isTrashView ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/5 text-gray-400 hover:border-pink-500/30']"
        >{{ isTrashView ? 'Back to Logs' : 'View Trash' }}</button>
        
        <button @click="fetchChatHistory" class="p-3 bg-white/5 rounded-2xl border border-white/5 text-gray-500 hover:text-white transition-all">
            <RotateCcw class="h-4 w-4" :class="{'animate-spin': loading}" />
        </button>
    </div>
</div>

             <div class="grid grid-cols-1 gap-3">
                <div v-for="pair in filteredHistory" :key="pair.id" 
                    @click="openChatConversation(pair)"
                    class="bg-black/40 backdrop-blur-md p-5 rounded-[2rem] border border-white/5 flex items-center justify-between group hover:border-pink-500/30 hover:bg-white/[0.02] transition-all duration-300 cursor-pointer overflow-hidden relative"
                >
                    <div class="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-transparent to-pink-500/0 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    
                    <!-- Selection Checkbox -->
                    <div @click.stop class="relative mr-4 z-20">
                         <input type="checkbox" 
                            :value="pair.id"
                            v-model="selectedChats"
                            class="peer appearance-none h-5 w-5 border border-white/20 rounded-lg bg-black/50 checked:bg-pink-500 checked:border-pink-500 transition-all cursor-pointer"
                        />
                        <Check class="h-3.5 w-3.5 text-black absolute top-1 left-0.5 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                    </div>

                    <div class="flex items-center space-x-6 flex-1 min-w-0 relative z-10">
                        <!-- Compact Avatar -->
                        <div class="h-12 w-12 rounded-2xl bg-black border border-white/5 p-1 shrink-0 relative shadow-inner">
                            <div class="h-full w-full rounded-xl bg-gradient-to-br from-white/5 to-white/0 flex items-center justify-center font-black text-lg text-white group-hover:text-pink-400 transition-colors uppercase">
                                {{ pair.user?.name?.[0] || 'U' }}
                            </div>
                        </div>

                        <!-- User Info & Truncated Question -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center space-x-3 mb-0.5">
                                <p class="text-sm font-black text-white tracking-tighter uppercase group-hover:glow-pink transition-all truncate">
                                    {{ pair.user?.name || 'Anonymous' }}
                                </p>
                                <div class="h-1 w-1 rounded-full bg-gray-700"></div>
                                <span class="text-[9px] font-black text-gray-500 uppercase tracking-widest">{{ formatDate(pair.created_at) }}</span>
                            </div>
                            <p class="text-[10px] text-gray-400 font-bold mb-1.5 truncate tracking-wide" v-if="pair.user?.email">
                                {{ pair.user.email }}
                            </p>
                            <p class="text-[11px] font-medium text-gray-500 truncate italic">
                                "{{ pair.question }}"
                            </p>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex items-center space-x-3 relative z-10 pl-4">
                        <button 
                            @click="(e) => promptDeleteChat(e, pair)"
                            class="h-10 w-10 btn-glass-danger rounded-xl flex items-center justify-center text-red-400 hover:text-white transition-all shadow-lg group/delete"
                            title="Delete History"
                        >
                            <Trash class="h-4 w-4 transform group-hover/delete:scale-110 transition-transform" />
                        </button>
                        
                        <button 
                            v-if="isTrashView"
                            @click.stop="restoreSingleChat(pair)"
                             class="h-10 w-10 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center text-green-400 hover:text-white hover:bg-green-500 transition-all shadow-lg group/restore ml-2"
                             title="Restore"
                        >
                            <RotateCcw class="h-4 w-4 transform group-hover/restore:-rotate-180 transition-transform" />
                        </button>

                        <div class="h-10 w-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-600 group-hover:text-pink-400 group-hover:border-pink-500/30 group-hover:bg-pink-500/5 transition-all shadow-xl">
                            <ChevronRight class="h-5 w-5 transform group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </div>
                </div>
                
                <div v-if="filteredHistory.length === 0" class="col-span-full py-24 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30">
                   <Layers class="h-12 w-12 text-gray-400 mx-auto mb-6" />
                   <p class="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em]">No Discussion History</p>
                </div>
             </div>

             <!-- Delete Confirmation Modal -->
             <transition name="fade">
                <div v-if="showDeleteModal" class="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                    <div class="bg-[#080808] border border-red-500/30 w-full max-w-sm rounded-[2rem] p-8 shadow-[0_0_50px_rgba(220,38,38,0.2)] relative overflow-hidden">
                        <div class="absolute inset-0 bg-red-500/5 pointer-events-none"></div>
                        
                        <div class="relative z-10 text-center">
                            <div class="h-16 w-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                                <Trash class="h-8 w-8 text-red-500" />
                            </div>
                            
                            <h3 class="text-xl font-black text-white uppercase tracking-tight mb-2">Delete {{ deleteTargetId ? 'Chat' : selectedChats.length + ' Chats' }}?</h3>
                            <p class="text-gray-400 text-xs font-medium leading-relaxed mb-8">
                                {{ isTrashView 
                                    ? "This action cannot be undone. These records will be PERMANENTLY destroyed." 
                                    : "This will move the selected chats to the trash. You can restore them later." 
                                }}
                            </p>
                            
                            <div class="grid grid-cols-2 gap-4">
                                <button 
                                    @click="showDeleteModal = false"
                                    class="py-3 rounded-xl border border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    @click="confirmDeleteChat"
                                    class="py-3 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20 hover:bg-red-500 hover:shadow-red-500/40 hover:-translate-y-0.5 transition-all"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
             </transition>
          </div>
        </transition>

        <!-- Chat Conversation Modal -->
        <transition name="fade">
            <div v-if="showChatModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                <div class="bg-[#080808] border border-white/10 w-full max-w-2xl rounded-[3.5rem] p-10 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden h-[80vh] flex flex-col">
                    <div class="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                        <History class="h-64 w-64 text-pink-400" />
                    </div>

                    <div class="relative z-10 flex justify-between items-center mb-10 shrink-0">
                        <div class="flex items-center space-x-6">
                            <div class="h-14 w-14 rounded-2xl bg-gradient-to-br from-pink-600 to-purple-700 flex items-center justify-center font-black text-xl text-white shadow-xl">
                                {{ selectedChatUser?.name?.[0] || 'U' }}
                            </div>
                            <div>
                                <h3 class="text-2xl font-black text-white tracking-tighter uppercase">{{ selectedChatUser?.name }}</h3>
                                <p class="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] mt-1">Full Interaction Log</p>
                            </div>
                        </div>
                        <button @click="showChatModal = false" class="p-4 bg-white/5 rounded-2xl border border-white/10 text-gray-500 hover:text-white transition-all">
                            <X class="h-6 w-6" />
                        </button>
                    </div>

                    <div class="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar scroll-smooth">
                        <div v-for="msg in selectedChatUser?.messages" :key="msg.id" 
                            :class="['flex', msg.sender === 'user' ? 'justify-end' : 'justify-start']"
                        >
                            <div :class="[
                                'max-w-[80%] p-6 rounded-[2rem] text-sm leading-relaxed shadow-xl',
                                msg.sender === 'user' 
                                    ? 'bg-gradient-to-br from-pink-600 to-purple-700 text-white rounded-tr-none' 
                                    : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none'
                            ]">
                                <p class="font-medium">{{ msg.message }}</p>
                                <p :class="['text-[8px] font-black uppercase tracking-widest mt-3 opacity-50', msg.sender === 'user' ? 'text-white' : 'text-pink-400']">
                                    {{ formatDate(msg.created_at) }} • {{ msg.sender === 'user' ? 'Customer' : 'Bot' }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="mt-8 pt-8 border-t border-white/5 shrink-0 flex justify-center">
                        <p class="text-[9px] font-black text-gray-600 uppercase tracking-[0.6em]">End of Transcript</p>
                    </div>
                </div>
            </div>
        </transition>
      </div>
    </main>

    <!-- Overlay for mobile sidebar -->
    <div 
        v-if="sidebarOpen" 
        @click="sidebarOpen = false" 
        class="fixed inset-0 bg-[#0f0f0f]/80 backdrop-blur-md z-[35] lg:hidden transition-opacity duration-700"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Menu, Bell, Zap, Activity, ChevronRight, 
  Users, Search, Sliders, Cpu, Radio, 
  Clock, Binary, ArrowUpRight, History, Layers, User, RotateCcw, X, Trash, Check, Trash2
} from 'lucide-vue-next'
import Sidebar from './Sidebar.vue'
import DocumentUpload from './DocumentUpload.vue'
import { useToast } from '../composables/useToast'

const { showToast } = useToast()
const router = useRouter()
const sidebarOpen = ref(false)
const activeTab = ref('dashboard')
const windowWidth = ref(window.innerWidth)
const loading = ref(false)
const searchQuery = ref('')

const adminData = JSON.parse(localStorage.getItem('assistly_user') || '{}')
const adminName = ref(adminData.name || 'Admin')

const navItems = [
  { id: 'dashboard', name: 'Dashboard', icon: Cpu },
  { id: 'upload', name: 'Knowledge Base', icon: Binary },
  { id: 'history', name: 'Support History', icon: History }
]

const currentNav = computed(() => navItems.find(item => item.id === activeTab.value))

const docsCount = ref(0)
const chatCount = ref(0)
const usersCount = ref(0)
const adminCount = ref(0)
const historyData = ref([])
const selectedChatUser = ref(null)
const showChatModal = ref(false)
const showDeleteType = ref(null) // 'chat' or others if needed
const showDeleteModal = ref(false)
const deleteTargetId = ref(null)
const selectedChats = ref([])
const isTrashView = ref(false)
const isDeletingPermanently = ref(false)

const isAllSelected = computed(() => {
    return filteredHistory.value.length > 0 && selectedChats.value.length === filteredHistory.value.length
})

const toggleTrashView = () => {
    isTrashView.value = !isTrashView.value
    fetchChatHistory()
}

const toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedChats.value = []
    } else {
        selectedChats.value = filteredHistory.value.map(c => c.id)
    }
}

const dynamicStats = computed(() => [
  { 
    label: 'Registered Users', 
    value: usersCount.value.toString(), 
    adminSuffix: `(Admin: ${adminCount.value})`,
    trend: 'LIVE', 
    icon: Users, 
    color: 'text-pink-400', 
    bg: 'bg-pink-900/40 border-pink-500/30', 
    glowColor: 'bg-pink-500',
    description: 'Total number of registered customers'
  },
  { 
    label: 'Knowledge Base', 
    value: (docsCount.value).toString(), 
    trend: 'NEW', 
    icon: Zap, 
    color: 'text-purple-400', 
    bg: 'bg-purple-900/40 border-purple-500/30', 
    glowColor: 'bg-purple-500',
    description: 'Files and FAQs used by the AI'
  },
  { 
    label: 'Chat Interactions', 
    value: chatCount.value.toString(), 
    trend: 'LIVE', 
    icon: History, 
    color: 'text-green-400', 
    bg: 'bg-green-900/40 border-green-500/30', 
    glowColor: 'bg-green-500',
    description: 'Total questions asked by users'
  }
])

const historyPairs = computed(() => {
    // Group by user_id, assuming historyData is sorted DESC by backend (latest first)
    const uniqueUsers = []
    const seenUserIds = new Set()
    
    for (const chat of historyData.value) {
        if (chat.user_id && !seenUserIds.has(chat.user_id)) {
            seenUserIds.add(chat.user_id)
            uniqueUsers.push({
                id: chat.id,
                user: chat.user,
                user_id: chat.user_id,
                question: chat.message, // Using message as question/preview
                answer: '', 
                created_at: chat.created_at
            })
        }
    }
    return uniqueUsers
})

const filteredHistory = computed(() => {
  const pairs = historyPairs.value
  if (!searchQuery.value) return pairs
  const query = searchQuery.value.toLowerCase()
  return pairs.filter(pair => 
    pair.user?.name?.toLowerCase().includes(query) || 
    pair.question.toLowerCase().includes(query) ||
    pair.answer.toLowerCase().includes(query)
  )
})

const fetchDashboardStats = async () => {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const userId = adminData.id

        // Fetch overall stats
        const statsRes = await fetch(`${apiUrl}/api/admin/stats`, {
            headers: { 'x-user-id': userId }
        })
        const statsResult = await statsRes.json()
        if (statsResult.success) {
            usersCount.value = statsResult.data.totalUsers
            adminCount.value = statsResult.data.adminCount
            docsCount.value = statsResult.data.totalDocs + statsResult.data.totalFaqs
            chatCount.value = statsResult.data.totalChats
        }

        // Fetch chats for history preview
        const chatsRes = await fetch(`${apiUrl}/api/admin/chats`, {
            headers: { 'x-user-id': userId }
        })
        const chatsResult = await chatsRes.json()
        if (chatsResult.success) {
            historyData.value = chatsResult.data
        }
    } catch (error) {
        console.error('Stats fetch error:', error)
    }
}


const fetchChatHistory = async () => {
    loading.value = true
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const queryParams = isTrashView.value ? '?include_deleted=true' : ''

        const response = await fetch(`${apiUrl}/api/admin/chats${queryParams}`, {
            headers: { 'x-user-id': adminData.id }
        })
        const result = await response.json()
        if (result.success) {
            // If in trash view, we likely only want to see is_removed=true items
            if (isTrashView.value) {
                historyData.value = result.data.filter(c => c.is_removed)
            } else {
                historyData.value = result.data.filter(c => !c.is_removed) // Should already be filtered by backend default, but safe to add
            }
            
            chatCount.value = result.data.filter(c => c.sender === 'user').length
            showToast('History sync successful', 'success')
        }
    } catch (error) {
        showToast('Sync failed', 'error')
    } finally {
        loading.value = false
        selectedChats.value = [] // clear selection on view switch
    }
}

const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const openChatConversation = (chat) => {
    const userId = chat.user_id
    if (!userId) {
        showToast('Cannot identify user for this chat', 'error')
        return
    }
    
    // Group all messages for this user
    const userMessages = historyData.value
        .filter(c => c.user_id === userId)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    
    selectedChatUser.value = {
        name: chat.user?.name || 'Anonymous',
        messages: userMessages
    }
    showChatModal.value = true
}

const handleLogout = () => {
    localStorage.removeItem('assistly_user')
    localStorage.removeItem('assistly_token')
    router.push('/login')
}

const updateWidth = () => windowWidth.value = window.innerWidth

const promptDeleteChat = (e, chat) => {
    e.stopPropagation() 
    deleteTargetId.value = chat.id 
    isDeletingPermanently.value = isTrashView.value // If in trash, delete button implies permanent
    showDeleteModal.value = true
}

const promptBulkDelete = () => {
    deleteTargetId.value = null 
    isDeletingPermanently.value = false
    showDeleteModal.value = true
}

const promptBulkDeletePermanent = () => {
    deleteTargetId.value = null
    isDeletingPermanently.value = true // Explicit permanent delete
    showDeleteModal.value = true
}

const confirmDeleteChat = async () => {
    const idsToDelete = deleteTargetId.value ? [deleteTargetId.value] : selectedChats.value
    if (idsToDelete.length === 0) return
    
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        
        // Determine endpoint based on mode
        const endpoint = isDeletingPermanently.value 
            ? `${apiUrl}/api/admin/chats/delete-permanent`
            : `${apiUrl}/api/admin/chats/delete`

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 
                'x-user-id': adminData.id,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ chatIds: idsToDelete })
        })
        
        const result = await response.json()
        
        if (result.success) {
            historyData.value = historyData.value.filter(c => !idsToDelete.includes(c.id))
            showToast(isDeletingPermanently.value ? 'Chats permanently destroyed' : 'Chats moved to trash', 'success')
            selectedChats.value = [] 
            fetchDashboardStats() 
        } else {
            showToast(result.message || 'Delete failed', 'error')
        }
    } catch (error) {
        showToast('Delete operation error', 'error')
        console.error(error)
    } finally {
        showDeleteModal.value = false
        deleteTargetId.value = null
        isDeletingPermanently.value = false
    }
}

const restoreSelectedChats = async () => {
    if (selectedChats.value.length === 0) return
    
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const response = await fetch(`${apiUrl}/api/admin/chats/restore`, {
             method: 'POST',
            headers: { 
                'x-user-id': adminData.id,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ chatIds: selectedChats.value })
        })
        const result = await response.json()
        
        if (result.success) {
            historyData.value = historyData.value.filter(c => !selectedChats.value.includes(c.id))
            selectedChats.value = []
            showToast('Chats restored to main list', 'success')
            fetchDashboardStats()
        }
    } catch (error) {
        showToast('Restore error', 'error')
    }
}

const restoreSingleChat = async (chat) => {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const response = await fetch(`${apiUrl}/api/admin/chats/restore`, {
             method: 'POST',
            headers: { 
                'x-user-id': adminData.id,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ chatIds: [chat.id] })
        })
        const result = await response.json()
        
        if (result.success) {
            historyData.value = historyData.value.filter(c => c.id !== chat.id)
            showToast('Chat restored', 'success')
        }
    } catch (error) {
         showToast('Restore error', 'error')
    }
}

onMounted(() => {
    window.addEventListener('resize', updateWidth)
    fetchDashboardStats()
})

onUnmounted(() => window.removeEventListener('resize', updateWidth))
</script>

<style scoped>
.page-transition-enter-active, .page-transition-leave-active { transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1); }
.page-transition-enter-from { opacity: 0; transform: translateY(10px) scale(0.98); }
.page-transition-leave-to { opacity: 0; transform: translateY(-10px) scale(0.98); }

.btn-neon-pink {
    background: linear-gradient(135deg, #db2777 0%, #9333ea 100%);
    border-radius: 1.5rem;
    color: white;
    transition: all 0.5s;
    border: 1px solid rgba(255, 255, 255, 0.1);
}
.btn-neon-pink:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 30px rgba(219, 39, 119, 0.5);
}

.glow-pink {
    text-shadow: 0 0 10px rgba(219, 39, 119, 0.8);
}

.btn-glass-danger {
    background: rgba(220, 38, 38, 0.1);
    border: 1px solid rgba(220, 38, 38, 0.2);
}
.btn-glass-danger:hover {
    background: rgba(220, 38, 38, 0.2);
    border-color: rgba(220, 38, 38, 0.4);
    box-shadow: 0 0 15px rgba(220, 38, 38, 0.2);
}
</style>
