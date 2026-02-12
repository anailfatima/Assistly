<template>
  <div class="min-h-screen flex items-center justify-center p-4 md:p-8 overflow-hidden bg-transparent">
    <div class="w-full max-w-[440px] z-10 animate-in fade-in zoom-in duration-700">
      
      <div class="bg-black/40 backdrop-blur-3xl p-8 md:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
        <!-- Glow accents -->
        <div class="absolute -top-24 -left-24 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all duration-700"></div>
        <div class="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-700"></div>

        <!-- Branding INSIDE Card -->
        <div class="mb-8 text-center relative z-10">
          <div class="inline-block bg-gradient-to-br from-pink-600 to-purple-700 p-3 rounded-2xl shadow-[0_0_20px_rgba(255,20,147,0.3)] mb-4 animate-float-slow">
            <Cpu class="h-8 w-8 text-pink-300" />
          </div>
          <h1 class="text-3xl font-black text-white tracking-tighter mb-1 select-none">Assistly<span class="text-pink-500"> Support</span></h1>
          <div class="h-0.5 w-12 bg-gradient-to-r from-pink-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-5 relative z-10">
          <!-- Role Selection -->
          <div class="flex items-center space-x-4 mb-6 bg-black/20 p-2 rounded-2xl border border-white/5">
            <button 
              type="button"
              @click="form.role = 'user'"
              :class="[
                'flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300',
                form.role === 'user' ? 'bg-pink-600 text-white shadow-[0_0_15px_rgba(219,39,119,0.4)]' : 'text-gray-500 hover:text-gray-300'
              ]"
            >
              Customer / User
            </button>
            <button 
              type="button"
              @click="form.role = 'admin'"
              :class="[
                'flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300',
                form.role === 'admin' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'text-gray-500 hover:text-gray-300'
              ]"
            >
              Company Rep
            </button>
          </div>

          <InputField 
            v-model="form.email"
            label="Email"
            placeholder="name@gmail.com"
            id="email"
            type="email"
            :icon="Mail"
            :error="v$.email.$error"
            required
          />

          <InputField 
            v-model="form.password"
            label="Password"
            placeholder="••••••••"
            id="password"
            type="password"
            :icon="Lock"
            :error="v$.password.$error"
            required
          />

          <div class="pt-2">
            <Button :loading="loading" type="submit">
              Login to Assistly
            </Button>
          </div>
        </form>

        <!-- Footer -->
        <div class="mt-8 pt-6 border-t border-white/5 text-center relative z-10">
          <p class="text-gray-500 font-bold text-xs">
            Don't have an account? 
            <router-link to="/signup" class="text-pink-500 hover:text-pink-400 font-black transition-colors ml-1 uppercase tracking-wider">Sign Up</router-link>
          </p>
        </div>
      </div>
      
      <!-- System Info -->
      <div class="flex justify-between mt-6 px-6 opacity-30 select-none">
        <p class="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em]">System: Secure</p>
        <p class="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em]">v1.0.0</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Mail, Lock, Cpu } from 'lucide-vue-next'
import InputField from './InputField.vue'
import Button from './Button.vue'
import { useToast } from '../composables/useToast'

const { showToast } = useToast()

const v$ = reactive({
  email: { $error: false },
  password: { $error: false }
})

const router = useRouter()
const loading = ref(false)
const form = reactive({ email: '', password: '', role: 'user' })

const validate = () => {
    let valid = true
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (!emailRegex.test(form.email)) {
        v$.email.$error = true
        valid = false
    } else {
        v$.email.$error = false
    }
    
    if (form.password.length < 1) {
        v$.password.$error = true
        valid = false
    } else {
        v$.password.$error = false
    }
    
    return valid
}

const handleLogin = async () => {
    if (!validate()) return
    
    loading.value = true
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const response = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: form.email,
                password: form.password,
                role: form.role
            })
        })

        const data = await response.json()

        if (!data.success) {
            showToast(data.message || 'Login failed', 'error')
            return
        }

        // Store session data
        localStorage.setItem('assistly_user', JSON.stringify(data.profile))
        localStorage.setItem('assistly_token', data.token)
        
        showToast('Login successful!', 'success')
        
        setTimeout(() => {
          if (data.profile.role === 'admin') {
            router.push('/admin')
          } else {
            router.push('/chat')
          }
        }, 800)
    } catch (error) {
        showToast('Connection error. Please try again.', 'error')
        console.error('Login error:', error)
    } finally {
        loading.value = false
    }
}
</script>
