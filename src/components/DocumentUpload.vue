<template>
  <div class="space-y-12">
    <!-- 1. UPLOAD SECTION -->
    <div class="bg-gradient-to-r from-pink-900/40 via-purple-900/40 to-green-900/40 p-1 rounded-[2.5rem] relative group">
        <div class="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-pink-400/50 to-transparent"></div>
        
        <div class="bg-black/80 backdrop-blur-3xl p-8 rounded-[2.3rem] border border-white/5 relative overflow-hidden">
            <div class="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:scale-125 group-hover:rotate-6 transition-all duration-1000">
                <Database class="h-40 w-40 text-pink-400" />
            </div>

            <div class="relative z-10">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h3 class="text-2xl font-black text-white tracking-tighter mb-2 uppercase">Resource Manager</h3>
                        <p class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Central Knowledge Intelligence Hub</p>
                    </div>
                    
                    <div class="flex items-center space-x-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                        <div v-for="cat in ['Policy', 'FAQ', 'Other']" :key="cat"
                            @click="selectedCategory = cat"
                            :class="[
                                'px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all',
                                selectedCategory === cat 
                                    ? 'bg-gradient-to-r from-pink-600 to-purple-700 text-white shadow-lg' 
                                    : 'text-gray-500 hover:text-gray-300'
                            ]"
                        >
                            {{ cat }}
                        </div>
                    </div>
                </div>
                
                <div 
                    @dragover.prevent="isDragging = true" 
                    @dragleave.prevent="isDragging = false" 
                    @drop.prevent="handleDrop"
                    :class="[
                    'relative border-2 border-dashed rounded-3xl p-12 transition-all duration-700 flex flex-col items-center justify-center cursor-pointer group/uploader overflow-hidden',
                    isDragging 
                        ? 'border-pink-500 bg-pink-500/5 scale-[0.99] glow-pink' 
                        : 'border-white/10 hover:border-purple-500/30 hover:bg-white/5',
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                    ]"
                    @click="!loading && $refs.fileInput.click()"
                >
                    <input type="file" ref="fileInput" class="hidden" multiple @change="handleFileSelect" accept=".pdf,.doc,.docx,.txt" :disabled="loading" />
                    
                    <div v-if="loading || isDragging" class="absolute inset-x-0 top-0 h-1 bg-pink-400/50 shadow-[0_0_20px_rgba(255,20,147,0.8)] animate-[scan_2s_linear_infinite]"></div>
                    
                    <div class="relative mb-6">
                        <div class="absolute inset-0 bg-pink-500/20 blur-3xl group-hover/uploader:opacity-100 transition-opacity"></div>
                        <div class="bg-gradient-to-br from-pink-600 to-purple-700 p-5 rounded-[1.5rem] shadow-[0_0_30px_rgba(255,20,147,0.2)] group-hover/uploader:scale-110 transition-all duration-500 relative">
                            <Binary v-if="!loading" class="h-8 w-8 text-pink-300" />
                            <Loader2 v-else class="h-8 w-8 text-pink-300 animate-spin" />
                        </div>
                    </div>
                    
                    <p class="text-white font-black text-lg text-center tracking-tighter uppercase mb-2">
                        {{ loading ? `Uploading ${selectedCategory}...` : `Upload Knowledge as ${selectedCategory}` }}
                    </p>
                    <p class="text-gray-500 text-[9px] font-black uppercase tracking-[0.4em] flex items-center mb-1">
                        <ArrowDown v-if="!loading" class="h-3 w-3 mr-2 text-pink-500 animate-bounce" />
                        Drop Files or Click to Browse
                    </p>
                    <p class="text-gray-600 text-[8px] font-bold uppercase tracking-[0.2em] opacity-60">
                        Supported formats: PDF, DOCX, TXT
                    </p>
                </div>
            </div>
        </div>
    </div>

    <!-- 2. RESOURCE LIBRARY -->
    <div class="bg-gradient-to-r from-purple-900/40 via-pink-900/40 to-blue-900/40 p-1 rounded-[3rem] relative group/library shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]">
        <div class="bg-[#080808]/90 backdrop-blur-3xl p-8 md:p-10 rounded-[2.9rem] border border-white/5 relative overflow-hidden">
            <!-- Ambient library glow -->
            <div class="absolute -top-24 -left-24 h-64 w-64 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none group-hover/library:bg-purple-600/15 transition-all duration-1000"></div>

            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-2 relative z-10">
                <div class="flex items-center space-x-6">
                    <div class="h-12 w-12 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                        <Layers class="h-6 w-6 text-pink-400" />
                    </div>
                    <div>
                        <h3 class="text-xl font-black text-white uppercase tracking-tighter">Resource Library</h3>
                        <!-- Counts Summary Line -->
                        <div class="flex items-center space-x-4 text-[11px] font-black uppercase tracking-widest mt-2">
                            <span class="text-pink-400">Policies: {{ counts.Policy }}</span>
                            <div class="h-1 w-1 bg-white/20 rounded-full"></div>
                            <span class="text-purple-400">FAQs: {{ counts.FAQ }}</span>
                            <div class="h-1 w-1 bg-white/20 rounded-full"></div>
                            <span class="text-blue-400">Others: {{ counts.Other }}</span>
                        </div>
                    </div>
                </div>
                <button 
                    @click="fetchDocs(true)" 
                    :disabled="loadingDocs"
                    class="px-8 py-3.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] hover:bg-purple-600 hover:text-white hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-500 flex items-center space-x-3 group/sync shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RotateCcw class="h-4 w-4 transition-transform duration-700" :class="{'animate-spin': loadingDocs}" />
                    <span>{{ loadingDocs ? 'Syncing...' : 'Sync Assets' }}</span>
                </button>
            </div>

            <!-- Library Content -->
            <div class="space-y-10 relative z-10 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar scroll-smooth antialiased transform-gpu">
                <div v-for="category in ['Policy', 'FAQ', 'Other']" :key="category" class="space-y-6">
                    <div v-if="getDocsByCategory(category).length > 0">
                        <div class="flex items-center space-x-6 px-2 mb-4">
                            <span class="text-sm font-black text-gray-400 uppercase tracking-[0.4em]">{{ category }} Base</span>
                            <div class="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent"></div>
                        </div>
                        
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div v-for="doc in getDocsByCategory(category)" :key="doc.id" 
                                @click="viewDocument(doc)"
                                class="bg-[#121212]/50 p-5 rounded-[2rem] border border-white/5 flex items-center justify-between group/item hover:border-pink-500/50 hover:bg-white/[0.04] transition-all duration-500 relative overflow-hidden cursor-pointer shadow-xl"
                            >
                                <div class="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-purple-500/0 group-hover/item:from-pink-500/10 group-hover/item:to-purple-500/10 transition-all duration-700"></div>

                                <div class="flex items-center space-x-5 relative z-10 flex-1 min-w-0">
                                    <div class="h-14 w-14 rounded-2xl bg-black border border-white/10 flex items-center justify-center group-hover/item:border-purple-500/50 transition-all shadow-inner shrink-0">
                                        <FileCode class="h-7 w-7 text-gray-700 group-hover/item:text-purple-400 transition-colors" />
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <div class="flex items-center space-x-3 mb-1">
                                            <p class="text-sm font-black text-white tracking-tighter truncate uppercase">{{ doc.title }}</p>
                                        </div>
                                        <div class="flex items-center space-x-3">
                                            <span class="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{{ formatDate(doc.created_at) }}</span>
                                            <div v-if="doc.content" class="h-1.5 w-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="flex items-center space-x-4 relative z-10 shrink-0 ml-4">
                                    <button @click.stop="deleteDoc(doc.id)" class="h-10 w-10 rounded-xl bg-black border border-white/10 text-gray-700 hover:text-red-400 hover:border-red-400/50 hover:bg-red-400/5 transition-all flex items-center justify-center opacity-0 group-hover/item:opacity-100 duration-300">
                                        <Trash2 class="h-4 w-4" />
                                    </button>
                                    <ChevronRight class="h-5 w-5 text-gray-700 group-hover/item:text-pink-400 transition-all transform group-hover/item:translate-x-1 duration-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="documents.length === 0 && !loadingDocs" class="py-16 text-center bg-black/20 rounded-[2.5rem] border border-dashed border-white/5 relative z-10 flex flex-col items-center">
                    <Layers class="h-12 w-12 text-gray-800 mb-4 opacity-50" />
                    <p class="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em]">Central Repository Empty</p>
                </div>
            </div>
        </div>
    </div>

    <!-- 3. FREQUENTLY ASKED QUESTIONS (Consolidated Card) -->
    <div class="bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-pink-900/40 p-1 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] relative group/faq-card">
        <div class="bg-[#080808]/90 backdrop-blur-3xl p-8 md:p-10 rounded-[2.9rem] border border-white/5 relative overflow-hidden">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 px-2 relative z-10">
                <div class="flex items-center space-x-6">
                    <div class="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center">
                        <Zap class="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                        <h3 class="text-xl font-black text-white uppercase tracking-tighter">Frequently Asked Questions</h3>
                        <p class="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mt-2">Instant Knowledge Base Support</p>
                    </div>
                </div>
                <button @click="showAddFaq = !showAddFaq" class="px-8 py-3.5 bg-pink-500/10 border border-pink-500/30 rounded-2xl text-[10px] font-black text-pink-400 uppercase tracking-[0.3em] hover:bg-pink-600 hover:text-white transition-all duration-500 flex items-center space-x-3 shadow-lg active:scale-95">
                    <Plus class="h-4 w-4 transition-transform" :class="{'rotate-45': showAddFaq}" />
                    <span>{{ showAddFaq ? 'Close Form' : 'Add New FAQ' }}</span>
                </button>
            </div>

            <!-- Inline Add FAQ Form -->
            <transition name="fade">
                <div v-if="showAddFaq" class="mb-12 p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] relative z-10">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div class="space-y-3">
                            <label class="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-4">Question Input</label>
                            <input v-model="newFaq.question" type="text" placeholder="e.g. How do I upgrade my plan?" class="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all" />
                        </div>
                        <div class="space-y-3">
                            <label class="text-[10px] font-black text-pink-400 uppercase tracking-widest ml-4">Answer Detail</label>
                            <textarea v-model="newFaq.answer" rows="2" placeholder="e.g. Go to settings and select billing..." class="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-500/50 transition-all resize-none"></textarea>
                        </div>
                    </div>
                    <div class="flex justify-end">
                        <button @click="addFaq" :disabled="!newFaq.question || !newFaq.answer || loadingFaq" class="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-700 rounded-2xl text-[11px] font-black text-white uppercase tracking-[0.3em] flex items-center space-x-3 shadow-lg hover:shadow-purple-500/30 active:scale-[0.98] transition-all disabled:opacity-30">
                            <Loader2 v-if="loadingFaq" class="h-4 w-4 animate-spin" />
                            <span>Publish to FAQ</span>
                        </button>
                    </div>
                </div>
            </transition>

            <!-- FAQ List Section -->
            <div class="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar space-y-4 relative z-10 scroll-smooth antialiased transform-gpu">
                <div v-for="faq in faqs" :key="faq.id" class="p-6 bg-white/5 border border-white/5 rounded-[2rem] group/faq hover:bg-white/[0.08] hover:border-purple-500/30 transition-all duration-500">
                    <div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div class="space-y-4 flex-1">
                            <div class="flex items-start space-x-4">
                                <div class="h-8 w-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-black text-[10px] text-purple-400 shrink-0 mt-1">Q</div>
                                <p class="text-lg font-black text-white tracking-tight uppercase leading-tight">{{ faq.question }}</p>
                            </div>
                            <div class="flex items-start space-x-4">
                                <div class="h-8 w-8 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center font-black text-[10px] text-pink-400 shrink-0 mt-1">A</div>
                                <p class="text-sm font-medium text-gray-400 leading-relaxed">{{ faq.answer }}</p>
                            </div>
                        </div>
                        <button @click="deleteFaq(faq.id)" class="h-10 w-10 rounded-xl bg-black border border-white/10 text-gray-700 hover:text-red-400 hover:border-red-400/50 transition-all flex items-center justify-center self-end md:self-start group-hover/faq:shadow-lg">
                            <Trash2 class="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div v-if="faqs.length === 0" class="py-24 text-center bg-black/20 rounded-[2.5rem] border border-dashed border-white/5 flex flex-col items-center">
                    <Zap class="h-12 w-12 text-gray-800 mb-4 opacity-50" />
                    <p class="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em]">No Frequently Asked Questions</p>
                </div>
            </div>
        </div>
    </div>



    <!-- Modals -->
    <transition name="fade">
        <!-- Add FAQ Modal -->
        <div v-if="showAddFaq" class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <div class="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                <div class="absolute top-0 right-0 p-12 opacity-[0.03] -rotate-12">
                    <Zap class="h-40 w-40 text-pink-400" />
                </div>
                
                <div class="relative z-10 space-y-8">
                    <div class="flex justify-between items-center">
                        <h3 class="text-2xl font-black text-white tracking-tighter uppercase font-black uppercase">Create QA Entry</h3>
                        <button @click="showAddFaq = false" class="text-gray-500 hover:text-white transition-colors">
                            <X class="h-6 w-6" />
                        </button>
                    </div>

                    <div class="space-y-6">
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Question</label>
                            <input v-model="newFaq.question" type="text" placeholder="e.g. How do I reset my password?" class="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-1 focus:ring-pink-500/50 transition-all" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Answer Detail</label>
                            <textarea v-model="newFaq.answer" rows="4" placeholder="e.g. You can reset your password by..." class="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-1 focus:ring-pink-500/50 transition-all resize-none"></textarea>
                        </div>
                    </div>

                    <button @click="addFaq" :disabled="!newFaq.question || !newFaq.answer || loadingFaq" class="w-full py-5 bg-gradient-to-r from-pink-600 to-purple-700 rounded-2xl text-[11px] font-black text-white uppercase tracking-[0.3em] flex items-center justify-center space-x-3 shadow-lg hover:shadow-pink-500/20 active:scale-[0.98] transition-all disabled:opacity-50">
                        <Loader2 v-if="loadingFaq" class="h-4 w-4 animate-spin" />
                        <span>Confirm Creation</span>
                    </button>
                </div>
            </div>
        </div>
    </transition>

    <transition name="fade">
        <!-- View Doc Modal -->
        <div v-if="viewingDoc" class="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 bg-black/90 backdrop-blur-xl lg:pl-72 transition-all duration-500">
            <!-- Animated Gradient Border Container -->
            <div class="relative w-full max-w-5xl max-h-[90vh] flex flex-col group/modal">
                <!-- Border Ray Effect -->
                <div class="absolute -inset-[2px] bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500 rounded-[3.5rem] opacity-30 blur-sm group-hover/modal:opacity-70 transition-opacity duration-1000"></div>
                <div class="absolute -inset-[1px] bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500 rounded-[3.5rem] opacity-40 group-hover/modal:opacity-100 transition-opacity duration-1000"></div>
                
                <!-- Main Modal Content -->
                <div class="relative flex-1 bg-[#080808] rounded-[3.4rem] overflow-hidden flex flex-col z-10">
                    <div class="p-10 border-b border-white/5 flex justify-between items-center relative z-10 bg-white/[0.02]">
                        <div class="flex items-center space-x-6">
                            <div class="h-16 w-16 rounded-3xl bg-gradient-to-br from-pink-600/20 to-purple-700/20 border border-pink-500/30 flex items-center justify-center shadow-lg">
                                <FileCode class="h-8 w-8 text-pink-400" />
                            </div>
                            <div>
                                <h3 class="text-3xl font-black text-white tracking-tighter uppercase leading-none">{{ viewingDoc.title }}</h3>
                                <div class="flex items-center space-x-4 mt-3">
                                    <span class="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] font-black text-purple-400 uppercase tracking-widest">{{ viewingDoc.category }}</span>
                                    <div class="h-1.5 w-1.5 bg-gray-700 rounded-full"></div>
                                    <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">{{ viewingDoc.file_type }} • {{ formatDate(viewingDoc.created_at) }}</span>
                                </div>
                            </div>
                        </div>
                        <button @click="viewingDoc = null" class="h-14 w-14 flex items-center justify-center bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-all border border-white/5 hover:border-pink-500/30 hover:scale-105 active:scale-95 shadow-xl">
                            <X class="h-6 w-6" />
                        </button>
                    </div>

                    <div class="flex-1 overflow-y-auto p-12 custom-scrollbar scroll-smooth">
                        <div v-if="viewingDoc.content" class="relative group/content">
                            <div class="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-500 via-purple-500 to-transparent rounded-full opacity-30 group-hover/content:opacity-100 transition-opacity"></div>
                            <div class="bg-white/[0.03] p-10 rounded-[2.5rem] border border-white/5 text-gray-300 leading-[1.8] font-medium text-lg antialiased whitespace-pre-wrap">
                                {{ viewingDoc.content }}
                            </div>
                        </div>
                        <div v-else class="h-80 flex flex-col items-center justify-center text-center space-y-6">
                            <div class="p-8 bg-white/5 rounded-full border border-dashed border-white/10 animate-pulse">
                                <Binary class="h-16 w-16 text-gray-600" />
                            </div>
                            <div>
                                <p class="text-[11px] font-black text-gray-500 uppercase tracking-[0.4em] mb-4">Neural Preview Unavailable</p>
                                <a :href="viewingDoc.file_url" target="_blank" class="px-8 py-3 bg-pink-500/10 border border-pink-500/30 rounded-2xl text-[10px] font-black text-pink-400 uppercase tracking-widest hover:bg-pink-500 hover:text-white transition-all shadow-lg inline-block">
                                    Download External Asset
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-8 bg-black/40 border-t border-white/5 flex justify-center shrink-0">
                         <p class="text-[9px] font-black text-gray-600 uppercase tracking-[0.6em]">Secure Knowledge Management System — Assistly AI</p>
                    </div>
                </div>
            </div>
        </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
    Binary, Trash2, X, Activity, Layers, Database, 
    FileCode, ArrowDown, Loader2, RotateCcw, 
    Plus, Zap, ChevronRight 
} from 'lucide-vue-next'
import { useToast } from '../composables/useToast'

