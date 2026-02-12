<template>
  <div class="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <!-- Base Mesh -->
    <div class="absolute inset-0 bg-mesh opacity-50"></div>
    
    <!-- 3D Layered Bars -->
    <div 
      v-for="(bar, index) in bars" 
      :key="index"
      :class="['bg-bar animate-drift', bar.colorClass]"
      :style="{
        top: bar.top,
        left: bar.left,
        width: bar.width,
        height: bar.height,
        animationDelay: bar.delay,
        opacity: bar.opacity
      }"
    >
      <!-- Neon edge glow using pseudo-element-like div -->
      <div 
        class="absolute inset-0 rounded-2xl animate-neon-flow opacity-20"
        :class="bar.glowClass"
      ></div>
    </div>

    <!-- Floating Neon Strips -->
    <div class="absolute inset-0">
        <div class="absolute top-[20%] left-0 w-32 h-[1px] bg-pink-500 shadow-[0_0_20px_rgba(255,20,147,1)] opacity-20 animate-pulse"></div>
        <div class="absolute bottom-[30%] right-0 w-48 h-[1px] bg-purple-500 shadow-[0_0_20px_rgba(138,43,226,1)] opacity-20 animate-pulse" style="animation-delay: 1s"></div>
        <div class="absolute top-[60%] left-[10%] w-[1px] h-32 bg-green-500 shadow-[0_0_20px_rgba(0,170,68,1)] opacity-20 animate-pulse" style="animation-delay: 2s"></div>
    </div>
  </div>
</template>

<script setup>
const bars = [
  { top: '5%', left: '10%', width: '300px', height: '60px', colorClass: 'bg-bar-pink', glowClass: 'bg-pink-500', delay: '0s', opacity: 0.4 },
  { top: '15%', left: '60%', width: '400px', height: '80px', colorClass: 'bg-bar-purple', glowClass: 'bg-purple-500', delay: '2s', opacity: 0.3 },
  { top: '40%', left: '-5%', width: '350px', height: '70px', colorClass: 'bg-bar-green', glowClass: 'bg-green-500', delay: '4s', opacity: 0.2 },
  { top: '70%', left: '25%', width: '500px', height: '100px', colorClass: 'bg-bar-purple', glowClass: 'bg-purple-500', delay: '1s', opacity: 0.3 },
  { top: '80%', left: '70%', width: '280px', height: '50px', colorClass: 'bg-bar-pink', glowClass: 'bg-pink-500', delay: '3s', opacity: 0.4 },
  { top: '25%', left: '15%', width: '60px', height: '300px', colorClass: 'bg-bar-green', glowClass: 'bg-green-500', delay: '5s', opacity: 0.2 },
  { top: '10%', left: '85%', width: '80px', height: '400px', colorClass: 'bg-bar-purple', glowClass: 'bg-purple-500', delay: '2.5s', opacity: 0.3 }
]
</script>
