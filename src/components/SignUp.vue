<template>
  <div class="min-h-screen flex items-center justify-center p-4 md:p-8 overflow-hidden bg-transparent">
    <div class="w-full max-w-[480px] z-10 animate-in fade-in zoom-in duration-700">
      
      <div class="bg-black/40 backdrop-blur-3xl p-8 md:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
        <!-- Glow accents -->
        <div class="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-700"></div>
        <div class="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all duration-700"></div>

        <!-- Branding INSIDE Card -->
        <div class="mb-8 text-center relative z-10">
          <div class="inline-block bg-gradient-to-br from-purple-600 to-pink-700 p-3 rounded-2xl shadow-[0_0_20px_rgba(138,43,226,0.3)] mb-4 animate-float-slow">
            <Cpu class="h-8 w-8 text-purple-300" />
          </div>
          <h1 class="text-3xl font-black text-white tracking-tighter mb-1 select-none">Create Account</h1>
          <p class="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em]">Integrated Assistly Intelligence</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSignUp" class="space-y-4 relative z-10">
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
            v-model="form.name"
            label="Full Name"
            placeholder="John Doe"
            id="name"
            :icon="User"
            :error="v$.name.$error"
            required
          />

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

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <InputField 
                v-model="form.confirmPassword"
                label="Confirm Password"
                placeholder="••••••••"
                id="confirmPassword"
                type="password"
                :icon="ShieldCheck"
                :error="v$.confirmPassword.$error"
                required
            />
          </div>

          <div class="pt-4">
            <Button :loading="loading" type="submit">
              Create Account
            </Button>
          </div>
        </form>

        <!-- Footer -->
        <div class="mt-8 pt-6 border-t border-white/5 text-center relative z-10">
          <p class="text-gray-500 font-bold text-xs">
            Already have an account? 
            <router-link to="/login" class="text-purple-500 hover:text-purple-400 font-black transition-colors ml-1 uppercase tracking-wider">Login</router-link>
          </p>
        </div>
      </div>

      <!-- Legal Info -->
      <p class="text-center mt-5 text-[8px] font-black text-gray-600 uppercase tracking-[0.3em] opacity-40 select-none">
        By creating an account, you agree to our Terms of Service
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Mail, Lock, ShieldCheck, Cpu } from 'lucide-vue-next'
import InputField from './InputField.vue'
import Button from './Button.vue'
import { useToast } from '../composables/useToast'

const { showToast } = useToast()
const router = useRouter()
const loading = ref(false)

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'user'
})

const v$ = reactive({
  name: { $error: false },
  email: { $error: false },
  password: { $error: false },
  confirmPassword: { $error: false }
})

const validate = () => {
    let valid = true
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (form.name.length < 2) {
        v$.name.$error = true
        valid = false
    } else {
        v$.name.$error = false
    }

    if (!emailRegex.test(form.email)) {
        v$.email.$error = true
        valid = false
    } else {
        v$.email.$error = false
    }
    
    if (form.password.length < 6) {
        v$.password.$error = true
        valid = false
    } else {
        v$.password.$error = false
    }

    if (form.password !== form.confirmPassword || form.confirmPassword === '') {
        v$.confirmPassword.$error = true
        valid = false
    } else {
        v$.confirmPassword.$error = false
    }
    
    return valid
}

const handleSignUp = async () => {
    if (!validate()) return
    
    loading.value = true
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const response = await fetch(`${apiUrl}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: form.name,
                email: form.email,
                password: form.password,
                role: form.role
            })
        })

        let data
        try {
            data = await response.json()
        } catch (e) {
            throw new Error('Server returned an invalid response')
        }

        if (!data.success) {
            showToast(data.message || 'Signup failed', 'error')
            return
        }

        showToast('Account created successfully!', 'success')
        
        setTimeout(() => {
          router.push('/login')
        }, 1200)
    } catch (error) {
        showToast('Connection error. Please try again.', 'error')
        console.error('Signup error:', error)
    } finally {
        loading.value = false
    }
}
</script>
