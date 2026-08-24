<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowRight, BarChart3, Box, Check, Code, GitFork, HeartPulse, Microscope, Network, Server, ShieldCheck, Users } from '@lucide/vue'

const router = useRouter()
const leaderboard = [
  ['1', 'CellViT++', '胃、肠、乳腺', '0.89', '0.85', '0.92'],
  ['2', 'Hover-Net', '肺、肝、肾', '0.85', '0.82', '0.88'],
  ['3', 'DeepLIIF', '乳腺、前列腺', '0.82', '0.88', '-'],
  ['4', 'TME Analyzer', '胃、肠、肺', '0.78', '-', '0.91'],
]
</script>

<template>
  <div>
    <section class="border-b border-white/[0.06] pb-14 pt-20"><div class="section-container max-w-[1040px]"><span class="text-xs tracking-[.16em] text-[#64748b]">ABOUT HUGGINGPATH</span><h1 class="mt-3 text-4xl font-semibold">让病理 AI 更容易进入真实研究流程</h1><p class="mt-5 max-w-[760px] text-lg leading-8">HuggingPath 将模型发现、病理数据管理、任务运行与机构治理放在同一个工作环境中，让研究者把时间用于判断结果，而不是在工具之间搬运上下文。</p></div></section>
    <section class="section-container max-w-[1040px] py-14"><div class="grid grid-cols-2 gap-4 border-y border-white/[0.07] py-6 sm:grid-cols-4"><div v-for="item in [['50+','开源AI模型'],['200+','公开数据集'],['1,000+','社区用户'],['30+','贡献者']]" :key="item[1]" class="text-center"><strong class="text-2xl text-[#e2e8f0]">{{ item[0] }}</strong><small class="mt-1 block text-[#64748b]">{{ item[1] }}</small></div></div><div class="mt-12 grid gap-5 md:grid-cols-3"><article v-for="item in [
      { icon: Box, title: '模型统一管理', text: '统一描述开源模型能力、运行要求与版本，支持从模型中心快速创建任务。' },
      { icon: Microscope, title: 'WSI分析工作台', text: '支持多层级查看、标注叠加、模型进度和结果可视化。' },
      { icon: BarChart3, title: '标准化评估体系', text: '通过公开验证集与统一指标比较模型输出，保留完整分析记录。' },
    ]" :key="item.title" class="rounded-lg border border-white/[0.07] bg-[#202126] p-6"><component :is="item.icon" :size="23" class="text-[#d292f4]" /><h2 class="mt-4 font-semibold">{{ item.title }}</h2><p class="mt-2 text-sm leading-6">{{ item.text }}</p></article></div></section>
    <section class="border-y border-white/[0.06] bg-[#17181d]"><div class="section-container max-w-[1040px] grid gap-10 py-14 lg:grid-cols-[1fr_1.2fr]"><div><span class="text-xs tracking-[.14em] text-[#64748b]">DESIGN PRINCIPLES</span><h2 class="mt-3 text-2xl font-semibold">围绕病理工作流设计</h2></div><div class="grid gap-5 sm:grid-cols-2"><div v-for="item in [{icon:HeartPulse,title:'临床语义优先'},{icon:Network,title:'关系而非孤立文件'},{icon:Users,title:'团队协作'},{icon:ShieldCheck,title:'研究合规'}]" :key="item.title" class="flex items-center gap-3"><span class="grid h-9 w-9 place-items-center rounded-md bg-[#8f35b7]/15 text-[#d292f4]"><component :is="item.icon" :size="18" /></span><span class="text-sm font-medium">{{ item.title }}</span></div></div></div></section>

    <section class="section-container max-w-[1040px] py-14"><div class="mb-6"><span class="text-xs tracking-[.14em] text-[#64748b]">BENCHMARK</span><h2 class="mt-2 text-2xl font-semibold">模型性能排行</h2><p class="mt-2 text-sm">基于标准病理数据集的统一评估结果。</p></div><div class="overflow-x-auto rounded-lg border border-white/[0.08]"><table class="w-full min-w-[720px] text-sm"><thead class="bg-[#252730]"><tr><th>排名</th><th>模型</th><th>适用组织</th><th>F1</th><th>Dice</th><th>AUC</th></tr></thead><tbody><tr v-for="row in leaderboard" :key="row[0]" class="border-t border-white/[0.06]"><td class="text-[#d292f4]">#{{ row[0] }}</td><td class="font-semibold">{{ row[1] }}</td><td>{{ row[2] }}</td><td>{{ row[3] }}</td><td>{{ row[4] }}</td><td>{{ row[5] }}</td></tr></tbody></table></div></section>

    <section class="border-y border-white/[0.06] bg-[#17181d] py-14"><div class="section-container max-w-[1040px]"><span class="text-xs tracking-[.14em] text-[#64748b]">ROADMAP</span><h2 class="mt-2 text-2xl font-semibold">HuggingPath 的演进计划</h2><div class="mt-7 grid gap-4 md:grid-cols-3"><article v-for="(item,index) in [
      ['Phase 1 · 核心工作台','WSI 加载、模型运行、任务调度与结果可视化。'],
      ['Phase 2 · 模型生态','模型验证、公开排行榜、社区评价和模型贡献流程。'],
      ['Phase 3 · 临床套件','病例管理、标准化报告和可编排研究工作流。'],
    ]" :key="item[0]" class="rounded-lg border border-white/[0.08] bg-[#202126] p-5"><div class="flex items-center justify-between"><b>{{ item[0] }}</b><span :class="index===0?'text-[#6ee7a0]':'text-[#64748b]'">{{ index===0?'当前阶段':'规划中' }}</span></div><p class="mt-3 text-sm leading-6">{{ item[1] }}</p><div class="mt-4 flex items-center gap-2 text-xs text-[#94a3b8]"><Check :size="14" class="text-[#d292f4]" />持续交付与验证</div></article></div></div></section>

    <section class="section-container max-w-[1040px] py-14"><div class="grid gap-5 md:grid-cols-3"><article v-for="item in [
      {icon:ShieldCheck,title:'数据隐私保护',text:'机构、角色和项目共同限定数据访问范围。'},
      {icon:Server,title:'本地优先架构',text:'模型和病理数据可以在本地环境完成运行与管理。'},
      {icon:Code,title:'开源哲学',text:'模型接口、评估方法与工作流持续保持开放和可复现。'},
    ]" :key="item.title" class="border-t border-white/[0.10] pt-5"><component :is="item.icon" :size="21" class="text-[#d292f4]" /><h2 class="mt-4 font-semibold">{{ item.title }}</h2><p class="mt-2 text-sm leading-6">{{ item.text }}</p></article></div></section>

    <section class="border-t border-white/[0.06] bg-[#202126] py-14"><div class="section-container max-w-[1040px] flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center"><div><h2 class="text-2xl font-semibold">一起构建病理AI的未来</h2><p class="mt-2 text-sm">无论您是病理医生、AI 研究者还是开发者，都欢迎加入社区。</p></div><div class="flex gap-3"><button class="btn-secondary" @click="router.push('/explore')"><GitFork :size="16" />查看模型</button><button class="btn-primary" @click="router.push('/login')">加入社区 <ArrowRight :size="15" /></button></div></div></section>
  </div>
</template>

<style scoped>
th,td{padding:12px 14px;text-align:left}th{color:#cbd5e1;font-weight:600}
</style>
