<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertTriangle, ArrowLeft, Eye, FileText, UserRound } from '@lucide/vue'
import { publicCases } from '../data/publicData'

const route = useRoute()
const router = useRouter()
const caseId = computed(() => String(route.params.caseId || ''))
const current = computed(() => publicCases.find((item) => item.caseId === caseId.value))

function statusClass(value: string) {
  if (value === '分析完成') return 'border-[#84cc16]/35 bg-[#84cc16]/10 text-[#95d94e]'
  if (value === '分析中') return 'border-[#5d8eff]/35 bg-[#5d8eff]/10 text-[#9db8ff]'
  if (value === '分析失败') return 'border-[#ff9c9c]/35 bg-[#ff9c9c]/10 text-[#ffb4b4]'
  return 'border-[#64748b]/35 bg-[#64748b]/10 text-[#cbd5e1]'
}
</script>

<template>
  <div v-if="!current" class="section-container grid min-h-[60dvh] place-items-center">
    <div class="max-w-[560px] rounded-lg border border-white/[0.08] bg-[#202126] px-8 py-10 text-center">
      <span class="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[#eab65b]/10 text-[#f4c577]"><AlertTriangle :size="23" /></span>
      <h1 class="mt-4 text-xl font-bold">未找到公开病例</h1>
      <p class="mt-2 text-sm text-[#94a3b8]">病例 {{ caseId }} 不在当前公开病例库中，可能已下架或链接有误。</p>
      <button class="btn-primary mt-6" @click="router.push('/cases')">返回病例库</button>
    </div>
  </div>

  <div v-else class="min-h-[calc(100dvh-64px)] bg-[#0f1014] px-4 py-6 text-[#f1f3f6] lg:px-6">
    <button class="mb-4 inline-flex items-center gap-2 text-sm text-[#d292f4]" @click="router.push('/cases')"><ArrowLeft :size="16" />返回病例库</button>

    <section class="rounded-lg border border-white/[0.08] bg-[#202126] p-5">
      <header class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div class="mb-2 flex flex-wrap items-center gap-2">
            <code class="text-sm text-[#d292f4]">{{ current.caseId }}</code>
            <span class="rounded border border-white/[0.10] bg-white/[0.04] px-2 py-0.5 text-[11px] text-[#94a3b8]">公开只读</span>
          </div>
          <h1 class="text-2xl font-bold">{{ current.description }}</h1>
          <p class="mt-2 text-sm text-[#94a3b8]">公开病例仅用于科研浏览，不支持编辑、添加或删除 WSI。</p>
        </div>
        <span :class="['rounded-md border px-3 py-1.5 text-xs font-semibold', statusClass(current.status)]">{{ current.status }}</span>
      </header>

      <div class="mt-5 grid gap-3 border-t border-white/[0.06] pt-5 sm:grid-cols-2 xl:grid-cols-5">
        <div v-for="item in [['Case 编号', current.caseId], ['患者', current.patient], ['取材部位', current.site], ['取材方式', current.sampling], ['WSI 数', current.slideCount]]" :key="String(item[0])" class="rounded-lg border border-white/[0.08] bg-[#17181d] p-4">
          <small class="text-[#64748b]">{{ item[0] }}</small>
          <div class="mt-2 text-lg font-semibold">{{ item[1] }}</div>
        </div>
      </div>
    </section>

    <div class="mt-5 grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside class="rounded-lg border border-white/[0.08] bg-[#202126] p-5">
        <h2 class="flex items-center gap-2 font-semibold"><UserRound :size="17" class="text-[#d292f4]" />病例摘要</h2>
        <dl class="mt-4 grid gap-4 text-sm">
          <div><dt>患者信息</dt><dd>{{ current.patientMeta }}</dd></div>
          <div><dt>病例描述</dt><dd>{{ current.description }}</dd></div>
          <div><dt>创建时间</dt><dd>{{ current.createdAt }}</dd></div>
          <div><dt>数据权限</dt><dd>公开浏览</dd></div>
        </dl>
        <div class="mt-5 rounded-md border border-[#8f35b7]/25 bg-[#8f35b7]/10 p-3 text-xs leading-5 text-[#c9a3d9]">
          <Eye :size="15" class="mr-1 inline" />页面展示的是去标识化演示数据，仅用于产品交互预览。
        </div>
      </aside>

      <section class="overflow-hidden rounded-lg border border-white/[0.08] bg-[#202126]">
        <header class="flex items-center justify-between gap-3 border-b border-white/[0.06] p-4">
          <div><h2 class="flex items-center gap-2 font-semibold"><FileText :size="17" class="text-[#d292f4]" />关联 WSI</h2><p class="mt-1 text-xs text-[#64748b]">公开病例下可浏览的病理切片摘要</p></div>
          <span class="text-xs text-[#94a3b8]">共 {{ current.slides.length }} 张</span>
        </header>
        <div v-if="!current.slides.length" class="grid min-h-[240px] place-items-center px-6 text-center">
          <div><span class="mx-auto grid h-11 w-11 place-items-center rounded-lg bg-white/[0.04] text-[#64748b]"><FileText :size="21" /></span><h3 class="mt-3 font-semibold">暂无公开 WSI</h3><p class="mt-1 text-sm text-[#64748b]">该病例目前只公开了病例摘要。</p></div>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[720px] text-sm">
            <thead class="bg-[#252730]"><tr><th>文件名</th><th>染色</th><th>格式</th><th>文件大小</th><th>分析状态</th></tr></thead>
            <tbody><tr v-for="slide in current.slides" :key="slide.id" class="border-t border-white/[0.06]"><td><span class="font-mono text-[#d292f4]">{{ slide.fileName }}</span></td><td>{{ slide.stain }}</td><td>{{ slide.format }}</td><td>{{ slide.size }}</td><td><span :class="['inline-flex rounded-md border px-2 py-1 text-xs', statusClass(slide.status)]">{{ slide.status }}</span></td></tr></tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
th, td { padding: 12px 14px; text-align: left; }
th { color: #cbd5e1; font-weight: 600; }
dt { color: #64748b; font-size: 11px; }
dd { margin-top: 4px; color: #e2e8f0; }
</style>
