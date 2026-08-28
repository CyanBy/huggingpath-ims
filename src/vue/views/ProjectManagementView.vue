<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Database, FolderOpen, Play, Plus, Search, Users, X } from '@lucide/vue'
import { createTaskFromProject } from '@/lib/analysisTasks'
import { getPathologySiteLabel } from '@/lib/pathologySpecimens'
import { useWorkspaceData } from '../composables/useWorkspaceData'
import { writeWorkspaceProjects, type WorkspaceProject } from '../data/pathologyWorkspace'

type DetailTab = 'overview' | 'cases' | 'wsis' | 'members'
const router = useRouter()
const { projects, cases, wsis, refresh } = useWorkspaceData()
const keyword = ref('')
const currentId = ref<string | null>(null)
const tab = ref<DetailTab>('overview')
const createOpen = ref(false)
const newProject = ref({ name: '', description: '', visibility: 'private' as WorkspaceProject['visibility'], tags: '' })
const error = ref('')
const filtered = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return projects.value.filter((item) => !query || `${item.name} ${item.id} ${item.description} ${item.tags.join(' ')}`.toLowerCase().includes(query))
})
const current = computed(() => projects.value.find((item) => item.id === currentId.value) || null)
const projectCases = computed(() => cases.value.filter((item) => current.value?.caseIds.includes(item.id)))
const projectWsis = computed(() => wsis.value.filter((item) => current.value?.standaloneWsiIds.includes(item.id) || current.value?.caseIds.includes(item.boundCase)))

function openProject(project: WorkspaceProject) { currentId.value = project.id; tab.value = 'overview' }
function startProject(project: WorkspaceProject) {
  const linkedCases = cases.value.filter((item) => project.caseIds.includes(item.id))
  const linkedWsis = wsis.value.filter((item) => project.standaloneWsiIds.includes(item.id) || project.caseIds.includes(item.boundCase))
  const task = createTaskFromProject({ projectId: project.id, projectName: project.name, cases: linkedCases.map((item) => ({ id: item.id, sampleId: item.id, site: item.site, wsiCount: linkedWsis.filter((wsi) => wsi.boundCase === item.id).length })), wsis: linkedWsis.map((item) => ({ id: item.id, name: item.fileName, caseId: item.boundCase === '未绑定' ? undefined : item.boundCase, stain: item.stain, size: item.size, site: item.site })) })
  router.push(`/workbench/run/${task.id}`)
}
function createProject() {
  error.value = ''
  if (!newProject.value.name.trim()) return error.value = '请输入项目名称。'
  const id = `PRJ-${new Date().getFullYear()}-${String(projects.value.length + 1).padStart(3, '0')}`
  writeWorkspaceProjects([{ id, name: newProject.value.name.trim(), description: newProject.value.description.trim(), tags: newProject.value.tags.split(/[,，]/).map((item) => item.trim()).filter(Boolean), caseIds: [], standaloneWsiIds: [], memberCount: 1, updatedAt: new Date().toISOString().slice(0, 10), visibility: newProject.value.visibility }, ...projects.value])
  createOpen.value = false; newProject.value = { name: '', description: '', visibility: 'private', tags: '' }; refresh()
}
</script>

