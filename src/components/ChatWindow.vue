<template>
  <div class="h-screen bg-transparent flex items-center justify-center lg:p-12 overflow-hidden selection:bg-pink-500/30">

    <!-- Main Chat Container -->
    <div class="w-full h-full max-w-5xl relative flex flex-col bg-black/60 backdrop-blur-3xl lg:rounded-[3rem] border border-white/5 shadow-[0_0_50px_rgba(0,0,0,1)] overflow-hidden">
      
      <!-- Professional Header -->
      <header class="relative px-10 py-8 bg-black/40 border-b border-white/5 flex items-center justify-between z-30 group">
        <!-- Accent Glow -->
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-500 via-purple-500 to-green-600 shadow-[0_0_20px_rgba(255,20,147,0.5)]"></div>

        <div class="relative z-10 flex items-center space-x-6">
          <div class="relative">
            <div class="h-16 w-16 rounded-2xl bg-black border border-pink-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(255,20,147,0.2)] group-hover:scale-105 transition-all duration-500 overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-t from-pink-900/40 to-transparent"></div>
                <Bot class="h-8 w-8 text-pink-400 relative z-10" />
            </div>
            <div class="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-4 border-black shadow-[0_0_10px_rgba(0,170,68,0.8)]"></div>
          </div>
          <div>
            <h2 class="text-2xl font-black text-white tracking-tighter uppercase flex items-center">
                Assistly<span class="text-pink-400"> Support</span>
            </h2>
            <div class="flex items-center space-x-2 mt-1">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Always Active</span>
            </div>
          </div>
        </div>

        <div class="relative z-10 flex items-center space-x-4">
            
            <!-- Selection Controls -->
            <div v-if="isSelectionMode" class="flex items-center space-x-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" class="appearance-none h-4 w-4 border border-white/20 rounded bg-white/5 checked:bg-pink-500 checked:border-pink-500 transition-all" />
                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">All</span>
                </label>
                
                <button 
                    v-if="!isTrashView"
                    @click="deleteSelectedMessages" 
                    :disabled="selectedMessages.length === 0"
                    class="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all text-[10px] font-black uppercase tracking-widest flex items-center space-x-2"
                >
                    <Trash2 class="h-3 w-3" />
                    <span>Delete ({{ selectedMessages.length }})</span>
                </button>

                <button 
                    v-else
                    @click="restoreSelectedMessages" 
                    :disabled="selectedMessages.length === 0"
                    class="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 hover:bg-green-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all text-[10px] font-black uppercase tracking-widest flex items-center space-x-2"
                >
                    <RotateCcw class="h-3 w-3" />
                    <span>Restore ({{ selectedMessages.length }})</span>
                </button>

                 <button 
                    v-if="isTrashView"
                    @click="deletePermanently" 
                    :disabled="selectedMessages.length === 0"
                    class="px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-xl text-red-500 hover:bg-red-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all text-[10px] font-black uppercase tracking-widest flex items-center space-x-2"
                >
                    <X class="h-3 w-3" />
                    <span>Destroy ({{ selectedMessages.length }})</span>
                </button>
                
                <button @click="isSelectionMode = false; selectedMessages = []" class="text-gray-500 hover:text-white transition-colors">
                    <X class="h-5 w-5" />
                </button>
            </div>

            <div v-else class="flex items-center space-x-3">
                 <!-- Trash Toggle -->
                <button 
                    @click="toggleTrashView" 
                    :class="['p-4 rounded-2xl transition-all border group relative', isTrashView ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 text-gray-500 hover:text-red-400 hover:bg-white/10 border-white/5 hover:border-red-500/30']"
                >
                    <Trash2 class="h-5 w-5" />
                    <span class="absolute top-14 right-0 bg-black text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                        {{ isTrashView ? 'Back to Chat' : 'View Trash' }}
                    </span>
                </button>

                <button @click="isSelectionMode = true" class="p-4 bg-white/5 rounded-2xl text-gray-500 hover:text-pink-400 hover:bg-white/10 transition-all border border-white/5 hover:border-pink-500/30 group relative">
                    <CheckSquare class="h-5 w-5" />
                    <span class="absolute top-14 right-0 bg-black text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Manage Chats</span>
                </button>

                <button @click="handleLogout" class="p-4 bg-white/5 rounded-2xl text-gray-500 hover:text-pink-400 hover:bg-white/10 transition-all border border-white/5 hover:border-pink-500/30">
                    <LogOut class="h-5 w-5" />
                </button>
            </div>
        </div>
      </header>

      <!-- Chat Messages Area -->
      <div 
        ref="chatContainer"
        class="flex-1 overflow-y-auto bg-black/20 pb-40 scrollbar-hide flex flex-col pt-6"
      >
        <div class="px-8 md:px-16 space-y-8 flex-1">
            <div v-for="(msg, index) in messages" :key="msg.id || index" class="group/item flex items-start w-full relative">
                
                <!-- Checkbox Overlay/Side -->
                <div v-if="isSelectionMode" class="mr-4 mt-4 animate-in fade-in slide-in-from-left-2 duration-300">
                    <input 
                        type="checkbox" 
                        :value="msg.id" 
                        v-model="selectedMessages"
                        class="appearance-none h-5 w-5 border border-white/20 rounded-lg bg-black/50 checked:bg-pink-500 checked:border-pink-500 transition-all cursor-pointer"
                    />
                </div>

                <ChatBubble 
                    v-bind="msg" 
                    :class="['flex-1 min-w-0 transition-opacity duration-300', msg.is_removed ? 'opacity-50 grayscale' : '']"
                />
            </div>
            
            <div v-if="isTrashView && messages.length === 0" class="flex flex-col items-center justify-center h-48 opacity-50 space-y-4">
                <Trash2 class="h-12 w-12 text-gray-500" />
                <p class="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Trash is empty</p>
            </div>

            <!-- Typing Indicator -->
            <transition name="fade">
              <div v-if="isTyping" class="flex justify-start animate-in slide-in-from-left-2 duration-300">
                <div class="bg-white/5 border border-white/10 rounded-3xl px-8 py-6 rounded-tl-none relative group overflow-hidden">
                    <div class="absolute top-0 left-0 w-1 h-full bg-pink-400 animate-pulse"></div>
                    <div class="flex items-center space-x-3">
                        <span class="text-[10px] font-black text-pink-400 uppercase tracking-widest">Assistly is thinking</span>
                        <div class="flex space-x-1.5">
                            <div class="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div class="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div class="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                </div>
              </div>
            </transition>
        </div>
      </div>

      <!-- Chat Input Area -->
      <div class="absolute bottom-10 left-10 right-10 z-20">
        <div class="bg-black/80 backdrop-blur-3xl p-3 rounded-[2.5rem] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,1)] focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/40 transition-all duration-200 relative overflow-hidden group">
            <div class="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
            
            <form @submit.prevent="sendMessage" class="flex items-center space-x-4 relative z-10 px-4">
                <input 
                    type="text" 
                    v-model="inputMsg" 
                    placeholder="Type your message..." 
                    class="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder-gray-600 py-4 text-[15px] font-medium"
                />

                <button 
                    type="submit" 
                    :disabled="!inputMsg.trim()"
                    class="btn-neon-pink !px-8 !py-4 shadow-[0_0_30px_rgba(255,20,147,0.3)] hover:shadow-[0_0_40px_rgba(255,20,147,0.5)] !rounded-2xl flex items-center space-x-3 group-disabled:opacity-50"
                >
                    <span class="text-[11px] font-bold uppercase tracking-widest">Send</span>
                    <Send class="h-4 w-4" />
                </button>
            </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import { Bot, Send, LogOut, CheckSquare, Trash2, X, RotateCcw } from 'lucide-vue-next'
