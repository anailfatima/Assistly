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
            <button @click="handleLogout" class="p-4 bg-white/5 rounded-2xl text-gray-500 hover:text-pink-400 hover:bg-white/10 transition-all border border-white/5 hover:border-pink-500/30">
                <LogOut class="h-5 w-5" />
            </button>

        </div>
      </header>

      <!-- Chat Messages Area -->
      <div 
        ref="chatContainer"
        class="flex-1 overflow-y-auto bg-black/20 pb-40 scrollbar-hide flex flex-col pt-6"
      >
        <div class="px-8 md:px-16 space-y-8 flex-1">
            <ChatBubble 
                v-for="(msg, index) in messages" 
                :key="index" 
                v-bind="msg" 
            />

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
import { ref, onMounted, nextTick } from 'vue'
import { Bot, Send, LogOut } from 'lucide-vue-next'
import ChatBubble from './ChatBubble.vue'
import { useToast } from '../composables/useToast'
import { useRouter } from 'vue-router'

const { showToast } = useToast()
const router = useRouter()
const inputMsg = ref('')
const isTyping = ref(false)
const chatContainer = ref(null)

const userData = JSON.parse(localStorage.getItem('assistly_user') || '{}')
const messages = ref([])

const fetchHistory = async () => {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const response = await fetch(`${apiUrl}/api/history`, {
            headers: { 
                'x-user-id': userData.id,
                'Content-Type': 'application/json'
            }
        })
        const result = await response.json()
        if (result.success) {
            messages.value = result.data.map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.message,
                time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }))
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
    messages.value.push({
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
            messages.value.push({
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