<template>
  <div class="min-h-[calc(100dvh-64px)] px-4 py-5 lg:px-6">
    <template v-if="!current">
      <header class="mb-5 flex flex-wrap items-start justify-between gap-4"><div><h1 class="text-2xl font-bold">研究项目管理</h1><p class="mt-1 text-sm">按研究维度组织 Case、WSI、成员和分析任务。</p></div><div class="flex gap-2"><label class="flex h-9 items-center gap-2 rounded-md border border-white/[0.08] bg-[#17181d] px-3"><Search :size="15" class="text-[#64748b]" /><input v-model="keyword" class="w-[230px] bg-transparent text-sm outline-none" placeholder="搜索项目名称 / 编号" /></label><button class="btn-primary h-9" @click="createOpen=true"><Plus :size="16" />新建项目</button></div></header><div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-4"><article v-for="project in filtered" :key="project.id" class="rounded-lg border border-white/[0.08] bg-[#202126] p-5"><div class="flex items-center justify-between"><code class="text-xs text-[#64748b]">{{ project.id }}</code><span class="rounded-full px-2 py-1 text-xs" :class="project.visibility==='public'?'bg-[#22c55e]/10 text-[#6ee7a0]':'bg-white/[0.05] text-[#94a3b8]'">{{ project.visibility==='public'?'公开':'私有' }}</span></div><h2 class="mt-3 text-lg font-semibold">{{ project.name }}</h2><p class="mt-2 min-h-[48px] text-sm leading-6">{{ project.description }}</p><div class="mt-4 grid grid-cols-3 border-y border-white/[0.06] py-4 text-sm"><span><small>Case</small><b>{{ project.caseIds.length }}</b></span><span><small>WSI</small><b>{{ wsis.filter(item=>project.standaloneWsiIds.includes(item.id)||project.caseIds.includes(item.boundCase)).length }}</b></span><span><small>成员</small><b>{{ project.memberCount }}</b></span></div><div class="mt-4 flex items-center justify-between"><span class="text-xs text-[#64748b]">更新于 {{ project.updatedAt }}</span><div class="flex gap-2"><button class="btn-secondary h-8 px-3" @click="startProject(project)"><Play :size="13" />推理</button><button class="btn-secondary h-8 px-3 text-[#d292f4]" @click="openProject(project)">查看项目</button></div></div></article></div>
    </template>
    <template v-else>
      <header class="mb-5"><button class="mb-4 inline-flex items-center gap-2 text-sm text-[#d292f4]" @click="currentId=null"><ArrowLeft :size="16" />返回研究项目列表</button><div class="flex flex-wrap items-start justify-between gap-4"><div><code class="text-xs text-[#64748b]">{{ current.id }}</code><h1 class="mt-1 text-2xl font-bold">{{ current.name }}</h1><p class="mt-2 text-sm">{{ current.description }}</p></div><button class="btn-primary" @click="startProject(current)"><Play :size="16" />创建项目分析任务</button></div></header><nav class="mb-5 flex gap-1 border-b border-white/[0.07]"><button v-for="item in [{key:'overview',label:'项目概览'},{key:'cases',label:`Case (${projectCases.length})`},{key:'wsis',label:`WSI (${projectWsis.length})`},{key:'members',label:`成员 (${current.memberCount})`}]" :key="item.key" :class="['tab',tab===item.key&&'active']" @click="tab=item.key as DetailTab">{{ item.label }}</button></nav><div v-if="tab==='overview'" class="grid gap-4 lg:grid-cols-3"><section class="rounded-lg border border-white/[0.08] bg-[#202126] p-5 lg:col-span-2"><h2 class="font-semibold">研究范围</h2><p class="mt-3 leading-7">{{ current.description }}</p><div class="mt-5 flex flex-wrap gap-2"><span v-for="tag in current.tags" :key="tag" class="rounded bg-[#8f35b7]/15 px-2 py-1 text-xs text-[#d292f4]">{{ tag }}</span></div></section><section class="rounded-lg border border-white/[0.08] bg-[#202126] p-5"><h2 class="font-semibold">资源摘要</h2><div class="mt-4 grid gap-3"><div class="summary"><FolderOpen :size="17" />{{ projectCases.length }} 个 Case</div><div class="summary"><Database :size="17" />{{ projectWsis.length }} 张 WSI</div><div class="summary"><Users :size="17" />{{ current.memberCount }} 位成员</div></div></section></div><section v-else-if="tab==='cases'" class="overflow-hidden rounded-lg border border-white/[0.08] bg-[#202126]"><table class="w-full text-sm"><thead class="bg-[#252730]"><tr><th>Case</th><th>取材部位</th><th>取材方式</th><th>WSI</th><th>操作</th></tr></thead><tbody><tr v-for="item in projectCases" :key="item.id" class="border-t border-white/[0.06]"><td class="font-mono">{{ item.id }}</td><td>{{ getPathologySiteLabel(item.site) }}</td><td>{{ item.samplingMethod }}</td><td>{{ wsis.filter(w=>w.boundCase===item.id).length }}</td><td><button class="text-[#d292f4]" @click="router.push(`/workbench/cases/${item.id}`)">查看</button></td></tr></tbody></table></section><section v-else-if="tab==='wsis'" class="overflow-hidden rounded-lg border border-white/[0.08] bg-[#202126]"><table class="w-full text-sm"><thead class="bg-[#252730]"><tr><th>WSI</th><th>Case</th><th>染色</th><th>大小</th><th>操作</th></tr></thead><tbody><tr v-for="item in projectWsis" :key="item.id" class="border-t border-white/[0.06]"><td class="font-mono">{{ item.fileName }}</td><td>{{ item.boundCase }}</td><td>{{ item.stain }}</td><td>{{ item.size }}</td><td><button class="text-[#d292f4]" @click="router.push(`/workbench/wsi?preview=${item.id}`)">查看</button></td></tr></tbody></table></section><section v-else class="rounded-lg border border-white/[0.08] bg-[#202126] p-5"><h2 class="font-semibold">项目成员</h2><div class="mt-4 divide-y divide-white/[0.06]"><div v-for="member in ['项目所有者','Zhang San','Li Ming','Dr. Chen'].slice(0,current.memberCount)" :key="member" class="flex items-center justify-between py-3"><span class="flex items-center gap-3"><span class="grid h-8 w-8 place-items-center rounded-full bg-[#8f35b7]/15 text-[#d292f4]">{{ member.slice(0,1) }}</span>{{ member }}</span><span class="text-xs text-[#64748b]">{{ member==='项目所有者'?'所有者':'研究员' }}</span></div></div></section>
    </template>

    <Teleport to="body"><div v-if="createOpen" class="fixed inset-0 z-[130] grid place-items-center bg-black/75 px-4" @click.self="createOpen=false"><form class="w-full max-w-[620px] rounded-lg border border-white/[0.10] bg-[#202126]" @submit.prevent="createProject"><header class="flex justify-between border-b border-white/[0.08] p-5"><div><h2 class="text-lg font-semibold">新建研究项目</h2><p class="mt-1 text-xs">创建后可添加 Case、WSI 和项目成员。</p></div><button type="button" @click="createOpen=false"><X :size="19" /></button></header><div class="grid gap-4 p-5"><label class="field">项目名称 *<input v-model="newProject.name" /></label><label class="field">项目说明<textarea v-model="newProject.description" /></label><label class="field">标签<input v-model="newProject.tags" placeholder="使用逗号分隔" /></label><label class="field">可见性<select v-model="newProject.visibility"><option value="private">私有</option><option value="public">公开</option></select></label><p v-if="error" class="text-sm text-[#ff9c9c]">{{ error }}</p></div><footer class="flex justify-end gap-2 border-t border-white/[0.08] p-4"><button type="button" class="btn-secondary" @click="createOpen=false">取消</button><button class="btn-primary" type="submit">创建项目</button></footer></form></div></Teleport>
  </div>
</template>

<style scoped>
article small{display:block;color:#64748b;font-size:11px}article b{display:block;margin-top:3px}.tab{border-bottom:2px solid transparent;padding:11px 16px;color:#94a3b8;font-size:14px}.tab.active{border-color:#8f35b7;color:#d292f4}.summary{display:flex;align-items:center;gap:9px;border:1px solid rgb(255 255 255 / .07);border-radius:6px;background:#17181d;padding:12px;color:#cbd5e1;font-size:14px}th,td{padding:12px 14px;text-align:left}th{font-weight:600;color:#cbd5e1}.field{display:grid;gap:7px;color:#cbd5e1;font-size:13px}.field input,.field select,.field textarea{border:1px solid rgb(255 255 255 / .08);border-radius:6px;background:#17181d;padding:9px 10px;color:#e2e8f0;outline:none}.field textarea{min-height:82px;resize:vertical}
</style>