import ChatBubble from './ChatBubble.vue'
import { useToast } from '../composables/useToast'
import { useRouter } from 'vue-router'

const { showToast } = useToast()
const router = useRouter()
const inputMsg = ref('')
const isTyping = ref(false)
const chatContainer = ref(null)
const isSelectionMode = ref(false)
const selectedMessages = ref([])

const userData = JSON.parse(localStorage.getItem('assistly_user') || '{}')
const messages = ref([])

const isTrashView = ref(false)

const isAllSelected = computed(() => {
    return messages.value.length > 0 && selectedMessages.value.length === messages.value.length
})

const toggleTrashView = () => {
    isTrashView.value = !isTrashView.value
    isSelectionMode.value = false
    selectedMessages.value = []
    fetchHistory()
}

const toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedMessages.value = []
    } else {
        selectedMessages.value = messages.value.map(m => m.id).filter(id => id) // Only select messages with IDs
    }
}

const deleteSelectedMessages = async () => {
    if (selectedMessages.value.length === 0) return
    
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        
        const response = await fetch(`${apiUrl}/api/chat/delete`, {
            method: 'POST',
            headers: { 
                'x-user-id': userData.id,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ chatIds: selectedMessages.value })
        })
        
        const result = await response.json()
        
        if (result.success) {
            messages.value = messages.value.filter(m => !selectedMessages.value.includes(m.id))
            selectedMessages.value = []
            isSelectionMode.value = false
            showToast('Messages moved to trash', 'success')
        } else {
            showToast(result.message || 'Delete failed', 'error')
        }
    } catch (error) {
        showToast('Delete error', 'error')
    }
}