const { showToast } = useToast()
const isDragging = ref(false)
const loading = ref(false)
const loadingDocs = ref(false)
const fileInput = ref(null)
const documents = ref([])

const selectedCategory = ref('Policy')
const viewingDoc = ref(null)

// FAQ state
const faqs = ref([])
const showAddFaq = ref(false)
const loadingFaq = ref(false)
const newFaq = ref({ question: '', answer: '' })

const adminData = JSON.parse(localStorage.getItem('assistly_user') || '{}')

const counts = computed(() => {
    return {
        Policy: documents.value.filter(d => d.category === 'Policy').length,
        FAQ: documents.value.filter(d => d.category === 'FAQ').length,
        Other: documents.value.filter(d => d.category === 'Other').length
    }
})

const getDocsByCategory = (cat) => documents.value.filter(d => d.category === cat)

const fetchDocs = async (manual = false) => {
    loadingDocs.value = true
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const response = await fetch(`${apiUrl}/api/admin/docs`, {
            headers: { 'x-user-id': adminData.id }
        })
        const result = await response.json()
        if (result.success) {
            documents.value = result.data
            if (manual) showToast('Resource Library updated successfully', 'success')
        }
    } catch (error) {
        showToast('Unable to fetch documents, please try again', 'error')
    } finally {
        loadingDocs.value = false
    }
}

