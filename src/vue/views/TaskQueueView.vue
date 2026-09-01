<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ClipboardList, Search } from '@lucide/vue'
import {
  deleteAnalysisTask,
  getTaskDisplayName,
  getTaskDisplaySubtitle,
  getTaskObjectSummary,
  getUniqueTaskModels,
  type AnalysisObjectType,
  type AnalysisTaskRecord,
  type AnalysisTaskStatus,
} from '@/lib/analysisTasks'
import { useAnalysisTasks } from '../composables/useAnalysisTasks'
import TaskNameHover from '../components/TaskNameHover.vue'

const router = useRouter()
const { tasks, refresh } = useAnalysisTasks(true)
const keyword = ref('')
const statusFilter = ref<'全部状态' | AnalysisTaskStatus>('全部状态')
const objectFilter = ref<'全部对象' | AnalysisObjectType>('全部对象')

const statuses: AnalysisTaskStatus[] = ['待分析', '排队中', '正在分析', '已停止', '分析完成', '失败']
const summary = computed(() => statuses.reduce<Record<string, number>>((result, status) => {
  result[status] = tasks.value.filter((item) => item.status === status).length
  return result
}, { total: tasks.value.length }))
const filteredTasks = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return tasks.value.filter((task) => {
    const text = `${getTaskDisplayName(task)} ${task.objects.map((item) => item.name).join(' ')} ${task.sourceLabel} ${task.objectType} ${task.objectCount} ${getUniqueTaskModels(task).map((model) => model.name).join(' ')}`.toLowerCase()
    return (!query || text.includes(query))
      && (statusFilter.value === '全部状态' || task.status === statusFilter.value)
      && (objectFilter.value === '全部对象' || task.objectType === objectFilter.value)
  })
})

function progress(task: AnalysisTaskRecord) {
  if (!task.models.length) return 0
  return Math.round(task.models.reduce((total, run) => total + (run.status === '分析完成' ? 100 : Math.max(0, Math.min(100, run.progress ?? 0))), 0) / task.models.length)
}

function statusText(task: AnalysisTaskRecord) {
  const value = progress(task)
  if (task.status === '分析完成') return '分析完成 100%'
  if (task.status === '正在分析') return `分析中 ${value}%`
  return `${task.status} ${value}%`
}

function statusClass(status: AnalysisTaskStatus) {
  return {
    '待分析': 'border-[#8f35b7]/45 bg-[#8f35b7]/15 text-[#d292f4]',
    '排队中': 'border-[#8f35b7]/45 bg-[#8f35b7]/15 text-[#d292f4]',
    '正在分析': 'border-[#eab65b]/40 bg-[#eab65b]/10 text-[#f4c577]',
    '分析完成': 'border-[#84cc16]/35 bg-[#84cc16]/10 text-[#95d94e]',
    '失败': 'border-[#ff9c9c]/45 bg-[#ff9c9c]/10 text-[#ffb4b4]',
    '已停止': 'border-[#64748b]/45 bg-[#64748b]/10 text-[#cbd5e1]',
  }[status]
}

function openWorkbench(task: AnalysisTaskRecord) {
  router.push(`/workbench/run/${task.id}`)
}

function removeTask(id: string) {
  deleteAnalysisTask(id)
  refresh()
}
</script>