const restoreSelectedMessages = async () => {
    if (selectedMessages.value.length === 0) return
    
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        
        const response = await fetch(`${apiUrl}/api/chat/restore`, {
            method: 'POST',
            headers: { 
                'x-user-id': userData.id,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ chatIds: selectedMessages.value })
        })
        
        const result = await response.json()
        
        if (result.success) {
             // Remove from trash view immediately
            messages.value = messages.value.filter(m => !selectedMessages.value.includes(m.id))
            selectedMessages.value = []
            isSelectionMode.value = false
            showToast('Messages restored', 'success')
        } else {
            showToast(result.message || 'Restore failed', 'error')
        }
    } catch (error) {
        showToast('Restore error', 'error')
    }
}

const deletePermanently = async () => {
    if (selectedMessages.value.length === 0) return
    
    if (!confirm('Are you sure? This cannot be undone.')) return

    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        
        const response = await fetch(`${apiUrl}/api/chat/delete-permanent`, {
            method: 'POST',
            headers: { 
                'x-user-id': userData.id,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ chatIds: selectedMessages.value })
        })
        
        const result = await response.json()
        
        if (result.success) {
            messages.value = messages.value.filter(m => !selectedMessages.value.includes(m.id))
            selectedMessages.value = []
            isSelectionMode.value = false
            showToast('Messages permanently destroyed', 'success')
        } else {
            showToast(result.message || 'Destroy failed', 'error')
        }
    } catch (error) {
        showToast('Destroy error', 'error')
    }
}

const fetchHistory = async () => {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        
        // Pass the include_deleted param if in Trash View
        const queryParams = isTrashView.value ? '?include_deleted=true' : ''

        const response = await fetch(`${apiUrl}/api/history${queryParams}`, {
            headers: { 
                'x-user-id': userData.id,
                'Content-Type': 'application/json'
            }
        })
        const result = await response.json()
        if (result.success) {
            // Filter client-side if needed to be absolutely sure what we show
            // Note: backend should handle 'include_deleted' logic
            let fetchedMessages = result.data.map(m => ({
                id: m.id,
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.message,
                time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                is_removed: m.is_removed
            }))

            // If we are in "Trash View", we only want to see the removed items ideally,
            // OR if the backend returns EVERYTHING when include_deleted=true, we filter here.
            // Let's assume the user wants check "Trash" = "Only Trash".
            // The backend returns is_removed=false usually. 
            // If include_deleted=true, querying standard behavior usually implies getting ALL history including deleted.
            // Let's filter on the frontend for "Trash view" vs "Normal view" to be explicit.
            
            if (isTrashView.value) {
                messages.value = fetchedMessages.filter(m => m.is_removed)
            } else {
                messages.value = fetchedMessages
            }
            
            scrollToBottom()
        }
    } catch (error) {
        console.error('Failed to fetch history:', error)
    }
}

const scrollToBottom = async () => {
    await nextTick()
    if (chatContainer.value) {
        chatContainer.value.scrollTo({
            top: chatContainer.value.scrollHeight,
            behavior: 'smooth'
        })
    }
}

const getTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const sendMessage = async () => {
    if (!inputMsg.value.trim() || isTyping.value) return
    
    const userMsgText = inputMsg.value
    // Optimistic Update (Temporary ID until confirmed)
    const tempId = 'temp-' + Date.now()
    messages.value.push({
        id: tempId,
        role: 'user',
        content: userMsgText,
        time: getTime()
    })
    
    inputMsg.value = ''
    scrollToBottom()
    
    isTyping.value = true
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const response = await fetch(`${apiUrl}/api/chat`, {
            method: 'POST',
            headers: { 
                'x-user-id': userData.id,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: userMsgText,
                user_id: userData.id
            })
        })

        const result = await response.json()
        
        if (result.success) {
            // Update temp ID with real ID if needed
            const lastUserMsg = messages.value.find(m => m.id === tempId)
            if (lastUserMsg && result.data.userMessageId) {
                lastUserMsg.id = result.data.userMessageId
            }

            messages.value.push({
                id: result.data.id,
                role: 'assistant',
                content: result.data.message,
                time: getTime()
            })
        } else {
            showToast(result.message || 'Unable to get response from AI', 'error')
        }
    } catch (error) {
        showToast('Network error: Unable to connect to server', 'error')
    } finally {
        isTyping.value = false
        scrollToBottom()
    }
}

const handleLogout = () => {
    localStorage.removeItem('assistly_user')
    localStorage.removeItem('assistly_token')
    router.push('/login')
}

onMounted(() => {
    if (!userData.id) {
        router.push('/login')
        return
    }
    fetchHistory()
})

</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