const fetchFaqs = async () => {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const response = await fetch(`${apiUrl}/api/admin/faqs`, {
            headers: { 'x-user-id': adminData.id }
        })
        const result = await response.json()
        if (result.success) {
            faqs.value = result.data
        }
    } catch (error) {
        showToast('Failed to fetch FAQs', 'error')
    }
}

const addFaq = async () => {
    loadingFaq.value = true
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const response = await fetch(`${apiUrl}/api/admin/faqs`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-user-id': adminData.id
            },
            body: JSON.stringify(newFaq.value)
        })
        const result = await response.json()
        if (result.success) {
            showToast('QA Entry created successfully', 'success')
            showAddFaq.value = false
            newFaq.value = { question: '', answer: '' }
            fetchFaqs()
        }
    } catch (error) {
        showToast('Failed to create FAQ', 'error')
    } finally {
        loadingFaq.value = false
    }
}

const deleteFaq = async (id) => {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const response = await fetch(`${apiUrl}/api/admin/faqs/${id}`, {
            method: 'DELETE',
            headers: { 'x-user-id': adminData.id }
        })
        const result = await response.json()
        if (result.success) {
            showToast('Knowledge node removed', 'success')
            fetchFaqs()
        }
    } catch (error) {
        showToast('Action failed', 'error')
    }
}