<template>
  <div class="min-h-[calc(100dvh-64px)] bg-[#0f1014] px-4 py-5 text-[#f1f3f6] lg:px-6">
    <div class="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div><h1 class="text-[26px] font-bold">分析任务</h1><p class="mt-1 text-sm">统一沉淀由模型中心、WSI 管理、Case 管理和研究项目管理创建的 AI 分析任务。</p></div>
      <button class="btn-primary" @click="router.push('/explore')">去模型中心新建任务</button>
    </div>

    <div class="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
      <div v-for="item in [
        ['任务总数', summary.total], ['待分析', summary['待分析']], ['排队中', summary['排队中']], ['正在分析', summary['正在分析']], ['已停止', summary['已停止']], ['分析完成', summary['分析完成']], ['失败', summary['失败']],
      ]" :key="String(item[0])" class="rounded-lg border border-white/[0.08] bg-[#202126] p-4">
        <div class="mb-2 text-sm text-[#64748b]">{{ item[0] }}</div><div class="flex items-center gap-2 text-2xl font-bold"><ClipboardList v-if="item[0] === '任务总数'" :size="21" class="text-[#d292f4]" />{{ item[1] }}</div>
      </div>
    </div>

    <section class="overflow-hidden rounded-lg border border-white/[0.08] bg-[#202126]">
      <header class="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        <div><h2 class="font-semibold">任务列表</h2><p class="mt-0.5 text-xs">只展示仍包含分析对象的任务。</p></div>
        <div class="flex flex-1 flex-wrap justify-end gap-2">
          <label class="flex h-9 min-w-[240px] max-w-[320px] flex-1 items-center gap-2 rounded-md border border-white/[0.08] bg-[#17181d] px-3"><Search :size="15" class="text-[#64748b]" /><input v-model="keyword" class="w-full bg-transparent text-sm outline-none" placeholder="搜索任务编号 / WSI / 来源 / 模型" /></label>
          <select v-model="statusFilter" class="filter"><option>全部状态</option><option v-for="status in statuses" :key="status">{{ status }}</option></select>
          <select v-model="objectFilter" class="filter"><option>全部对象</option><option>WSI</option><option>Case</option><option>研究项目</option></select>
        </div>
      </header>

      <div v-if="!filteredTasks.length" class="flex min-h-[260px] flex-col items-center justify-center px-6 text-center"><span class="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-[#8f35b7]/15 text-[#d292f4]"><ClipboardList :size="24" /></span><h3 class="text-lg font-semibold">暂无分析任务</h3><p class="mt-2 max-w-[520px] text-sm">请从模型中心运行模型，或从 WSI、Case、研究项目管理发起分析。</p></div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[1050px] table-fixed text-sm">
          <thead class="bg-[#252730] text-[#cbd5e1]"><tr><th class="w-[23%]">任务编号</th><th>来源</th><th>对象类型</th><th>分析规模</th><th class="w-[17%]">AI 模型</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead>
          <tbody><tr v-for="task in filteredTasks" :key="task.id" class="cursor-pointer border-b border-white/[0.06] hover:bg-white/[0.025]" @dblclick="openWorkbench(task)"><td><TaskNameHover :task="task" name-class="block truncate" /><small class="mt-1 block truncate text-[#64748b]">{{ getTaskDisplaySubtitle(task) }}</small></td><td>{{ task.sourceLabel }}</td><td>{{ task.objectType }}</td><td><b class="block font-medium text-[#e2e8f0]">{{ getTaskObjectSummary(task).primary }}</b><small v-if="getTaskObjectSummary(task).secondary" class="mt-1 block text-[#64748b]">{{ getTaskObjectSummary(task).secondary }}</small></td><td><span v-for="model in getUniqueTaskModels(task)" :key="model.id" class="mr-1 inline-flex rounded border border-[#8f35b7]/40 bg-[#8f35b7]/15 px-2 py-1 text-xs text-[#d292f4]">{{ model.name }}</span></td><td><span :class="['inline-flex rounded-md border px-2 py-1 text-xs', statusClass(task.status)]">{{ statusText(task) }}</span></td><td class="text-xs text-[#94a3b8]">{{ task.createdAt }}</td><td @dblclick.stop><div class="flex gap-3"><button class="text-xs text-[#d292f4]" @click="router.push(`/workbench/run/${task.id}`)">{{ task.status === '分析完成' ? '查看结果' : '打开工作台' }}</button><button class="text-xs text-[#ff9c9c]" @click="removeTask(task.id)">删除</button></div></td></tr></tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.filter { height: 36px; border: 1px solid rgb(255 255 255 / .08); border-radius: 6px; background: #17181d; padding: 0 12px; color: #cbd5e1; outline: none; }
th, td { padding: 12px; text-align: left; }
th { font-weight: 600; }
</style>
