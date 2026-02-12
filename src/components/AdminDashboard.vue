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
                    <h3 class="text-xs font-black text-gray-500 uppercase tracking-[0.6em]">Chat History</h3>
                    <div class="h-8 w-[1px] bg-white/5"></div>
                    <div class="relative group flex-1 md:w-64">
                        <div class="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search class="h-4 w-4 text-gray-600 group-focus-within:text-pink-400 transition-colors" />
                        </div>
                        <input v-model="searchQuery" type="text" placeholder="Search logs..." class="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-pink-500/30 transition-all uppercase tracking-[0.2em]" />
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <button @click="fetchChatHistory" class="p-3 bg-white/5 rounded-2xl border border-white/5 text-gray-500 hover:text-white transition-all">
                        <RotateCcw class="h-4 w-4" :class="{'animate-spin': loading}" />
                    </button>
                    <button class="px-6 py-3 bg-white/5 rounded-2xl border border-white/5 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:border-pink-500/30 transition-all">Update History</button>
                </div>
             </div>

             <div class="grid grid-cols-1 gap-3">
                <div v-for="pair in filteredHistory" :key="pair.id" 
                    @click="openChatConversation(pair)"
                    class="bg-black/40 backdrop-blur-md p-5 rounded-[2rem] border border-white/5 flex items-center justify-between group hover:border-pink-500/30 hover:bg-white/[0.02] transition-all duration-300 cursor-pointer overflow-hidden relative"
                >
                    <div class="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-transparent to-pink-500/0 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    
                    <div class="flex items-center space-x-6 flex-1 min-w-0 relative z-10">
                        <!-- Compact Avatar -->
                        <div class="h-12 w-12 rounded-2xl bg-black border border-white/5 p-1 shrink-0 relative shadow-inner">
                            <div class="h-full w-full rounded-xl bg-gradient-to-br from-white/5 to-white/0 flex items-center justify-center font-black text-lg text-white group-hover:text-pink-400 transition-colors uppercase">
                                {{ pair.user?.name?.[0] || 'U' }}
                            </div>
                        </div>

                        <!-- User Info & Truncated Question -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center space-x-3 mb-1">
                                <p class="text-sm font-black text-white tracking-tighter uppercase group-hover:glow-pink transition-all truncate">
                                    {{ pair.user?.name || 'Anonymous' }}
                                </p>
                                <div class="h-1 w-1 rounded-full bg-gray-700"></div>
                                <span class="text-[9px] font-black text-gray-500 uppercase tracking-widest">{{ formatDate(pair.created_at) }}</span>
                            </div>
                            <p class="text-[11px] font-medium text-gray-500 truncate italic">
                                "{{ pair.question }}"
                            </p>
                        </div>
                    </div>

                    <!-- Action Arrow -->
                    <div class="flex items-center space-x-4 relative z-10 pl-6">
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
  Clock, Binary, ArrowUpRight, History, Layers, User, RotateCcw, X
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
    const pairs = []
    // Sort chronological ASC to find pairs
    const data = [...historyData.value].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    
    for (let i = 0; i < data.length; i++) {
        if (data[i].sender === 'user') {
            const pair = {
                id: data[i].id,
                user: data[i].user,
                user_id: data[i].user_id,
                question: data[i].message,
                answer: 'Awaiting intelligence response...',
                created_at: data[i].created_at
            }
            
            // Look for the immediate next bot response
            if (data[i+1] && data[i+1].sender === 'bot') {
                pair.answer = data[i+1].message
                i++ // Skip paired bot message
            }
            pairs.push(pair)
        }
    }
    return pairs.reverse() // Latest first
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
        const response = await fetch(`${apiUrl}/api/admin/chats`, {
            headers: { 'x-user-id': adminData.id }
        })
        const result = await response.json()
        if (result.success) {
            historyData.value = result.data
            chatCount.value = result.data.filter(c => c.sender === 'user').length
            showToast('History sync successful', 'success')
        }
    } catch (error) {
        showToast('Sync failed', 'error')
    } finally {
        loading.value = false
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
</style>
