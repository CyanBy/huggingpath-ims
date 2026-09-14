<script setup lang="ts">
import { useRouter } from 'vue-router'
import { MessagesSquare, Sparkles, Table2, BarChart3, GitCompareArrows, LineChart, ShieldCheck, SearchCheck, Calculator, RotateCcw } from '@lucide/vue'

const router = useRouter()

const steps = [
  { icon: Table2, title: '数据整理', text: '把病例与切片整理成结构化队列，范围、缺失与冲突一目了然。' },
  { icon: BarChart3, title: '差异分析', text: '比较不同分组的特征分布，定位具有区分度的特征。' },
  { icon: GitCompareArrows, title: '组合比较', text: '评估不同特征组合的表现，找出更优的分析方案。' },
  { icon: LineChart, title: '结果输出', text: '生成图表与结果摘要，支撑后续研究与汇报。' },
]

const principles = [
  { icon: Calculator, title: '真实计算', text: '所有数字来自真实数据与分析记录，不编造、不虚构。' },
  { icon: SearchCheck, title: '结果可查', text: '每个结论都能回溯到来源数据，分析产物双入口可见。' },
  { icon: ShieldCheck, title: '医生审核', text: '执行前先确认分析方案，关键操作始终由你拍板。' },
]
</script>

<template>
  <div class="section-container py-16">
    <div class="mx-auto max-w-[860px]">
      <!-- 头部 -->
      <div class="text-center">
        <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#8f35b7]/15 text-[#d292f4]">
          <Sparkles :size="26" />
        </span>
        <h1 class="mt-6 text-3xl font-semibold text-white">AI 助手 · Agent 科研助手</h1>
        <p class="mx-auto mt-4 max-w-[640px] text-base leading-7 text-[#aab4c4]">
          以大模型为核心，驱动科研全流程：理解问题、调用工具、组织分析、生成结果。
          你用自然语言提出研究问题，AI 助手给出分析方案，经你确认后执行。
        </p>
      </div>

      <!-- 工作方式四步 -->
      <div class="mt-14">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-xl font-semibold">AI 助手如何工作</h2>
          <span class="inline-flex items-center gap-2 rounded-full border border-[#8f35b7]/40 bg-[#8f35b7]/10 px-3 py-1 text-xs text-[#d292f4]">
            <RotateCcw :size="12" />
            确认方案 → 执行 → 复核追问
          </span>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article v-for="(step, index) in steps" :key="step.title" class="relative border-t border-white/[0.10] pt-5">
            <span class="absolute right-0 top-4 rounded-md border border-[#8f35b7]/40 bg-[#8f35b7]/15 px-2 py-0.5 text-xs font-semibold text-[#d292f4]">0{{ index + 1 }}</span>
            <span class="grid h-10 w-10 place-items-center rounded-md bg-[#8f35b7]/15 text-[#d292f4]">
              <component :is="step.icon" :size="20" />
            </span>
            <h3 class="mt-4 font-semibold">{{ step.title }}</h3>
            <p class="mt-2 text-sm leading-6">{{ step.text }}</p>
          </article>
        </div>
      </div>

      <!-- 三条原则 -->
      <div class="mt-14 grid gap-4 sm:grid-cols-3">
        <article v-for="item in principles" :key="item.title" class="rounded-lg border border-white/[0.07] bg-[#202126] p-5">
          <span class="grid h-9 w-9 place-items-center rounded-lg bg-[#8f35b7]/15 text-[#d292f4]">
            <component :is="item.icon" :size="18" />
          </span>
          <h3 class="mt-4 font-semibold">{{ item.title }}</h3>
          <p class="mt-2 text-sm leading-6">{{ item.text }}</p>
        </article>
      </div>

      <!-- 示例 -->
      <div class="mt-14 rounded-lg border border-white/[0.07] bg-[#17181d] p-6">
        <p class="text-xs uppercase tracking-[.14em] text-[#64748b]">你可以这样问</p>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <div v-for="q in [
            '比较这两个 Case 的 TME 特征差异',
            '这个项目里所有失败的分析是什么原因',
            '把这次分析结果整理成可以汇报的摘要',
            '帮我看看哪张切片还没跑过 TME 分析',
          ]" :key="q" class="flex items-center gap-3 rounded-md border border-white/[0.06] bg-[#202126] px-4 py-3 text-sm text-[#aab4c4]">
            <MessagesSquare :size="15" class="shrink-0 text-[#d292f4]" />
            {{ q }}
          </div>
        </div>
      </div>

      <div class="mt-12 text-center">
        <button class="btn-primary h-11 px-8 text-base" @click="router.push('/assistant/chat')">
          <Sparkles :size="17" />
          开启 AI 之旅
        </button>
      </div>
    </div>
  </div>
</template>
