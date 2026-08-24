<script setup lang="ts">
withDefaults(defineProps<{ size?: number; showText?: boolean }>(), { size: 32, showText: false })
</script>

<template>
  <span class="inline-flex items-center gap-2">
    <svg :width="size" :height="size" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="14" stroke="#8f35b7" stroke-width="1.5" fill="rgba(143,53,183,0.08)" />
      <circle cx="16" cy="16" r="9" stroke="#8f35b7" stroke-width="1" stroke-opacity="0.5" />
      <circle cx="16" cy="16" r="5" fill="#8f35b7" fill-opacity="0.15" stroke="#8f35b7" />
      <circle cx="16" cy="5" r="2" fill="#8f35b7" />
      <circle cx="25" cy="12" r="1.5" fill="#b86bdd" />
      <circle cx="22" cy="24" r="1.5" fill="#b86bdd" />
      <circle cx="10" cy="24" r="1.5" fill="#b86bdd" />
      <circle cx="7" cy="12" r="1.5" fill="#b86bdd" />
      <g stroke="#8f35b7" stroke-width="0.75" stroke-opacity="0.6">
        <line x1="16" y1="7" x2="16" y2="11" /><line x1="23.5" y1="13" x2="20" y2="15" />
        <line x1="20.5" y1="22.5" x2="19" y2="19.5" /><line x1="11.5" y1="22.5" x2="13" y2="19.5" />
        <line x1="8.5" y1="13" x2="12" y2="15" />
      </g>
    </svg>
    <span v-if="showText" class="text-lg font-semibold text-[#e2e8f0]">HuggingPath</span>
  </span>
</template>
