<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Check, ChevronDown, Search } from '@lucide/vue'

type Option = { value: string; label: string; description?: string }

const props = withDefaults(defineProps<{
  modelValue: string
  options: Option[]
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
}>(), {
  placeholder: '请选择',
  searchPlaceholder: '搜索选项',
  disabled: false,
})
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const root = ref<HTMLElement | null>(null)
const open = ref(false)
const query = ref('')
const selected = computed(() => props.options.find((item) => item.value === props.modelValue))
const filtered = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return props.options.filter((item) => !keyword || `${item.label} ${item.description || ''}`.toLowerCase().includes(keyword))
})
function choose(value: string) { emit('update:modelValue', value); open.value = false; query.value = '' }
function outside(event: PointerEvent) { if (root.value && event.target instanceof Node && !root.value.contains(event.target)) open.value = false }
function escape(event: KeyboardEvent) { if (event.key === 'Escape') open.value = false }
onMounted(() => { window.addEventListener('pointerdown', outside); window.addEventListener('keydown', escape) })
onUnmounted(() => { window.removeEventListener('pointerdown', outside); window.removeEventListener('keydown', escape) })
</script>

<template>
  <div ref="root" class="relative min-w-0">
    <button type="button" :disabled="disabled" class="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-white/[0.08] bg-[#202228] px-3 text-left text-sm disabled:cursor-not-allowed disabled:opacity-45" @click="open = !open">
      <span :class="['min-w-0 truncate', selected ? 'text-[#e2e8f0]' : 'text-[#64748b]']">{{ selected?.label || placeholder }}</span><ChevronDown :size="15" class="shrink-0 text-[#64748b]" />
    </button>
    <div v-if="open" class="absolute left-0 top-full z-[190] mt-1 w-full min-w-[260px] overflow-hidden rounded-md border border-white/[0.12] bg-[#202126] shadow-[0_18px_50px_rgba(0,0,0,.55)]">
      <label class="m-2 flex h-9 items-center gap-2 rounded-md border border-white/[0.08] bg-[#17181d] px-3"><Search :size="15" class="text-[#64748b]" /><input v-model="query" autofocus class="min-w-0 flex-1 bg-transparent text-sm outline-none" :placeholder="searchPlaceholder" /></label>
      <div class="max-h-[240px] overflow-y-auto p-1.5">
        <button v-for="option in filtered" :key="option.value" type="button" class="flex min-h-9 w-full items-center justify-between gap-3 rounded px-2.5 py-2 text-left text-sm hover:bg-white/[0.06]" @click="choose(option.value)"><span class="min-w-0"><b class="block truncate font-medium text-[#cbd5e1]">{{ option.label }}</b><small v-if="option.description" class="mt-0.5 block truncate text-[#64748b]">{{ option.description }}</small></span><Check v-if="option.value === modelValue" :size="15" class="shrink-0 text-[#d292f4]" /></button>
        <div v-if="!filtered.length" class="px-3 py-6 text-center text-sm text-[#64748b]">没有匹配项</div>
      </div>
    </div>
  </div>
</template>