const viewDocument = (doc) => {
    viewingDoc.value = doc
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files.length > 0) uploadFiles(files)
}

const handleFileSelect = (e) => {
  const files = e.target.files
  if (files.length > 0) uploadFiles(files)
}

const uploadFiles = async (files) => {
  loading.value = true
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', file.name.replace(/\.[^/.]+$/, "").toUpperCase().replace(/\s+/g, '_'))
      formData.append('description', `Knowledge asset uploaded by ${adminData.name}`)
      formData.append('uploader_id', adminData.id)
      formData.append('category', selectedCategory.value)

      const response = await fetch(`${apiUrl}/api/admin/upload-doc`, {
        method: 'POST',
        headers: { 
            'x-user-id': adminData.id
        },
        body: formData
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.message)
    }

    showToast(`Document uploaded successfully`, 'success')
    fetchDocs()
  } catch (error) {
    showToast('Unable to upload document. Please check file type and size.', 'error')
    console.error('Upload error:', error)
  } finally {
    loading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

const deleteDoc = async (id) => {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const response = await fetch(`${apiUrl}/api/admin/docs/${id}`, {
            method: 'DELETE',
            headers: { 'x-user-id': adminData.id }
        })
        const result = await response.json()
        if (result.success) {
            showToast('Asset removed', 'success')
            fetchDocs()
        }
    } catch (error) {
        showToast('Action failed', 'error')
    }
}

const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
}

onMounted(() => {
    fetchDocs()
    fetchFaqs()
})
</script>

<style scoped>
@keyframes scan {
    from { transform: translateY(0); }
    to { transform: translateY(300px); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(236, 72, 153, 0.2);
}
</style>

