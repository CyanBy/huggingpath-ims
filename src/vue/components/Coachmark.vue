<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { X } from '@lucide/vue'
import { hasSeenHint, markHintSeen } from '@/lib/onboarding'

/**
 * 页面级首次引导气泡：紫色脉冲圈住目标控件，下方浮出一句话说明。
 * 无遮罩不挡操作；点知道了/点别处/Esc 即消失；每个 hintKey 只出现一次。
 */
const props = defineProps<{
  hintKey: string
  /** 目标控件的 CSS 选择器（取第一个匹配元素） */
  selector: string
  title: string
  text: string
}>()

const visible = ref(false)
const targetRect = ref<DOMRect | null>(null)

/** 气泡右缘对齐目标右缘，钳制在视口内 */
const bubbleLeft = computed(() => {
  if (!targetRect.value) return 16
  return Math.max(16, Math.min(targetRect.value.right - 288, window.innerWidth - 304))
})

/** 箭头对准目标中心（相对气泡右缘的偏移） */
const arrowRight = computed(() => {
  if (!targetRect.value) return 24
  const targetCenter = targetRect.value.left + targetRect.value.width / 2
  return Math.min(40, Math.max(16, bubbleLeft.value + 288 - targetCenter))
})

function locate() {
  const el = document.querySelector(props.selector)
  targetRect.value = el ? el.getBoundingClientRect() : null
}

function dismiss() {
  visible.value = false
  markHintSeen(props.hintKey)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') dismiss()
}

function onReposition() {
  if (visible.value) locate()
}

onMounted(() => {
  if (hasSeenHint(props.hintKey)) return
  // 等页面渲染稳定后再定位；找不到目标就不打扰
  window.setTimeout(() => {
    locate()
    if (targetRect.value) {
      visible.value = true
      window.addEventListener('resize', onReposition)
      window.addEventListener('scroll', onReposition, true)
      window.addEventListener('keydown', onKeydown)
    }
  }, 800)
})

onUnmounted(() => {
  window.removeEventListener('resize', onReposition)
  window.removeEventListener('scroll', onReposition, true)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="visible && targetRect" class="fixed inset-0 z-[240]" @click="dismiss">
      <!-- 目标高亮圈 -->
      <div
        class="pointer-events-none fixed rounded-lg border-2 border-[#d292f4]/80 shadow-[0_0_0_4px_rgb(143_53_183/0.25)] animate-pulse"
        :style="{ left: `${targetRect.left - 6}px`, top: `${targetRect.top - 6}px`, width: `${targetRect.width + 12}px`, height: `${targetRect.height + 12}px` }"
      />
      <!-- 气泡：右缘对齐目标右缘，显示在下方 -->
      <div
        class="coachmark-bubble fixed w-72 rounded-xl border border-[#8f35b7]/40 bg-[#202126] p-4 shadow-2xl"
        :style="{ top: `${targetRect.bottom + 14}px`, left: `${bubbleLeft}px` }"
        @click.stop
      >
        <span class="absolute -top-[5px] h-2.5 w-2.5 rotate-45 border-l border-t border-[#8f35b7]/40 bg-[#202126]" :style="{ right: `${arrowRight}px` }" />
        <header class="flex items-start justify-between gap-2">
          <b class="text-sm font-semibold text-white">{{ title }}</b>
          <button class="-mr-1 -mt-1 text-[#64748b] hover:text-white" title="关闭" @click="dismiss"><X :size="14" /></button>
        </header>
        <p class="mt-1.5 text-xs leading-5 text-[#aab4c4]">{{ text }}</p>
        <footer class="mt-3 flex justify-end">
          <button class="rounded-lg border border-[#8f35b7]/40 bg-[#8f35b7]/15 px-3 py-1.5 text-xs font-medium text-[#d292f4] hover:text-white" @click="dismiss">知道了</button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.coachmark-bubble {
  animation: coachmark-in 0.25s ease-out;
}
@keyframes coachmark-in {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
