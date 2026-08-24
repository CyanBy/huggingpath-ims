<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowRight, BarChart3, BrainCircuit, Database, Layers, Microscope, Network, Play, Search, ShieldCheck, SlidersHorizontal, Upload, Users, Workflow } from '@lucide/vue'
import { MODEL_CATALOG } from '@/lib/modelCatalog'

const router = useRouter()
</script>

<template>
  <div>
    <section class="relative flex min-h-[620px] items-end overflow-hidden border-b border-white/[0.06] pb-16 pt-28 lg:min-h-[720px]">
      <img src="/wsi-demo.jpg" alt="病理切片预览" class="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,16,20,.98)_0%,rgba(15,16,20,.8)_48%,rgba(15,16,20,.42)_100%)]" />
      <div class="section-container relative">
        <div class="max-w-[760px]">
          <span class="inline-flex items-center gap-2 rounded-full border border-[#8f35b7]/40 bg-[#8f35b7]/15 px-3 py-1 text-xs text-[#d292f4]"><Microscope :size="14" />PATHOLOGY AI WORKBENCH</span>
          <h1 class="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">HuggingPath</h1>
          <p class="mt-5 max-w-[680px] text-lg leading-8 text-[#aab4c4]">连接病理切片、Case、研究项目与开源 AI 模型，在一个工作台中完成分析、验证和结果管理。</p>
          <div class="mt-8 flex flex-wrap gap-3"><button class="btn-primary h-11 px-6" @click="router.push('/explore')"><Play :size="17" />探索模型</button><button class="btn-secondary h-11 px-6" @click="router.push('/workbench/tasks')">进入分析工作台 <ArrowRight :size="16" /></button></div>
        </div>
      </div>
    </section>

    <section class="section-container py-16">
      <div class="grid gap-5 md:grid-cols-3">
        <article v-for="item in [
          { icon: Database, title: '统一管理病理数据', text: 'WSI、Case 和研究项目保持清晰关联，避免分析对象在不同入口间失去上下文。' },
          { icon: Network, title: '模型与任务互通', text: '从模型或数据出发创建任务，统一在任务列表和工作台追踪每张切片的进度。' },
          { icon: ShieldCheck, title: '机构与权限治理', text: '账号、角色、机构和数据权限使用同一目录，满足团队协作与管理要求。' },
        ]" :key="item.title" class="rounded-lg border border-white/[0.07] bg-[#202126] p-6"><span class="grid h-10 w-10 place-items-center rounded-lg bg-[#8f35b7]/15 text-[#d292f4]"><component :is="item.icon" :size="20" /></span><h2 class="mt-5 text-lg font-semibold">{{ item.title }}</h2><p class="mt-2 text-sm leading-6">{{ item.text }}</p></article>
      </div>
    </section>

    <section class="border-y border-white/[0.06] bg-[#17181d] py-16">
      <div class="section-container">
        <div class="mb-9 max-w-[720px]"><p class="text-xs uppercase tracking-[.14em]">ANALYSIS WORKFLOW</p><h2 class="mt-2 text-2xl font-semibold">四步完成病理AI分析</h2><p class="mt-3 text-sm leading-6">从加载切片到获取可视化结果，无需编写任何代码。</p></div>
        <div class="grid gap-4 md:grid-cols-4">
          <article v-for="(step,index) in [
            {icon:Upload,title:'上传病理切片',text:'支持常见 WSI 文件与 DICOM 文件夹批量导入。'},
            {icon:Search,title:'选择分析对象',text:'从 WSI、Case 或研究项目中选择本次分析范围。'},
            {icon:BrainCircuit,title:'配置 AI 模型',text:'按染色类型选择适用模型，支持一张切片运行多个任务。'},
            {icon:BarChart3,title:'查看分析结果',text:'在工作台查看进度、叠加标注并管理模型输出。'},
          ]" :key="step.title" class="relative border-t border-white/[0.10] pt-5">
            <span class="absolute right-0 top-4 text-3xl font-semibold text-white/[0.04]">0{{ index + 1 }}</span>
            <span class="grid h-10 w-10 place-items-center rounded-md bg-[#8f35b7]/15 text-[#d292f4]"><component :is="step.icon" :size="20" /></span>
            <h3 class="mt-4 font-semibold">{{ step.title }}</h3><p class="mt-2 text-sm leading-6">{{ step.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="py-16">
      <div class="section-container"><div class="mb-7 flex items-end justify-between"><div><p class="text-xs uppercase tracking-[.14em]">MODEL CATALOG</p><h2 class="mt-2 text-2xl font-semibold">当前可用模型</h2></div><button class="text-sm text-[#d292f4]" @click="router.push('/explore')">查看全部 <ArrowRight :size="14" class="inline" /></button></div><div class="grid gap-4 md:grid-cols-3"><button v-for="model in MODEL_CATALOG.slice(0,3)" :key="model.id" class="rounded-lg border border-white/[0.07] bg-[#202126] p-5 text-left hover:border-[#8f35b7]/40" @click="router.push(`/model/${encodeURIComponent(model.id)}`)"><h3 class="font-semibold">{{ model.name }}</h3><code class="mt-1 block text-xs text-[#64748b]">{{ model.id }}</code><p class="mt-3 text-sm leading-6">{{ model.summary }}</p></button></div></div>
    </section>

    <section class="border-y border-white/[0.06] bg-[#17181d] py-16">
      <div class="section-container grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
        <div><p class="text-xs uppercase tracking-[.14em]">AI WORKBENCH</p><h2 class="mt-2 text-2xl font-semibold">为病理AI量身打造的工作台</h2><p class="mt-4 max-w-[520px] text-sm leading-7">集成模型管理、WSI 查看、分析执行和结果可视化，在同一上下文中完成重复研究工作。</p><button class="btn-secondary mt-6" @click="router.push('/workbench/tasks')">进入工作台 <ArrowRight :size="15" /></button></div>
        <div class="grid gap-4 sm:grid-cols-2">
          <article v-for="item in [
            {icon:Layers,title:'多层结果查看',text:'真实标注与模型输出可以独立开关、调节透明度。'},
            {icon:SlidersHorizontal,title:'精细运行控制',text:'按切片停止、重新分析，并查看每个模型的独立进度。'},
            {icon:Workflow,title:'任务统一追踪',text:'从不同数据入口创建的任务进入同一队列和工作台。'},
            {icon:Database,title:'数据关系保留',text:'在 WSI、Case 与项目之间跳转时保留选择和来源上下文。'},
          ]" :key="item.title" class="border-l border-[#8f35b7]/45 pl-4"><component :is="item.icon" :size="18" class="text-[#d292f4]" /><h3 class="mt-3 font-semibold">{{ item.title }}</h3><p class="mt-2 text-sm leading-6">{{ item.text }}</p></article>
        </div>
      </div>
    </section>

    <section class="section-container py-16">
      <div class="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div><p class="text-xs uppercase tracking-[.14em]">OPEN COMMUNITY</p><h2 class="mt-2 text-2xl font-semibold">共建病理AI社区</h2><p class="mt-4 text-sm leading-7">开源、开放、协作，让优秀的病理 AI 模型被更多研究者发现、验证和使用。</p><div class="mt-7 grid grid-cols-3 gap-3"><div v-for="item in [['8+','开源模型'],['12','研究项目'],['4','协作机构']]" :key="item[1]" class="border-t border-white/[0.10] pt-3"><strong class="text-2xl">{{ item[0] }}</strong><small class="mt-1 block text-[#64748b]">{{ item[1] }}</small></div></div></div>
        <div class="grid gap-4 sm:grid-cols-2"><article class="rounded-lg border border-white/[0.07] bg-[#202126] p-5"><Users :size="21" class="text-[#d292f4]" /><h3 class="mt-4 font-semibold">研究协作</h3><p class="mt-2 text-sm leading-6">通过机构、角色和项目成员关系管理团队协作范围。</p></article><article class="rounded-lg border border-white/[0.07] bg-[#202126] p-5"><ShieldCheck :size="21" class="text-[#d292f4]" /><h3 class="mt-4 font-semibold">可控的数据边界</h3><p class="mt-2 text-sm leading-6">公开项目与机构私有数据使用清晰的权限边界。</p></article></div>
      </div>
    </section>

    <section class="border-t border-white/[0.06] bg-[#202126] py-14">
      <div class="section-container flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"><div><h2 class="text-2xl font-semibold">准备好开始您的病理AI分析了吗？</h2><p class="mt-2 text-sm">选择模型和分析对象，创建第一条可追踪的分析任务。</p></div><button class="btn-primary h-11 shrink-0 px-6" @click="router.push('/explore')"><Play :size="16" />立即开始分析</button></div>
    </section>
  </div>
</template>
